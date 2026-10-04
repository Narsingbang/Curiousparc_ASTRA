import { z } from 'zod';
import { TriageAssessmentSchema } from './ai';
import { DOCTOR_LEVELS, DOCTOR_STATUSES } from '../constants';

export const TriageMessageInputSchema = z
  .object({
    session_id: z.string().uuid().optional(),
    session_token: z.string().optional(),
    message: z
      .string()
      .trim()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message cannot exceed 1000 characters'),
    city: z.string().trim().optional(),
  })
  .strict();

export type TriageMessageInput = z.infer<typeof TriageMessageInputSchema>;

export const RoutedDoctorSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  specialty: z.string(),
  level: z.enum(DOCTOR_LEVELS),
  status: z.enum(DOCTOR_STATUSES),
  wing: z.string().nullable().optional(),
  floor: z.number().nullable().optional(),
  waiting_count: z.number(),
  avg_wait_minutes: z.number(),
  hospital_id: z.string().uuid(),
  hospital_name: z.string(),
  hospital_city: z.string(),
  hospital_address: z.string().optional(),
  hospital_phone: z.string().nullable().optional(),
});

export type RoutedDoctor = z.infer<typeof RoutedDoctorSchema>;

export const TriageApiResponseSchema = z.object({
  session_id: z.string().uuid(),
  session_token: z.string(),
  status: z.enum(['NEEDS_MORE_INFO', 'COMPLETE']),
  assistant_message: z.string(),
  assessment: TriageAssessmentSchema.optional(),
  routed_doctor: RoutedDoctorSchema.optional(),
  emergency_banner: z.boolean().optional(),
  follow_ups_remaining: z.number().optional(),
  is_fallback: z.boolean().optional(),
});

export type TriageApiResponse = z.infer<typeof TriageApiResponseSchema>;

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
