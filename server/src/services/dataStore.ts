import {
  DoctorLevel,
  DoctorStatus,
  ResourceType,
  DispatchStatus,
  SeverityLevel,
} from '@medisync/shared';

export interface HospitalRecord {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
}

export interface InventoryRecord {
  id: string;
  hospital_id: string;
  type: ResourceType;
  total: number;
  available: number;
  location_label: string;
  updated_at: string;
}

export interface DoctorRecord {
  id: string;
  hospital_id: string;
  full_name: string;
  specialty: string;
  level: DoctorLevel;
  status: DoctorStatus;
  wing: string;
  floor: number;
  waiting_count: number;
  avg_wait_minutes: number;
  updated_at: string;
}

export interface EmergencyRequestDbRecord {
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
  created_at: string;
  updated_at: string;
}

export interface TriageSessionDbRecord {
  id: string;
  user_id: string | null;
  messages: Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }>;
  severity: SeverityLevel | null;
  is_emergency: boolean;
  specialty: string | null;
  red_flags: string[];
  summary: string | null;
  recommended_level: DoctorLevel | null;
  assigned_doctor_id: string | null;
  hospital_id: string | null;
  status: 'OPEN' | 'COMPLETE' | 'EXPIRED';
  created_at: string;
  updated_at: string;
}

export interface PatientRecordDbRecord {
  id: string;
  user_id: string;
  source: 'TRIAGE' | 'MANUAL' | 'AMBULANCE';
  title: string;
  symptoms: string | null;
  severity: SeverityLevel | null;
  ai_summary: any;
  doctor_id: string | null;
  triage_session_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Initial seed hospitals
export const initialHospitals: HospitalRecord[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'MediSync Central Hospital',
    city: 'Pune',
    address: 'Shivajinagar, Pune',
    lat: 18.5308,
    lng: 73.8475,
    phone: '+912012345678',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Riverside Care Hospital',
    city: 'Pune',
    address: 'Kothrud, Pune',
    lat: 18.5074,
    lng: 73.8077,
    phone: '+912098765432',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'Northside Clinic',
    city: 'Mumbai',
    address: 'Andheri East, Mumbai',
    lat: 19.1197,
    lng: 72.8697,
    phone: '+912211223344',
  },
];

// Initial seed inventories
export const initialInventory: InventoryRecord[] = [
  {
    id: 'i0000000-0000-0000-0000-000000000001',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    type: 'AMBULANCE',
    total: 8,
    available: 3,
    location_label: 'Bay',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000002',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    type: 'EMERGENCY_BED',
    total: 20,
    available: 6,
    location_label: 'ER Wing',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000003',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    type: 'ICU_BED',
    total: 15,
    available: 2,
    location_label: 'ICU',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000004',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    type: 'VENTILATOR',
    total: 12,
    available: 4,
    location_label: 'ICU',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000005',
    hospital_id: 'a0000000-0000-0000-0000-000000000002',
    type: 'AMBULANCE',
    total: 6,
    available: 4,
    location_label: 'Bay',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000006',
    hospital_id: 'a0000000-0000-0000-0000-000000000002',
    type: 'EMERGENCY_BED',
    total: 18,
    available: 9,
    location_label: 'ER Wing',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000007',
    hospital_id: 'a0000000-0000-0000-0000-000000000002',
    type: 'ICU_BED',
    total: 10,
    available: 1,
    location_label: 'ICU',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000008',
    hospital_id: 'a0000000-0000-0000-0000-000000000002',
    type: 'VENTILATOR',
    total: 8,
    available: 5,
    location_label: 'ICU',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000009',
    hospital_id: 'a0000000-0000-0000-0000-000000000003',
    type: 'AMBULANCE',
    total: 4,
    available: 2,
    location_label: 'Bay',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000010',
    hospital_id: 'a0000000-0000-0000-0000-000000000003',
    type: 'EMERGENCY_BED',
    total: 16,
    available: 11,
    location_label: 'ER Wing',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000011',
    hospital_id: 'a0000000-0000-0000-0000-000000000003',
    type: 'ICU_BED',
    total: 8,
    available: 0,
    location_label: 'ICU',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i0000000-0000-0000-0000-000000000012',
    hospital_id: 'a0000000-0000-0000-0000-000000000003',
    type: 'VENTILATOR',
    total: 6,
    available: 2,
    location_label: 'ICU',
    updated_at: new Date().toISOString(),
  },
];

