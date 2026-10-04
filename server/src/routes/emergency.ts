import { Router, Request, Response, NextFunction } from 'express';
import {
  EmergencyRequestInputSchema,
  StatusUpdateInputSchema,
  DispatchStatus,
  DispatchBrief,
  DispatchBriefSchema,
} from '@medisync/shared';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { emergencyLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { ApiError } from '../lib/errors';
import { generateStructured } from '../lib/gemini';
import { buildDispatchBriefPrompt, dispatchBriefResponseSchema } from '../prompts/dispatchBrief';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { dbStore, EmergencyRequestDbRecord } from '../services/dataStore';
import { logAudit } from '../services/auditService';
import { rankHospitals } from '../services/hospitalRanking';
import { logger } from '../lib/logger';

export const emergencyRouter = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

// Legal state machine transitions:
// PENDING -> ASSIGNED -> EN_ROUTE -> ARRIVED -> COMPLETED
// CANCELLED allowed from PENDING, ASSIGNED, EN_ROUTE
const LEGAL_TRANSITIONS: Record<DispatchStatus, DispatchStatus[]> = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// POST /api/emergency-requests
emergencyRouter.post(
  '/emergency-requests',
  emergencyLimiter,
  optionalAuth,
  validate(EmergencyRequestInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { patient_name, phone, location_text, lat, lng, notes, website } = req.body;

      // Honeypot check
      if (website && website.length > 0) {
        throw ApiError.badRequest('Automated bot submission rejected');
      }

      // 1. AI Dispatch Brief Extraction (Prompt 3)
      let brief: DispatchBrief;
      try {
        const prompt = buildDispatchBriefPrompt(notes || '', location_text);
        brief = await generateStructured({
          systemInstruction:
            'You are an emergency medical dispatch assistant extracting hospital resource needs.',
          userContent: prompt,
          responseSchema: dispatchBriefResponseSchema,
          zod: DispatchBriefSchema,
          maxOutputTokens: 512,
        });
      } catch (err: any) {
        logger.warn({ err: err.message }, 'Gemini dispatch brief fallback activated');
        brief = {
          urgency: 'HIGH',
          needs: ['EMERGENCY_BED'],
          suspected_category: 'OTHER',
          specialty: 'Emergency Medicine',
          paramedic_note: 'Standard emergency transfer requested. Emergency bed prepared.',
          confidence: 0.8,
        };
      }

      // 2. Recommend Hospital
      const hospitals = dbStore.hospitals.map((h) => ({
        id: h.id,
        name: h.name,
        city: h.city,
        address: h.address,
        lat: h.lat,
        lng: h.lng,
        phone: h.phone,
        inventory: dbStore.inventory.filter((i) => i.hospital_id === h.id),
        doctors: dbStore.doctors.filter((d) => d.hospital_id === h.id),
      }));

      const recommendations = rankHospitals({
        hospitals,
        userLat: lat,
        userLng: lng,
        needs: brief.needs,
        specialty: brief.specialty,
      });

      const bestHospital = recommendations[0] || null;

      // 3. Store Emergency Request
      const requestId = `e-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const requestRecord: EmergencyRequestDbRecord = {
        id: requestId,
        requester_id: req.user?.id || null,
        patient_name,
        phone,
        location_text,
        lat: lat || null,
        lng: lng || null,
        notes: notes || null,
        ai_brief: brief,
        needs: brief.needs,
        status: 'PENDING',
        assigned_hospital_id: bestHospital ? bestHospital.hospital_id : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isMockSupabase) {
        dbStore.emergencyRequests.unshift(requestRecord);
      } else {
        try {
          const reqId = isValidUuid(requestRecord.requester_id) ? requestRecord.requester_id : null;
          const hospId = isValidUuid(requestRecord.assigned_hospital_id) ? requestRecord.assigned_hospital_id : null;

          const { data, error } = await supabaseAdmin
            .from('emergency_requests')
            .insert({
              requester_id: reqId,
              patient_name: requestRecord.patient_name,
              phone: requestRecord.phone,
              location_text: requestRecord.location_text,
              lat: requestRecord.lat,
              lng: requestRecord.lng,
              notes: requestRecord.notes,
              ai_brief: requestRecord.ai_brief,
              needs: requestRecord.needs,
              status: requestRecord.status,
              assigned_hospital_id: hospId,
            })
            .select()
            .single();

          if (!error && data) {
            requestRecord.id = data.id;
          }
        } catch {
          // fallback to memory
        }
        dbStore.emergencyRequests.unshift(requestRecord);
      }

      await logAudit({
        actorId: isValidUuid(req.user?.id) ? req.user!.id : null,
        actorName: patient_name,
        action: 'EMERGENCY_DISPATCH_REQUESTED',
        entity: 'emergency_requests',
        entityId: isValidUuid(requestRecord.id) ? requestRecord.id : null,
        meta: {
          urgency: brief.urgency,
          needs: brief.needs,
          assigned_hospital: bestHospital?.name,
        },
      });

      res.status(201).json({
        id: requestRecord.id,
        status: requestRecord.status,
        patient_name,
        phone,
        location_text,
        recommended_hospital: bestHospital,
        brief,
        created_at: requestRecord.created_at,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/emergency-requests (ambulance / staff)
emergencyRouter.get(
  '/emergency-requests',
  requireAuth,
  requireRole('ambulance', 'staff'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string | undefined;

      let list: any[] = [];
      if (!isMockSupabase) {
        try {
          let query = supabaseAdmin
            .from('emergency_requests')
            .select('*, hospitals(name, city)')
            .order('created_at', { ascending: false });

          if (status && status !== 'All') {
            query = query.eq('status', status);
          }

          const { data, error } = await query;
          if (!error && data) {
            list = data.map((d: any) => ({
              ...d,
              assigned_hospital_name: d.hospitals?.name || undefined,
            }));
          }
        } catch (err: any) {
          logger.warn({ err: err.message }, 'Failed to fetch emergency requests from Supabase');
        }
      }

      // Merge in-memory requests
      for (const memReq of dbStore.emergencyRequests) {
        if (!list.some((r) => r.id === memReq.id)) {
          if (!status || status === 'All' || memReq.status === status) {
            const hospital = dbStore.hospitals.find((h) => h.id === memReq.assigned_hospital_id);
            list.push({
              ...memReq,
              hospitals: hospital ? { name: hospital.name, city: hospital.city } : null,
              assigned_hospital_name: hospital?.name,
            });
          }
        }
      }

      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      res.json({ requests: list });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/emergency-requests/mine (user's own)
emergencyRouter.get(
  '/emergency-requests/mine',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      let list: any[] = [];
      if (!isMockSupabase && isValidUuid(userId)) {
        try {
          const { data, error } = await supabaseAdmin
            .from('emergency_requests')
            .select('*, hospitals(name, city, address, phone)')
            .eq('requester_id', userId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            list = data.map((d: any) => ({
              ...d,
              assigned_hospital_name: d.hospitals?.name || undefined,
            }));
          }
        } catch (err: any) {
          logger.warn({ err: err.message }, 'Failed to fetch user emergency requests from Supabase');
        }
      }

      for (const memReq of dbStore.emergencyRequests) {
        if (memReq.requester_id === userId && !list.some((r) => r.id === memReq.id)) {
          const hospital = dbStore.hospitals.find((h) => h.id === memReq.assigned_hospital_id);
          list.push({
            ...memReq,
            hospitals: hospital ? { name: hospital.name, city: hospital.city } : null,
            assigned_hospital_name: hospital?.name,
          });
        }
      }

      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      res.json({ requests: list });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/emergency-requests/:id/status
emergencyRouter.patch(
  '/emergency-requests/:id/status',
  requireAuth,
  requireRole('ambulance', 'staff'),
  validate(StatusUpdateInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status: targetStatus } = req.body as { status: DispatchStatus };

      let currentRequest: EmergencyRequestDbRecord | null = null;

      if (isMockSupabase) {
        currentRequest = dbStore.emergencyRequests.find((r) => r.id === id) || null;
      } else {
        if (isValidUuid(id)) {
          try {
            const { data } = await supabaseAdmin
              .from('emergency_requests')
              .select('*')
              .eq('id', id)
              .single();
            if (data) currentRequest = data as EmergencyRequestDbRecord;
          } catch {
            // fallback
          }
        }
        if (!currentRequest) {
          currentRequest = dbStore.emergencyRequests.find((r) => r.id === id) || null;
        }
      }

      if (!currentRequest) {
        throw ApiError.notFound('Emergency request not found');
      }

      const allowedNext = LEGAL_TRANSITIONS[currentRequest.status];
      if (!allowedNext.includes(targetStatus)) {
        throw ApiError.conflict(
          `Illegal status transition from ${currentRequest.status} to ${targetStatus}. Allowed: ${allowedNext.join(', ')}`
        );
      }

      currentRequest.status = targetStatus;
      currentRequest.updated_at = new Date().toISOString();

      if (!isMockSupabase && isValidUuid(id)) {
        try {
          await supabaseAdmin
            .from('emergency_requests')
            .update({
              status: targetStatus,
              updated_at: currentRequest.updated_at,
            })
            .eq('id', id);
        } catch (err: any) {
          logger.warn({ err: err.message }, 'Failed to update emergency request status in Supabase');
        }
      }

      const memMatch = dbStore.emergencyRequests.find((r) => r.id === id);
      if (memMatch) {
        memMatch.status = targetStatus;
        memMatch.updated_at = currentRequest.updated_at;
      }

      await logAudit({
        actorId: isValidUuid(req.user?.id) ? req.user!.id : null,
        actorName: req.user!.profile.full_name,
        action: 'EMERGENCY_STATUS_UPDATED',
        entity: 'emergency_requests',
        entityId: isValidUuid(id) ? id : null,
        meta: { new_status: targetStatus },
      });

      res.json({
        success: true,
        request: currentRequest,
      });
    } catch (err) {
      next(err);
    }
  }
);
