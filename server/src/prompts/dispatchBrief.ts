import {
  DISPATCH_NEEDS,
  SUSPECTED_CATEGORIES,
  URGENCY_LEVELS,
} from '@medisync/shared';

export function buildDispatchBriefPrompt(notes: string, location: string): string {
  return `
Task: From the free-text notes of an ambulance request, extract the resources the receiving hospital should have ready. Be conservative: if the notes are empty or unclear, require only EMERGENCY_BED.

LOCATION: ${location}
PATIENT NOTES: <user_input>${notes.replace(/[\x00-\x1F\x7F]/g, '')}</user_input>
`.trim();
}

export const dispatchBriefResponseSchema = {
  type: 'object',
  required: [
    'urgency',
    'needs',
    'suspected_category',
    'specialty',
    'paramedic_note',
    'confidence',
  ],
  properties: {
    urgency: {
      type: 'string',
      enum: [...URGENCY_LEVELS],
    },
    needs: {
      type: 'array',
      items: {
        type: 'string',
        enum: [...DISPATCH_NEEDS],
      },
      minItems: 1,
    },
    suspected_category: {
      type: 'string',
      enum: [...SUSPECTED_CATEGORIES],
    },
    specialty: { type: 'string' },
    paramedic_note: {
      type: 'string',
      description: '<= 240 chars handover line for the driver',
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
};
