import { Router, Request, Response, NextFunction } from 'express';
import {
  DoctorCreateInputSchema,
  DoctorUpdateInputSchema,
  InventoryUpdateInputSchema,
} from '@medisync/shared';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import { validate } from '../middleware/validate';
import { ApiError } from '../lib/errors';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { dbStore, DoctorRecord } from '../services/dataStore';
import { logAudit, getRecentAuditLogs } from '../services/auditService';
import { appCache } from '../lib/cache';

export const staffRouter = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

// Staff authentication & role check applied to all staff routes
staffRouter.use(requireAuth, requireRole('staff'));

// PATCH /api/staff/doctors/:id
staffRouter.patch(
  '/staff/doctors/:id',
  validate(DoctorUpdateInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const staffHospitalId = req.user?.hospital_id;

      let doctor: DoctorRecord | null = null;

      if (isMockSupabase) {
        doctor = dbStore.doctors.find((d) => d.id === id) || null;
      } else {
        if (isValidUuid(id)) {
          const { data } = await supabaseAdmin
            .from('doctors')
            .select('*')
            .eq('id', id)
            .single();
          if (data) doctor = data as DoctorRecord;
        }
        if (!doctor) {
          doctor = dbStore.doctors.find((d) => d.id === id) || null;
        }
      }

      if (!doctor) {
        throw ApiError.notFound('Doctor not found');
      }

      // Check hospital match if staff is restricted to one hospital
      if (staffHospitalId && doctor.hospital_id !== staffHospitalId) {
        throw ApiError.forbidden('Cannot manage doctors from another hospital');
      }

      const prevStatus = doctor.status;
      if (updates.status !== undefined) doctor.status = updates.status;
      if (updates.waiting_count !== undefined) doctor.waiting_count = updates.waiting_count;
      if (updates.avg_wait_minutes !== undefined)
        doctor.avg_wait_minutes = updates.avg_wait_minutes;
      if (updates.wing !== undefined) doctor.wing = updates.wing;
      if (updates.floor !== undefined) doctor.floor = updates.floor;
      doctor.updated_at = new Date().toISOString();

      if (!isMockSupabase && isValidUuid(id)) {
        const { error: updateError } = await supabaseAdmin
          .from('doctors')
          .update({
            status: doctor.status,
            waiting_count: doctor.waiting_count,
            avg_wait_minutes: doctor.avg_wait_minutes,
            wing: doctor.wing,
            floor: doctor.floor,
            updated_at: doctor.updated_at,
          })
          .eq('id', id);
        if (updateError) {
          console.error('Failed to update doctor in Supabase:', updateError);
        }
      }

      // Always synchronize dbStore in-memory store
      const inMemoryDoc = dbStore.doctors.find((d) => d.id === id);
      if (inMemoryDoc) {
        if (updates.status !== undefined) inMemoryDoc.status = updates.status;
        if (updates.waiting_count !== undefined) inMemoryDoc.waiting_count = updates.waiting_count;
        if (updates.avg_wait_minutes !== undefined)
          inMemoryDoc.avg_wait_minutes = updates.avg_wait_minutes;
        if (updates.wing !== undefined) inMemoryDoc.wing = updates.wing;
        if (updates.floor !== undefined) inMemoryDoc.floor = updates.floor;
        inMemoryDoc.updated_at = doctor.updated_at;
      }

      // Invalidate dashboard summary cache
      appCache.invalidate('dashboard_summary');

      await logAudit({
        actorId: req.user!.id,
        actorName: req.user!.profile.full_name,
        action: 'DOCTOR_UPDATED',
        entity: 'doctors',
        entityId: id,
        meta: {
          doctor_name: doctor.full_name,
          new_status: doctor.status,
          previous_status: prevStatus,
          waiting_count: doctor.waiting_count,
        },
      });

      res.json({
        success: true,
        doctor,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/staff/doctors
staffRouter.post(
  '/staff/doctors',
  validate(DoctorCreateInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body;
      const staffHospitalId = req.user?.hospital_id;

      if (staffHospitalId && input.hospital_id !== staffHospitalId) {
        throw ApiError.forbidden('Cannot create doctors for another hospital');
      }

      const newDoctor: DoctorRecord = {
        id: `d-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        hospital_id: input.hospital_id,
        full_name: input.full_name,
        specialty: input.specialty,
        level: input.level,
        status: input.status || 'AVAILABLE',
        wing: input.wing || 'Wing A',
        floor: input.floor ?? 1,
        waiting_count: input.waiting_count ?? 0,
        avg_wait_minutes: input.avg_wait_minutes ?? 0,
        updated_at: new Date().toISOString(),
      };

      if (isMockSupabase) {
        dbStore.doctors.unshift(newDoctor);
      } else {
        const { data, error } = await supabaseAdmin
          .from('doctors')
          .insert({
            hospital_id: newDoctor.hospital_id,
            full_name: newDoctor.full_name,
            specialty: newDoctor.specialty,
            level: newDoctor.level,
            status: newDoctor.status,
            wing: newDoctor.wing,
            floor: newDoctor.floor,
            waiting_count: newDoctor.waiting_count,
            avg_wait_minutes: newDoctor.avg_wait_minutes,
          })
          .select()
          .single();

        if (!error && data) {
          newDoctor.id = data.id;
        } else {
          dbStore.doctors.unshift(newDoctor);
        }
      }

      appCache.invalidate('dashboard_summary');

      await logAudit({
        actorId: req.user!.id,
        actorName: req.user!.profile.full_name,
        action: 'DOCTOR_CREATED',
        entity: 'doctors',
        entityId: newDoctor.id,
        meta: { doctor_name: newDoctor.full_name, specialty: newDoctor.specialty },
      });

      res.status(201).json({ success: true, doctor: newDoctor });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/staff/doctors/:id
staffRouter.delete(
  '/staff/doctors/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const idx = dbStore.doctors.findIndex((d) => d.id === id);
      const doctor = idx >= 0 ? dbStore.doctors[idx] : null;

      if (!isMockSupabase) {
        await supabaseAdmin.from('doctors').delete().eq('id', id);
      }

      if (idx >= 0) {
        dbStore.doctors.splice(idx, 1);
      }

      appCache.invalidate('dashboard_summary');

      await logAudit({
        actorId: req.user!.id,
        actorName: req.user!.profile.full_name,
        action: 'DOCTOR_DELETED',
        entity: 'doctors',
        entityId: id,
        meta: { doctor_name: doctor?.full_name },
      });

      res.json({ success: true, message: 'Doctor deleted' });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/staff/inventory/:id
staffRouter.patch(
  '/staff/inventory/:id',
  validate(InventoryUpdateInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { available, total } = req.body;

      let item = dbStore.inventory.find((i) => i.id === id);

      if (!item && !isMockSupabase && isValidUuid(id)) {
        const { data } = await supabaseAdmin
          .from('inventory')
          .select('*')
          .eq('id', id)
          .single();
        if (data) item = data;
      }

      if (!item) {
        throw ApiError.notFound('Inventory item not found');
      }

      const finalTotal = total !== undefined ? total : item.total;
      if (available > finalTotal) {
        throw ApiError.badRequest('Available count cannot exceed total count');
      }

      item.available = available;
      if (total !== undefined) item.total = total;
      item.updated_at = new Date().toISOString();

      if (!isMockSupabase && isValidUuid(id)) {
        const { error: updateError } = await supabaseAdmin
          .from('inventory')
          .update({
            available: item.available,
            total: item.total,
            updated_at: item.updated_at,
          })
          .eq('id', id);
        if (updateError) {
          console.error('Failed to update inventory in Supabase:', updateError);
        }
      }

      // Always synchronize dbStore in-memory store
      const inMemoryItem = dbStore.inventory.find((i) => i.id === id);
      if (inMemoryItem) {
        inMemoryItem.available = item.available;
        if (total !== undefined) inMemoryItem.total = total;
        inMemoryItem.updated_at = item.updated_at;
      }

      appCache.invalidate('dashboard_summary');

      await logAudit({
        actorId: req.user!.id,
        actorName: req.user!.profile.full_name,
        action: 'INVENTORY_UPDATED',
        entity: 'inventory',
        entityId: id,
        meta: { type: item.type, available: item.available, total: item.total },
      });

      res.json({ success: true, inventory: item });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/staff/audit
staffRouter.get('/staff/audit', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await getRecentAuditLogs(30);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});
