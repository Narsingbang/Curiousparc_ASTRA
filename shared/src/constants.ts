export const MEDICAL_SPECIALTIES = [
  'General Medicine',
  'Emergency Medicine',
  'Cardiology',
  'Pulmonology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Gastroenterology',
  'Dermatology',
  'ENT',
  'Gynecology',
  'Trauma & Emergency',
] as const;

export type MedicalSpecialty = (typeof MEDICAL_SPECIALTIES)[number];

export const DOCTOR_LEVELS = ['SPECIALIST', 'JUNIOR_INTERN'] as const;
export type DoctorLevel = (typeof DOCTOR_LEVELS)[number];

export const DOCTOR_STATUSES = [
  'AVAILABLE',
  'BUSY',
  'IN_SURGERY',
  'EMERGENCY',
  'OFF_DUTY',
] as const;
export type DoctorStatus = (typeof DOCTOR_STATUSES)[number];

export const RESOURCE_TYPES = [
  'AMBULANCE',
  'EMERGENCY_BED',
  'ICU_BED',
  'VENTILATOR',
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const SEVERITY_LEVELS = ['MILD', 'SEVERE'] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const DISPATCH_STATUSES = [
  'PENDING',
  'ASSIGNED',
  'EN_ROUTE',
  'ARRIVED',
  'COMPLETED',
  'CANCELLED',
] as const;
export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];

export const DISPATCH_NEEDS = ['EMERGENCY_BED', 'ICU_BED', 'VENTILATOR'] as const;
export type DispatchNeed = (typeof DISPATCH_NEEDS)[number];

export const USER_ROLES = ['patient', 'ambulance', 'staff'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const EMERGENCY_NUMBERS = {
  NATIONAL_EMERGENCY: '112',
  AMBULANCE_INDIA: '108',
  TELE_MANAS_CRISIS: '14416',
} as const;

export const STANDARD_ADVISORIES = {
  TRIAGE_FOOTER:
    'MediSync AI provides triage guidance, not a medical diagnosis. If you think this is an emergency, call 112 or 108 immediately.',
  AMBULANCE_FORM:
    'This is a demo — for real emergencies, call your local emergency number first.',
  SIGNUP_NOTE:
    'By continuing, you agree to use this demo for non-clinical purposes only.',
  SELF_HARM:
    'You are not alone. Please call Tele-MANAS 14416 or 112 right now, or reach out to someone near you.',
  AI_FALLBACK_NOTICE:
    'AI is temporarily unavailable — showing deterministic safety guidance.',
} as const;

export const RESOURCE_THRESHOLDS = {
  GREEN: 0.4, // >= 40%
  YELLOW: 0.15, // 15% - 39%
  // < 15% or 0 is RED
} as const;

// Comprehensive Red Flags: English, Hindi, Marathi transliterations
export const RED_FLAG_KEYWORDS = [
  // Cardiac / Chest
  'chest pain',
  'chest pressure',
  'chest heaviness',
  'crushing pain',
  'radiating to arm',
  'radiating to jaw',
  'seene me dard',
  'chaati me dard',
  'chhati dard',
  'hriday rog',
  'dhabdhab',
  'heart attack',
  
  // Respiratory
  'difficulty breathing',
  'shortness of breath',
  'cannot breathe',
  'cant breathe',
  'breathless',
  'gasping',
  'suffocating',
  'saas lene me takleef',
  'saas phulna',
  'dam lagna',
  'shwas ghene',
  'choking',

  // Neurological / Stroke (FAST)
  'stroke',
  'face drooping',
  'slurred speech',
  'sudden weakness',
  'paralysis',
  'numbness one side',
  'ek taraf kamzori',
  'bolne me takleef',
  'pakshaghat',
  'lakwa',

  // Consciousness / Seizure
  'unconscious',
  'fainted',
  'fainting',
  'passed out',
  'unresponsive',
  'behoshi',
  'behosh',
  'shuddh harapne',
  'seizure',
  'convulsion',
  'fits',
  'mirgi',
  'jhatke',

  // Hemorrhage / Bleeding
  'severe bleeding',
  'heavy bleeding',
  'coughing blood',
  'vomiting blood',
  'raktasrav',
  'khoon ki ulti',
  'khoon beh raha hai',
  'rakt bahane',

  // Anaphylaxis / Severe Allergy
  'throat swelling',
  'tongue swelling',
  'severe allergic',
  'anaphylaxis',
  'gala sooj gaya',
  'galat sojan',

  // Poisoning / Burns / Trauma
  'poisoning',
  'overdose',
  'swallowed poison',
  'zeher',
  'vish',
  'severe burn',
  'third degree burn',
  'head injury with vomiting',
  'serious head injury',
  'bheja chot',

  // Mental Health / Crisis
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'want to die',
  'aatmahatya',
  'khudkushi',
  'jeev dena',

  // Maternal & Infant
  'pregnant bleeding',
  'pregnancy bleeding',
  'garbhavastha raktasrav',
  'infant lethargy',
  'baby unresponsive',
  'high fever stiff neck',
  'garbhvati',
] as const;
