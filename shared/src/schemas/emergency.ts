import { z } from 'zod';
import { IndianPhoneSchema } from './common';
import { DISPATCH_STATUSES, DISPATCH_NEEDS, DispatchNeed, DispatchStatus } from '../constants';

export const EmergencyRequestInputSchema = z
  .object({
    patient_name: z
      .string()
      .trim()
      .min(2, 'Patient name must be at least 2 characters')
      .max(80, 'Patient name must not exceed 80 characters'),
    phone: IndianPhoneSchema,
    location_text: z
      .string()
      .trim()
      .min(5, 'Location must be at least 5 characters')
      .max(300, 'Location must not exceed 300 characters'),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    notes: z.string().trim().max(1000).optional(),
    website: z.string().max(0, 'Spam detected').optional(), // honeypot
  })
  .strict();

export type EmergencyRequestInput = z.infer<typeof EmergencyRequestInputSchema>;

export const RecommendationQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  needs: z
    .preprocess((val) => {
      if (typeof val === 'string') return [val];
      return val;
    }, z.array(z.enum(['EMERGENCY_BED', 'ICU_BED', 'VENTILATOR'])).optional().default([]))
    .optional()
    .default([]),
  specialty: z.string().trim().optional(),
});

export type RecommendationQuery = z.infer<typeof RecommendationQuerySchema>;

export const StatusUpdateInputSchema = z
  .object({
    status: z.enum(DISPATCH_STATUSES),
  })
  .strict();

export type StatusUpdateInput = z.infer<typeof StatusUpdateInputSchema>;

export interface RankedHospitalRecommendation {
  hospital_id: string;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  score: number;
  distance_km: number;
  eta_min: number;
  reasons: string[];
  capacity_summary: {
    ambulances: { available: number; total: number };
    emergency_beds: { available: number; total: number };
    icu_beds: { available: number; total: number };
    ventilators: { available: number; total: number };
  };
  matching_specialist?: string;
}

export interface EmergencyRequestRecord {
  id: string;
  requester_id: string | null;
  patient_name: string;
  phone: string;
  location_text: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  ai_brief: any;
  needs: string[];
  status: DispatchStatus;
  assigned_hospital_id: string | null;
  assigned_hospital_name?: string;
  created_at: string;
  updated_at: string;
}
