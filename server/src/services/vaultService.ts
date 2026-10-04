import {
  PatientRecord,
  RecordCreateInput,
  RecordUpdateInput,
  UserProfile,
  VaultProfileInput,
} from '@medisync/shared';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { dbStore, PatientRecordDbRecord } from './dataStore';
import { ApiError } from '../lib/errors';
import { logger } from '../lib/logger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export async function getVaultData(
  userId: string,
  opts?: {
    severity?: string;
    from?: string;
    to?: string;
  }
): Promise<{
  records: PatientRecord[];
  stats: { total: number; mild: number; severe: number };
}> {
  let records: any[] = [];

  if (!isMockSupabase && isValidUuid(userId)) {
    try {
      let query = supabaseAdmin
        .from('patient_records')
        .select('*, doctors(full_name, specialty, hospitals(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (opts?.severity) {
        query = query.eq('severity', opts.severity);
      }
      if (opts?.from) {
        query = query.gte('created_at', opts.from);
      }
      if (opts?.to) {
        query = query.lte('created_at', opts.to);
      }

      const { data, error } = await query;
      if (!error && data) {
        records = data;
      }
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Failed to fetch vault records from Supabase, falling back to memory');
    }
  }

  // Merge in-memory records for this user (deduplicating by ID)
  for (const memRec of dbStore.patientRecords) {
    if (memRec.user_id === userId && !records.some((r) => r.id === memRec.id)) {
      if (!opts?.severity || memRec.severity === opts.severity) {
        records.push(memRec);
      }
    }
  }

  // Filter in-memory if needed
  if (opts?.severity) {
    records = records.filter((r) => r.severity === opts.severity);
  }

  records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const mapped: PatientRecord[] = records.map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    source: r.source,
    title: r.title,
    symptoms: r.symptoms,
    severity: r.severity,
    ai_summary: r.ai_summary,
    doctor_id: r.doctor_id,
    doctor_name: r.doctors?.full_name || (r.doctor_id ? 'Dr. Assigned' : null),
    doctor_specialty: r.doctors?.specialty,
    hospital_name: r.doctors?.hospitals?.name,
    triage_session_id: r.triage_session_id,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  const mild = mapped.filter((r) => r.severity === 'MILD').length;
  const severe = mapped.filter((r) => r.severity === 'SEVERE').length;

  return {
    records: mapped,
    stats: {
      total: mapped.length,
      mild,
      severe,
    },
  };
}

export async function createPatientRecord(
  userId: string,
  input: RecordCreateInput
): Promise<PatientRecord> {
  const newRecord: PatientRecordDbRecord = {
    id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    source: input.source || 'MANUAL',
    title: input.title,
    symptoms: input.symptoms || null,
    severity: input.severity || null,
    ai_summary: input.ai_summary || null,
    doctor_id: input.doctor_id || null,
    triage_session_id: input.triage_session_id || null,
    notes: input.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!isMockSupabase && isValidUuid(userId)) {
    const docId = isValidUuid(newRecord.doctor_id) ? newRecord.doctor_id : null;
    const sessId = isValidUuid(newRecord.triage_session_id) ? newRecord.triage_session_id : null;

    const { data, error } = await supabaseAdmin
      .from('patient_records')
      .insert({
        user_id: userId,
        source: newRecord.source,
        title: newRecord.title,
        symptoms: newRecord.symptoms,
        severity: newRecord.severity,
        ai_summary: newRecord.ai_summary,
        doctor_id: docId,
        triage_session_id: sessId,
        notes: newRecord.notes,
      })
      .select()
      .single();

    if (error) {
      // If user_id is not in auth.users (foreign key 23503), allow in-memory fallback for local demo
      if (error.code === '23503' && error.message.includes('patient_records_user_id_fkey')) {
        logger.warn({ error: error.message }, 'User ID not in auth.users, persisting in memory store');
      } else {
        logger.error(
          {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            userId,
          },
          'Failed to insert patient record into Supabase'
        );
        throw error;
      }
    } else if (data) {
      newRecord.id = data.id;
    }
  }

  // Always keep in memory store for immediate consistency
  dbStore.patientRecords.unshift(newRecord);

  return {
    ...newRecord,
    doctor_name: null,
  };
}

export async function updatePatientRecord(
  userId: string,
  recordId: string,
  input: RecordUpdateInput
): Promise<PatientRecord> {
  const memRecord = dbStore.patientRecords.find(
    (r) => r.id === recordId && r.user_id === userId
  );

  if (memRecord) {
    if (input.title !== undefined) memRecord.title = input.title;
    if (input.symptoms !== undefined) memRecord.symptoms = input.symptoms;
    if (input.severity !== undefined) memRecord.severity = input.severity;
    if (input.notes !== undefined) memRecord.notes = input.notes;
    memRecord.updated_at = new Date().toISOString();
  }

  if (!isMockSupabase && isValidUuid(recordId) && isValidUuid(userId)) {
    const { data, error } = await supabaseAdmin
      .from('patient_records')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error(
        {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          recordId,
          userId,
        },
        'Failed to update patient record in Supabase'
      );
      throw error;
    }

    if (data) {
      return data as PatientRecord;
    }
  }

  if (memRecord) {
    return {
      ...memRecord,
      doctor_name: null,
    };
  }

  throw ApiError.notFound('Record not found or access denied');
}

export async function deletePatientRecord(
  userId: string,
  recordId: string
): Promise<void> {
  let found = false;
  const idx = dbStore.patientRecords.findIndex(
    (r) => r.id === recordId && r.user_id === userId
  );
  if (idx !== -1) {
    dbStore.patientRecords.splice(idx, 1);
    found = true;
  }

  if (!isMockSupabase && isValidUuid(recordId) && isValidUuid(userId)) {
    const { error } = await supabaseAdmin
      .from('patient_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);

    if (error) {
      logger.error({ error, recordId, userId }, 'Failed to delete record from Supabase');
      throw error;
    }
    found = true;
  }

  if (!found) {
    throw ApiError.notFound('Record not found or access denied');
  }
}

export async function updateVaultProfile(
  userId: string,
  input: VaultProfileInput
): Promise<UserProfile> {
  const profile: UserProfile = {
    id: userId,
    full_name: input.full_name || 'Demo Patient',
    role: 'patient',
    phone: input.phone || null,
    blood_group: input.blood_group || null,
    allergies: input.allergies || [],
    chronic_conditions: input.chronic_conditions || [],
    emergency_contact: input.emergency_contact || null,
  };

  if (!isMockSupabase && isValidUuid(userId)) {
    try {
      const updateFields: any = {
        updated_at: new Date().toISOString(),
      };
      if (input.full_name) updateFields.full_name = input.full_name;
      if (input.phone !== undefined) updateFields.phone = input.phone;
      if (input.blood_group !== undefined) updateFields.blood_group = input.blood_group;
      if (input.allergies !== undefined) updateFields.allergies = input.allergies;
      if (input.chronic_conditions !== undefined)
        updateFields.chronic_conditions = input.chronic_conditions;
      if (input.emergency_contact !== undefined)
        updateFields.emergency_contact = input.emergency_contact;

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateFields)
        .eq('id', userId)
        .select()
        .single();

      if (!error && data) {
        return data as UserProfile;
      }
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Failed to update profile in Supabase');
    }
  }

  return profile;
}
