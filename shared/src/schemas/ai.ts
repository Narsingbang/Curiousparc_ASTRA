import { z } from 'zod';
import { MEDICAL_SPECIALTIES, SEVERITY_LEVELS, DISPATCH_NEEDS, DispatchNeed } from '../constants';

export const TriageAssessmentSchema = z
  .object({
    severity: z.enum(SEVERITY_LEVELS),
    is_emergency: z.boolean(),
    specialty: z.enum(MEDICAL_SPECIALTIES),
    red_flags: z.array(z.string()).max(6).default([]),
    summary: z.string().max(500),
    advice: z.array(z.string()).max(5).default([]),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export type TriageAssessment = z.infer<typeof TriageAssessmentSchema>;

export const TriageTurnNeedsMoreInfoSchema = z
  .object({
    status: z.literal('NEEDS_MORE_INFO'),
    assistant_message: z.string().max(500),
    assessment: z.undefined().optional(),
  })
  .strict();

export const TriageTurnCompleteSchema = z
  .object({
    status: z.literal('COMPLETE'),
    assistant_message: z.string().max(500),
    assessment: TriageAssessmentSchema,
  })
  .strict();

export const TriageTurnResponseSchema = z.discriminatedUnion('status', [
  TriageTurnNeedsMoreInfoSchema,
  TriageTurnCompleteSchema,
]);

export type TriageTurnResponse = z.infer<typeof TriageTurnResponseSchema>;

export const RecordSummarySchema = z
  .object({
    title: z.string().max(80),
    chief_complaint: z.string(),
    duration: z.string(),
    associated_symptoms: z.array(z.string()).max(8).default([]),
    severity: z.enum(SEVERITY_LEVELS),
    suggested_specialty: z.string(),
    patient_friendly_summary: z.string().max(300),
  })
  .strict();

export type RecordSummary = z.infer<typeof RecordSummarySchema>;

export const URGENCY_LEVELS = ['CRITICAL', 'HIGH', 'MODERATE'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const SUSPECTED_CATEGORIES = [
  'CARDIAC',
  'RESPIRATORY',
  'NEURO_STROKE',
  'TRAUMA',
  'OBSTETRIC',
  'PEDIATRIC',
  'POISONING_OVERDOSE',
  'PSYCHIATRIC_CRISIS',
  'OTHER',
] as const;
export type SuspectedCategory = (typeof SUSPECTED_CATEGORIES)[number];

export const DispatchBriefSchema = z
  .object({
    urgency: z.enum(URGENCY_LEVELS),
    needs: z.array(z.enum(DISPATCH_NEEDS)).min(1),
    suspected_category: z.enum(SUSPECTED_CATEGORIES),
    specialty: z.string(),
    paramedic_note: z.string().max(240),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export type DispatchBrief = z.infer<typeof DispatchBriefSchema>;
