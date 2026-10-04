import { RED_FLAG_KEYWORDS } from '@medisync/shared';

export interface RedFlagScanResult {
  hasRedFlag: boolean;
  detectedFlags: string[];
  isSelfHarm: boolean;
}

const SELF_HARM_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'want to die',
  'aatmahatya',
  'khudkushi',
  'jeev dena',
];

export function scanRedFlags(text: string): RedFlagScanResult {
  if (!text) {
    return { hasRedFlag: false, detectedFlags: [], isSelfHarm: false };
  }

  const normalized = text.toLowerCase().trim();
  const detectedFlags: string[] = [];
  let isSelfHarm = false;

  // Additional regex patterns for grammatical variations
  const PATTERNS: Array<{ pattern: RegExp; tag: string }> = [
    { pattern: /crushing.*pain/i, tag: 'crushing pain' },
    { pattern: /face.*droop/i, tag: 'face drooping' },
    { pattern: /slur.*speech/i, tag: 'slurred speech' },
    { pattern: /short.*breath/i, tag: 'shortness of breath' },
    { pattern: /cannot.*breathe|can't.*breathe/i, tag: 'cannot breathe' },
    { pattern: /vomit.*blood/i, tag: 'vomiting blood' },
    { pattern: /cough.*blood/i, tag: 'coughing blood' },
    { pattern: /radiat.*arm/i, tag: 'radiating to arm' },
    { pattern: /radiat.*jaw/i, tag: 'radiating to jaw' },
  ];

  for (const item of PATTERNS) {
    if (item.pattern.test(normalized) && !detectedFlags.includes(item.tag)) {
      detectedFlags.push(item.tag);
    }
  }

  for (const keyword of RED_FLAG_KEYWORDS) {
    if (normalized.includes(keyword.toLowerCase()) && !detectedFlags.includes(keyword)) {
      detectedFlags.push(keyword);
    }
  }

  for (const shKeyword of SELF_HARM_KEYWORDS) {
    if (normalized.includes(shKeyword.toLowerCase())) {
      isSelfHarm = true;
      if (!detectedFlags.includes(shKeyword)) {
        detectedFlags.push(shKeyword);
      }
    }
  }

  return {
    hasRedFlag: detectedFlags.length > 0,
    detectedFlags,
    isSelfHarm,
  };
}
