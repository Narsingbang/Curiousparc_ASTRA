export function buildRecordSummaryPrompt(opts: {
  turns: Array<{ role: 'user' | 'assistant'; text: string }>;
  assessmentSummary?: string;
}): string {
  const conversation = opts.turns
    .map((t) => `[${t.role}]: ${t.text}`)
    .join('\n');

  return `
Task: Convert the finished triage conversation into a concise neutral record for a patient health vault. Do not add facts that were not stated.

CONVERSATION:
${conversation}

${opts.assessmentSummary ? `INITIAL SUMMARY: ${opts.assessmentSummary}` : ''}
`.trim();
}

export const recordSummaryResponseSchema = {
  type: 'object',
  required: [
    'title',
    'chief_complaint',
    'duration',
    'associated_symptoms',
    'severity',
    'suggested_specialty',
    'patient_friendly_summary',
  ],
  properties: {
    title: {
      type: 'string',
      description: "<= 80 chars e.g. 'Chest tightness – 2 days'",
    },
    chief_complaint: { type: 'string' },
    duration: {
      type: 'string',
      description: "e.g. '2 days' or 'not stated'",
    },
    associated_symptoms: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 8,
    },
    severity: { type: 'string', enum: ['MILD', 'SEVERE'] },
    suggested_specialty: { type: 'string' },
    patient_friendly_summary: {
      type: 'string',
      description: '<= 300 chars, plain language',
    },
  },
};
