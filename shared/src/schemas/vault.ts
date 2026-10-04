import { z } from 'zod';
import { BLOOD_GROUPS, SEVERITY_LEVELS } from '../constants';

export const VaultProfileInputSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(80, 'Name must not exceed 80 characters')
      .optional(),
    phone: z.string().trim().nullable().optional(),
    blood_group: z.enum(BLOOD_GROUPS).nullable().optional(),
    allergies: z.array(z.string().trim()).default([]),
    chronic_conditions: z.array(z.string().trim()).default([]),
    emergency_contact: z
      .object({
        name: z.string().trim(),
        phone: z.string().trim(),
        relationship: z.string().trim().optional(),
      })
      .nullable()
      .optional(),
  })
  .strict();

export type VaultProfileInput = z.infer<typeof VaultProfileInputSchema>;

export const RecordCreateInputSchema = z
  .object({
    source: z.enum(['TRIAGE', 'MANUAL', 'AMBULANCE']).default('MANUAL'),
    title: z
      .string()
      .trim()
      .min(2, 'Title must be at least 2 characters')
      .max(160, 'Title cannot exceed 160 characters'),
    symptoms: z.string().trim().optional(),
    severity: z.enum(SEVERITY_LEVELS).optional(),
    ai_summary: z.any().optional(),
    doctor_id: z.string().uuid().nullable().optional(),
    triage_session_id: z.string().uuid().nullable().optional(),
    notes: z.string().trim().optional(),
  })
  .strict();

export type RecordCreateInput = z.infer<typeof RecordCreateInputSchema>;

export const RecordUpdateInputSchema = RecordCreateInputSchema.partial();
export type RecordUpdateInput = z.infer<typeof RecordUpdateInputSchema>;

export interface PatientRecord {
  id: string;
  user_id: string;
  source: 'TRIAGE' | 'MANUAL' | 'AMBULANCE';
  title: string;
  symptoms: string | null;
  severity: 'MILD' | 'SEVERE' | null;
  ai_summary: any;
  doctor_id: string | null;
  doctor_name?: string | null;
  doctor_specialty?: string | null;
  hospital_name?: string | null;
  triage_session_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
