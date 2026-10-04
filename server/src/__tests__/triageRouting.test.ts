import { describe, it, expect } from 'vitest';
import { routeDoctor, DoctorCandidate } from '../services/triageRouting';

describe('Triage Doctor Routing Service', () => {
  const sampleDoctors: DoctorCandidate[] = [
    {
      id: 'doc-intern-1',
      hospital_id: 'h1',
      full_name: 'Dr. Intern Joshi',
      specialty: 'General Medicine',
      level: 'JUNIOR_INTERN',
      status: 'AVAILABLE',
      waiting_count: 2,
      avg_wait_minutes: 10,
      hospital_name: 'MediSync Central',
      hospital_city: 'Pune',
    },
    {
      id: 'doc-specialist-1',
      hospital_id: 'h1',
      full_name: 'Dr. Specialist Mehta',
      specialty: 'Cardiology',
      level: 'SPECIALIST',
      status: 'AVAILABLE',
      waiting_count: 3,
      avg_wait_minutes: 15,
      hospital_name: 'MediSync Central',
      hospital_city: 'Pune',
    },
    {
      id: 'doc-specialist-2',
      hospital_id: 'h2',
      full_name: 'Dr. Busy Specialist',
      specialty: 'Cardiology',
      level: 'SPECIALIST',
      status: 'BUSY',
      waiting_count: 10,
      avg_wait_minutes: 45,
      hospital_name: 'Riverside Care',
      hospital_city: 'Pune',
    },
  ];

  it('routes MILD severity to a JUNIOR_INTERN', () => {
    const res = routeDoctor({
      severity: 'MILD',
      isEmergency: false,
      specialty: 'General Medicine',
      doctors: sampleDoctors,
    });

    expect(res.routedDoctor).toBeDefined();
    expect(res.routedDoctor?.level).toBe('JUNIOR_INTERN');
    expect(res.routedDoctor?.id).toBe('doc-intern-1');
  });

  it('routes SEVERE severity to a SPECIALIST matching specialty', () => {
    const res = routeDoctor({
      severity: 'SEVERE',
      isEmergency: false,
      specialty: 'Cardiology',
      doctors: sampleDoctors,
    });

    expect(res.routedDoctor).toBeDefined();
    expect(res.routedDoctor?.level).toBe('SPECIALIST');
    expect(res.routedDoctor?.id).toBe('doc-specialist-1');
  });

  it('sets emergencyBannerRequired when emergency flag is true', () => {
    const res = routeDoctor({
      severity: 'SEVERE',
      isEmergency: true,
      specialty: 'Cardiology',
      doctors: sampleDoctors,
    });

    expect(res.emergencyBannerRequired).toBe(true);
    expect(res.routedDoctor?.level).toBe('SPECIALIST');
  });
});
