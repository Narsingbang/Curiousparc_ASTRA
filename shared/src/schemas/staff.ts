import { z } from 'zod';
import { DOCTOR_LEVELS, DOCTOR_STATUSES, MEDICAL_SPECIALTIES, RESOURCE_TYPES } from '../constants';

export const DoctorUpdateInputSchema = z
  .object({
    status: z.enum(DOCTOR_STATUSES).optional(),
    waiting_count: z.coerce.number().int().min(0).optional(),
    avg_wait_minutes: z.coerce.number().int().min(0).optional(),
    wing: z.string().trim().optional(),
    floor: z.coerce.number().int().optional(),
  })
  .strict();

export type DoctorUpdateInput = z.infer<typeof DoctorUpdateInputSchema>;

export const DoctorCreateInputSchema = z
  .object({
    hospital_id: z.string().uuid(),
    full_name: z
      .string()
      .trim()
      .min(2, 'Doctor name must be at least 2 characters')
      .max(80),
    specialty: z.enum(MEDICAL_SPECIALTIES),
    level: z.enum(DOCTOR_LEVELS),
    status: z.enum(DOCTOR_STATUSES).default('AVAILABLE'),
    wing: z.string().trim().optional(),
    floor: z.coerce.number().int().optional(),
    waiting_count: z.coerce.number().int().min(0).default(0),
    avg_wait_minutes: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type DoctorCreateInput = z.infer<typeof DoctorCreateInputSchema>;

export const InventoryUpdateInputSchema = z
  .object({
    available: z.coerce.number().int().min(0, 'Available count cannot be negative'),
    total: z.coerce.number().int().min(0, 'Total count cannot be negative').optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.total !== undefined && data.available > data.total) {
        return false;
      }
      return true;
    },
    {
      message: 'Available count cannot exceed total count',
      path: ['available'],
    }
  );

export type InventoryUpdateInput = z.infer<typeof InventoryUpdateInputSchema>;

export interface DashboardSummary {
  doctors: {
    available: number;
    total: number;
    ratio: number;
  };
  beds: {
    open: number;
    total: number;
    ratio: number;
  };
  waiting: number;
  severeActive: number;
  resources: {
    ambulances: { available: number; total: number; ratio: number };
    emergencyBeds: { available: number; total: number; ratio: number };
    icuBeds: { available: number; total: number; ratio: number };
    ventilators: { available: number; total: number; ratio: number };
  };
  hospitalsCount: number;
  lastUpdated: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_name?: string;
  action: string;
  entity: string;
  entity_id: string | null;
  meta: Record<string, any>;
  created_at: string;
}
