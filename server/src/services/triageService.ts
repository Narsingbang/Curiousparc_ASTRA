import crypto from 'crypto';
import {
  ChatMessage,
  MedicalSpecialty,
  STANDARD_ADVISORIES,
  TriageApiResponse,
  TriageAssessment,
  TriageAssessmentSchema,
  TriageTurnResponseSchema,
} from '@medisync/shared';
import { env } from '../config/env';
import { generateStructured } from '../lib/gemini';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { buildTriageTurnPrompt, triageTurnResponseSchema } from '../prompts/triageTurn';
import { TRIAGE_SYSTEM_PROMPT } from '../prompts/system';
import { scanRedFlags } from './redFlags';
import { routeDoctor, DoctorCandidate } from './triageRouting';
import { dbStore, TriageSessionDbRecord, PatientRecordDbRecord } from './dataStore';
import { logger } from '../lib/logger';
import { ApiError } from '../lib/errors';

export function generateSessionToken(sessionId: string): string {
  return crypto
    .createHmac('sha256', env.SESSION_SECRET)
    .update(sessionId)
    .digest('hex');
}

export function verifySessionToken(sessionId: string, token: string): boolean {
  const expected = generateSessionToken(sessionId);
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

interface FallbackQuestion {
  key: string;
  question: string;
  matches: (text: string) => boolean;
}

const FALLBACK_QUESTIONS: FallbackQuestion[] = [
  {
    key: 'duration',
    question:
      'Could you tell me how long you have had these symptoms (e.g. hours, days, or weeks)?',
    matches: (t: string) =>
      t.includes('how long') || t.includes('hours, days') || t.includes('duration'),
  },
  {
    key: 'severity',
    question:
      'On a scale of 1 to 10 (with 1 being very mild and 10 being severe/unbearable), how intense is your discomfort right now?',
    matches: (t: string) =>
      t.includes('1 to 10') || t.includes('scale') || t.includes('how intense'),
  },
  {
    key: 'other_symptoms',
    question:
      'Are you experiencing any other symptoms, such as fever, dizziness, nausea, or localized weakness?',
    matches: (t: string) =>
      t.includes('other symptoms') ||
      t.includes('fever, dizziness') ||
      t.includes('associated symptoms'),
  },
];

export async function processTriageMessage(opts: {
  sessionId?: string;
  sessionToken?: string;
  message: string;
  city?: string;
  userId?: string;
}): Promise<TriageApiResponse> {
  const { city, userId } = opts;
  let sessionId = opts.sessionId;

  // 1. Session Retrieval or Initialization
  let session: TriageSessionDbRecord | null = null;

  if (sessionId) {
    if (!opts.sessionToken || !verifySessionToken(sessionId, opts.sessionToken)) {
      throw ApiError.unauthorized('Invalid or missing triage session token');
    }

    if (!isMockSupabase) {
      try {
        const { data, error } = await supabaseAdmin
          .from('triage_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();
        if (data && !error) {
          session = data as TriageSessionDbRecord;
        }
      } catch (err: any) {
        logger.warn({ err: err.message }, 'Failed to fetch triage session from Supabase, checking memory');
      }
    }

    if (!session) {
      session = dbStore.triageSessions.find((s) => s.id === sessionId) || null;
    }

    if (!session || session.status === 'EXPIRED') {
      throw ApiError.notFound('Triage session expired or not found');
    }
  } else {
    sessionId = crypto.randomUUID();
    session = {
      id: sessionId,
      user_id: userId || null,
      messages: [],
      severity: null,
      is_emergency: false,
      specialty: null,
      red_flags: [],
      summary: null,
      recommended_level: null,
      assigned_doctor_id: null,
      hospital_id: null,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (isMockSupabase) {
      dbStore.triageSessions.push(session);
    } else {
      await supabaseAdmin.from('triage_sessions').insert({
        id: session.id,
        user_id: session.user_id,
        messages: session.messages,
        status: session.status,
      });
    }
  }

  const sessionToken = generateSessionToken(sessionId);

  // Append user message
  const userTurn: ChatMessage = {
    role: 'user',
    text: opts.message,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(userTurn);

  // Calculate follow-ups asked so far
  const followUpsAsked = session.messages.filter((m) => m.role === 'assistant').length;

  // 2. Pre-filter Red Flags & Self-Harm
  const fullText = session.messages.map((m) => m.text).join(' ');
  const scan = scanRedFlags(fullText);

  // Immediate crisis protocol for self-harm
  if (scan.isSelfHarm) {
    const assistantMsg = STANDARD_ADVISORIES.SELF_HARM;
    const assessment: TriageAssessment = {
      severity: 'SEVERE',
      is_emergency: true,
      specialty: 'Psychiatry',
      red_flags: scan.detectedFlags,
      summary: 'Patient expressed self-harm thoughts. Crisis intervention triggered.',
      advice: [
        'Call Tele-MANAS (14416) or National Emergency (112) immediately.',
        'Please stay with someone you trust right now.',
      ],
      confidence: 1.0,
    };

    const docResult = await fetchAndRouteDoctor('SEVERE', true, 'Psychiatry', city);

    session.messages.push({
      role: 'assistant',
      text: assistantMsg,
      timestamp: new Date().toISOString(),
    });
    session.severity = 'SEVERE';
    session.is_emergency = true;
    session.specialty = 'Psychiatry';
    session.red_flags = scan.detectedFlags;
    session.summary = assessment.summary;
    session.recommended_level = 'SPECIALIST';
    session.assigned_doctor_id = docResult.routedDoctor?.id || null;
    session.hospital_id = docResult.routedDoctor?.hospital_id || null;
    session.status = 'COMPLETE';

    await saveSession(session, userId, assessment);

    return {
      session_id: sessionId,
      session_token: sessionToken,
      status: 'COMPLETE',
      assistant_message: assistantMsg,
      assessment,
      routed_doctor: docResult.routedDoctor,
      emergency_banner: true,
      follow_ups_remaining: 0,
      is_fallback: false,
    };
  }

  // 3. AI Generation or Fallback
  let turnStatus: 'NEEDS_MORE_INFO' | 'COMPLETE' = 'COMPLETE';
  let assistantMessage = '';
  let assessment: TriageAssessment | undefined;
  let isFallback = false;

  const mustComplete = followUpsAsked >= 3 || scan.hasRedFlag;

  try {
    const prompt = buildTriageTurnPrompt({
      turns: session.messages,
      followUpsAsked,
      redFlags: scan.detectedFlags,
    });

    const aiRes = await generateStructured({
      systemInstruction: TRIAGE_SYSTEM_PROMPT,
      userContent: prompt,
      responseSchema: triageTurnResponseSchema,
      zod: TriageTurnResponseSchema,
      maxOutputTokens: 1024,
    });

    if (mustComplete || aiRes.status === 'COMPLETE') {
      turnStatus = 'COMPLETE';
      assistantMessage = aiRes.assistant_message;

      if (aiRes.assessment) {
        assessment = {
          ...aiRes.assessment,
          red_flags: aiRes.assessment.red_flags ?? [],
          advice: aiRes.assessment.advice ?? [],
        };
      } else {
        assessment = createRuleBasedAssessment(fullText, scan.detectedFlags);
      }
    } else {
      turnStatus = 'NEEDS_MORE_INFO';
      assistantMessage = aiRes.assistant_message;
    }
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Gemini triage unavailable, running rule-based fallback');
    isFallback = true;

    // Previous assistant questions in this session
    const previousAssistantTexts = session.messages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.text.toLowerCase());

    // Find the next question from the fixed list that has not been asked yet
    const nextUnasked = FALLBACK_QUESTIONS.find(
      (q) => !previousAssistantTexts.some((prev) => q.matches(prev))
    );

    // If red-flag detected, or 3 follow-ups already asked, or all 3 questions exhausted: COMPLETE
    if (scan.hasRedFlag || followUpsAsked >= 3 || !nextUnasked) {
      turnStatus = 'COMPLETE';
      assessment = createRuleBasedAssessment(fullText, scan.detectedFlags);
      assistantMessage =
        assessment.severity === 'SEVERE'
          ? 'Based on your symptoms, prompt medical evaluation by a specialist is advised. We have routed your case accordingly.'
          : 'Thank you for providing the details about your symptoms. Based on your responses, we have routed you to an available medical intern for initial care.';
    } else {
      turnStatus = 'NEEDS_MORE_INFO';
      assistantMessage = nextUnasked.question;
    }
  }

  // 4. Deterministic Overrides
  if (turnStatus === 'COMPLETE' && assessment) {
    if (scan.hasRedFlag) {
      assessment.severity = 'SEVERE';
      assessment.is_emergency = true;
      for (const flag of scan.detectedFlags) {
        if (!assessment.red_flags.includes(flag)) {
          assessment.red_flags.push(flag);
        }
      }
    }

    const docResult = await fetchAndRouteDoctor(
      assessment.severity,
      assessment.is_emergency,
      assessment.specialty,
      city
    );

    session.messages.push({
      role: 'assistant',
      text: assistantMessage,
      timestamp: new Date().toISOString(),
    });
    session.severity = assessment.severity;
    session.is_emergency = assessment.is_emergency;
    session.specialty = assessment.specialty;
    session.red_flags = assessment.red_flags;
    session.summary = assessment.summary;
    session.recommended_level =
      assessment.severity === 'SEVERE' || assessment.is_emergency
        ? 'SPECIALIST'
        : 'JUNIOR_INTERN';
    session.assigned_doctor_id = docResult.routedDoctor?.id || null;
    session.hospital_id = docResult.routedDoctor?.hospital_id || null;
    session.status = 'COMPLETE';

    await saveSession(session, userId, assessment);

    return {
      session_id: sessionId,
      session_token: sessionToken,
      status: 'COMPLETE',
      assistant_message: assistantMessage,
      assessment,
      routed_doctor: docResult.routedDoctor,
      emergency_banner: assessment.is_emergency || docResult.emergencyBannerRequired,
      follow_ups_remaining: Math.max(0, 3 - (followUpsAsked + 1)),
      is_fallback: isFallback,
    };
  } else {
    session.messages.push({
      role: 'assistant',
      text: assistantMessage,
      timestamp: new Date().toISOString(),
    });

    await saveSession(session, userId);

    return {
      session_id: sessionId,
      session_token: sessionToken,
      status: 'NEEDS_MORE_INFO',
      assistant_message: assistantMessage,
      follow_ups_remaining: Math.max(0, 3 - (followUpsAsked + 1)),
      is_fallback: isFallback,
    };
  }
}

function createRuleBasedAssessment(
  symptomText: string,
  detectedFlags: string[]
): TriageAssessment {
  const isSevere = detectedFlags.length > 0;
  let specialty: MedicalSpecialty = 'General Medicine';

  const lower = symptomText.toLowerCase();
  if (lower.includes('chest') || lower.includes('heart') || lower.includes('dard')) {
    specialty = 'Cardiology';
  } else if (lower.includes('breath') || lower.includes('cough') || lower.includes('saas')) {
    specialty = 'Pulmonology';
  } else if (lower.includes('throat') || lower.includes('ear') || lower.includes('nose')) {
    specialty = 'ENT';
  } else if (lower.includes('bone') || lower.includes('joint') || lower.includes('fracture')) {
    specialty = 'Orthopedics';
  } else if (lower.includes('stomach') || lower.includes('belly') || lower.includes('vomit')) {
    specialty = 'Gastroenterology';
  } else if (lower.includes('headache') || lower.includes('dizzy') || lower.includes('seizure')) {
    specialty = 'Neurology';
  }

  return {
    severity: isSevere ? 'SEVERE' : 'MILD',
    is_emergency: isSevere,
    specialty,
    red_flags: detectedFlags,
    summary: `Assessment for symptoms: ${symptomText.slice(0, 200)}. ${
      isSevere ? 'Red-flag symptoms detected requiring prompt medical review.' : 'Mild symptom profile observed.'
    }`,
    advice: isSevere
      ? [
          'Seek urgent emergency evaluation at the nearest hospital.',
          'Call 112 or 108 if symptoms worsen rapidly.',
          'Do not exert yourself; remain seated and accompanied.',
        ]
      : [
          'Rest and stay well hydrated.',
          'Consult the assigned intern or general physician if symptoms persist beyond 48 hours.',
          'Monitor your temperature and breathing.',
        ],
    confidence: isSevere ? 0.95 : 0.85,
  };
}

async function fetchAndRouteDoctor(
  severity: 'MILD' | 'SEVERE',
  isEmergency: boolean,
  specialty: string,
  city?: string
) {
  let candidates: DoctorCandidate[] = [];

  if (isMockSupabase) {
    candidates = dbStore.doctors.map((d) => {
      const hospital = dbStore.hospitals.find((h) => h.id === d.hospital_id);
      const erBed = dbStore.inventory.find(
        (i) => i.hospital_id === d.hospital_id && i.type === 'EMERGENCY_BED'
      );
      return {
        id: d.id,
        hospital_id: d.hospital_id,
        full_name: d.full_name,
        specialty: d.specialty,
        level: d.level,
        status: d.status,
        wing: d.wing,
        floor: d.floor,
        waiting_count: d.waiting_count,
        avg_wait_minutes: d.avg_wait_minutes,
        hospital_name: hospital?.name || 'MediSync Central Hospital',
        hospital_city: hospital?.city || 'Pune',
        hospital_address: hospital?.address || 'Shivajinagar, Pune',
        hospital_phone: hospital?.phone || null,
        emergency_beds_available: erBed?.available || 0,
      };
    });
  } else {
    try {
      const { data: doctorsData } = await supabaseAdmin
        .from('doctors')
        .select('*, hospitals(name, city, address, phone)');

      if (doctorsData) {
        candidates = doctorsData.map((d: any) => ({
          id: d.id,
          hospital_id: d.hospital_id,
          full_name: d.full_name,
          specialty: d.specialty,
          level: d.level,
          status: d.status,
          wing: d.wing,
          floor: d.floor,
          waiting_count: d.waiting_count,
          avg_wait_minutes: d.avg_wait_minutes,
          hospital_name: d.hospitals?.name || 'MediSync Hospital',
          hospital_city: d.hospitals?.city || 'Pune',
          hospital_address: d.hospitals?.address,
          hospital_phone: d.hospitals?.phone,
        }));
      }
    } catch {
      // fallback to in-memory store
      candidates = dbStore.doctors.map((d) => ({
        id: d.id,
        hospital_id: d.hospital_id,
        full_name: d.full_name,
        specialty: d.specialty,
        level: d.level,
        status: d.status,
        wing: d.wing,
        floor: d.floor,
        waiting_count: d.waiting_count,
        avg_wait_minutes: d.avg_wait_minutes,
        hospital_name: 'MediSync Central Hospital',
        hospital_city: 'Pune',
      }));
    }
  }

  return routeDoctor({
    severity,
    isEmergency,
    specialty,
    doctors: candidates,
    city,
  });
}

async function saveSession(
  session: TriageSessionDbRecord,
  userId?: string,
  assessment?: TriageAssessment
) {
  session.updated_at = new Date().toISOString();

  const isValidUuid = (val?: string | null): boolean =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  // 1. Update in-memory dbStore session
  const sIdx = dbStore.triageSessions.findIndex((s) => s.id === session.id);
  if (sIdx >= 0) dbStore.triageSessions[sIdx] = session;
  else dbStore.triageSessions.push(session);

  // 2. If signed in and triage COMPLETE, auto-create patient_records row
  if (userId && session.status === 'COMPLETE' && assessment) {
    const newRecord: PatientRecordDbRecord = {
      id: crypto.randomUUID(),
      user_id: userId,
      source: 'TRIAGE',
      title: `${assessment.specialty} Triage Assessment`,
      symptoms: session.messages
        .filter((m) => m.role === 'user')
        .map((m) => m.text)
        .join('; '),
      severity: assessment.severity,
      ai_summary: assessment,
      doctor_id: session.assigned_doctor_id,
      triage_session_id: session.id,
      notes: assessment.summary,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Always keep in dbStore so vault queries immediately find it
    dbStore.patientRecords.unshift(newRecord);

    // Also persist to Supabase if connected
    if (!isMockSupabase && isValidUuid(userId)) {
      try {
        const payload: any = {
          id: newRecord.id,
          user_id: userId,
          source: 'TRIAGE',
          title: newRecord.title,
          symptoms: newRecord.symptoms,
          severity: newRecord.severity,
          ai_summary: newRecord.ai_summary,
          notes: newRecord.notes,
        };
        if (isValidUuid(session.assigned_doctor_id)) {
          payload.doctor_id = session.assigned_doctor_id;
        }
        if (isValidUuid(session.id)) {
          payload.triage_session_id = session.id;
        }

        const { error: insError } = await supabaseAdmin.from('patient_records').insert(payload);
        if (insError) {
          logger.warn({ err: insError }, 'Supabase insert patient_records returned error; preserved in memory');
        }
      } catch (err: any) {
        logger.warn({ err: err.message }, 'Failed to insert patient record to Supabase; preserved in memory');
      }
    }
  }

  // 3. Persist triage session to Supabase
  if (!isMockSupabase && isValidUuid(session.id)) {
    try {
      await supabaseAdmin
        .from('triage_sessions')
        .upsert({
          id: session.id,
          user_id: isValidUuid(session.user_id) ? session.user_id : null,
          messages: session.messages,
          severity: session.severity,
          is_emergency: session.is_emergency,
          specialty: session.specialty,
          red_flags: session.red_flags,
          summary: session.summary,
          recommended_level: session.recommended_level,
          assigned_doctor_id: isValidUuid(session.assigned_doctor_id) ? session.assigned_doctor_id : null,
          hospital_id: isValidUuid(session.hospital_id) ? session.hospital_id : null,
          status: session.status,
          updated_at: session.updated_at,
        });
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Failed to persist triage session to Supabase; preserved in memory');
    }
  }
}
