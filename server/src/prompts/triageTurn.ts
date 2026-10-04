import { MEDICAL_SPECIALTIES } from '@medisync/shared';

export function buildTriageTurnPrompt(opts: {
  turns: Array<{ role: 'user' | 'assistant'; text: string }>;
  followUpsAsked: number;
  redFlags: string[];
}): string {
  const conversationHistory = opts.turns
    .map(
      (turn) =>
        `[${turn.role}] <user_input>${turn.text.replace(/[\x00-\x1F\x7F]/g, '')}</user_input>`
    )
    .join('\n');

  return `
CONVERSATION SO FAR (oldest first):
${conversationHistory}

FOLLOW_UPS_ASKED_SO_FAR: ${opts.followUpsAsked} (max 3)
PRE-FILTER RED FLAGS DETECTED BY SERVER: ${JSON.stringify(opts.redFlags)}

TASK: If you still need critical info AND follow-ups asked < 3 AND no red flags are detected, return status "NEEDS_MORE_INFO" with ONE concise question in "assistant_message". Otherwise return status "COMPLETE" with the full assessment.
`.trim();
}

export const triageTurnResponseSchema = {
  type: 'object',
  required: ['status', 'assistant_message'],
  properties: {
    status: {
      type: 'string',
      enum: ['NEEDS_MORE_INFO', 'COMPLETE'],
    },
    assistant_message: {
      type: 'string',
      description: 'Short, empathetic message shown in chat (<= 400 chars).',
    },
    assessment: {
      type: 'object',
      required: [
        'severity',
        'is_emergency',
        'specialty',
        'red_flags',
        'summary',
        'advice',
        'confidence',
      ],
      properties: {
        severity: { type: 'string', enum: ['MILD', 'SEVERE'] },
        is_emergency: { type: 'boolean' },
        specialty: {
          type: 'string',
          enum: [...MEDICAL_SPECIALTIES],
        },
        red_flags: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 6,
        },
        summary: {
          type: 'string',
          description:
            'Neutral 2-3 sentence symptom summary for the health record (<= 500 chars).',
        },
        advice: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 5,
          description: 'Safe self-care/next-step advice, no medicines or dosages.',
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
    },
  },
};