// Initial seed doctors
export const initialDoctors: DoctorRecord[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    full_name: 'Dr. Aarav Mehta',
    specialty: 'Cardiology',
    level: 'SPECIALIST',
    status: 'AVAILABLE',
    wing: 'Wing A',
    floor: 3,
    waiting_count: 3,
    avg_wait_minutes: 15,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    full_name: 'Dr. Arjun Das',
    specialty: 'Pulmonology',
    level: 'SPECIALIST',
    status: 'OFF_DUTY',
    wing: 'Wing B',
    floor: 3,
    waiting_count: 0,
    avg_wait_minutes: 0,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    full_name: 'Dr. Maya Joshi',
    specialty: 'General Medicine',
    level: 'JUNIOR_INTERN',
    status: 'AVAILABLE',
    wing: 'Wing C',
    floor: 1,
    waiting_count: 4,
    avg_wait_minutes: 20,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000004',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    full_name: 'Dr. Neha Patel',
    specialty: 'Pediatrics',
    level: 'JUNIOR_INTERN',
    status: 'AVAILABLE',
    wing: 'Wing C',
    floor: 2,
    waiting_count: 1,
    avg_wait_minutes: 8,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000005',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    full_name: 'Dr. Rohan Iyer',
    specialty: 'Emergency Medicine',
    level: 'SPECIALIST',
    status: 'EMERGENCY',
    wing: 'ER Bay 1',
    floor: 0,
    waiting_count: 2,
    avg_wait_minutes: 5,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000006',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    full_name: 'Dr. Sara Khan',
    specialty: 'General Medicine',
    level: 'JUNIOR_INTERN',
    status: 'AVAILABLE',
    wing: 'Wing C',
    floor: 1,
    waiting_count: 2,
    avg_wait_minutes: 10,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000007',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    full_name: 'Dr. Vikram Rao',
    specialty: 'Orthopedics',
    level: 'SPECIALIST',
    status: 'AVAILABLE',
    wing: 'Wing A',
    floor: 2,
    waiting_count: 5,
    avg_wait_minutes: 30,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000008',
    hospital_id: 'a0000000-0000-0000-0000-000000000002',
    full_name: 'Dr. Mei Tanaka',
    specialty: 'Pulmonology',
    level: 'SPECIALIST',
    status: 'AVAILABLE',
    wing: 'Wing A',
    floor: 1,
    waiting_count: 4,
    avg_wait_minutes: 40,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000009',
    hospital_id: 'a0000000-0000-0000-0000-000000000002',
    full_name: 'Dr. Omar Haddad',
    specialty: 'Orthopedics',
    level: 'JUNIOR_INTERN',
    status: 'AVAILABLE',
    wing: 'Wing B',
    floor: 2,
    waiting_count: 3,
    avg_wait_minutes: 25,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000010',
    hospital_id: 'a0000000-0000-0000-0000-000000000002',
    full_name: 'Dr. Isha Kulkarni',
    specialty: 'Neurology',
    level: 'SPECIALIST',
    status: 'BUSY',
    wing: 'Wing A',
    floor: 3,
    waiting_count: 5,
    avg_wait_minutes: 60,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000011',
    hospital_id: 'a0000000-0000-0000-0000-000000000003',
    full_name: 'Dr. Ethan Brooks',
    specialty: 'General Medicine',
    level: 'JUNIOR_INTERN',
    status: 'AVAILABLE',
    wing: 'Wing A',
    floor: 1,
    waiting_count: 0,
    avg_wait_minutes: 5,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000012',
    hospital_id: 'a0000000-0000-0000-0000-000000000003',
    full_name: 'Dr. Leena Fernandes',
    specialty: 'Neurology',
    level: 'SPECIALIST',
    status: 'EMERGENCY',
    wing: 'Wing B',
    floor: 2,
    waiting_count: 5,
    avg_wait_minutes: 60,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000013',
    hospital_id: 'a0000000-0000-0000-0000-000000000003',
    full_name: 'Dr. Narsing Bang',
    specialty: 'Psychiatry',
    level: 'SPECIALIST',
    status: 'AVAILABLE',
    wing: 'Wing B',
    floor: 1,
    waiting_count: 0,
    avg_wait_minutes: 0,
    updated_at: new Date().toISOString(),
  },
];

// In-memory data store instance
export class AppDataStore {
  hospitals: HospitalRecord[] = [...initialHospitals];
  inventory: InventoryRecord[] = [...initialInventory];
  doctors: DoctorRecord[] = [...initialDoctors];
  emergencyRequests: EmergencyRequestDbRecord[] = [
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      requester_id: 'demo-patient-id',
      patient_name: 'Aarav Deshmukh',
      phone: '+919876543299',
      location_text: 'FC Road, Deccan, Pune',
      lat: 18.5204,
      lng: 73.843,
      notes: 'Severe chest heaviness and shortness of breath since 20 minutes',
      ai_brief: {
        urgency: 'CRITICAL',
        needs: ['EMERGENCY_BED', 'ICU_BED'],
        suspected_category: 'CARDIAC',
        specialty: 'Cardiology',
        paramedic_note: 'Possible acute coronary syndrome, prepare cardiac bay',
        confidence: 0.95,
      },
      needs: ['EMERGENCY_BED', 'ICU_BED'],
      status: 'ASSIGNED',
      assigned_hospital_id: 'a0000000-0000-0000-0000-000000000001',
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  ];
  triageSessions: TriageSessionDbRecord[] = [];
  patientRecords: PatientRecordDbRecord[] = [
    {
      id: 'r0000000-0000-0000-0000-000000000001',
      user_id: 'demo-patient-id',
      source: 'TRIAGE',
      title: 'Mild allergic rhinitis & throat tickle',
      symptoms: 'Sneezing, runny nose and mild itchy throat for 3 days',
      severity: 'MILD',
      ai_summary: {
        chief_complaint: 'Sneezing and runny nose',
        duration: '3 days',
        associated_symptoms: ['Mild itchy throat', 'Sneezing'],
        suggested_specialty: 'General Medicine',
        patient_friendly_summary:
          'Seasonal allergy pattern with mild nasal symptoms. Hydration and rest advised.',
      },
      doctor_id: 'd0000000-0000-0000-0000-000000000003',
      triage_session_id: null,
      notes: 'Advised warm saline gargle and steam inhalation.',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      id: 'r0000000-0000-0000-0000-000000000002',
      user_id: 'demo-patient-id',
      source: 'MANUAL',
      title: 'Routine Health Checkup & Lipid Profile',
      symptoms: 'None - Annual checkup',
      severity: 'MILD',
      ai_summary: null,
      doctor_id: 'd0000000-0000-0000-0000-000000000001',
      triage_session_id: null,
      notes: 'Blood pressure 120/80 mmHg. Total cholesterol slightly elevated (210 mg/dL).',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    },
  ];
}

export const dbStore = new AppDataStore();
