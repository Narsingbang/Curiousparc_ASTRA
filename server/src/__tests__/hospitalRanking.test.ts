import { describe, it, expect } from 'vitest';
import { rankHospitals, HospitalWithDetails } from '../services/hospitalRanking';

describe('Hospital Ranking Algorithm', () => {
  const sampleHospitals: HospitalWithDetails[] = [
    {
      id: 'h1',
      name: 'MediSync Central',
      city: 'Pune',
      address: 'Shivajinagar',
      lat: 18.5308,
      lng: 73.8475,
      phone: '+912012345678',
      inventory: [
        { type: 'EMERGENCY_BED', total: 20, available: 6 },
        { type: 'ICU_BED', total: 15, available: 2 },
        { type: 'VENTILATOR', total: 12, available: 4 },
      ],
      doctors: [
        {
          id: 'd1',
          full_name: 'Dr. Mehta',
          specialty: 'Cardiology',
          level: 'SPECIALIST',
          status: 'AVAILABLE',
        },
      ],
    },
    {
      id: 'h2',
      name: 'Northside Clinic',
      city: 'Pune',
      address: 'Kothrud',
      lat: 18.5074,
      lng: 73.8077,
      phone: '+912098765432',
      inventory: [
        { type: 'EMERGENCY_BED', total: 10, available: 8 },
        { type: 'ICU_BED', total: 5, available: 0 }, // 0 ICU bed -> should be penalized when ICU requested
        { type: 'VENTILATOR', total: 5, available: 0 },
      ],
      doctors: [
        {
          id: 'd2',
          full_name: 'Dr. Intern',
          specialty: 'General Medicine',
          level: 'JUNIOR_INTERN',
          status: 'AVAILABLE',
        },
      ],
    },
  ];

  it('ranks hospital with available ICU higher when ICU is requested', () => {
    const results = rankHospitals({
      hospitals: sampleHospitals,
      userLat: 18.52,
      userLng: 73.84,
      needs: ['ICU_BED'],
    });

    expect(results.length).toBe(2);
    // MediSync Central has 2 ICU beds open, Northside has 0 (penalized)
    expect(results[0].hospital_id).toBe('h1');
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[0].reasons.some((r) => r.includes('icu bed'))).toBe(true);
  });

  it('handles missing coordinates gracefully with neutral 0.5 distance score', () => {
    const results = rankHospitals({
      hospitals: sampleHospitals,
      needs: ['EMERGENCY_BED'],
    });

    expect(results.length).toBe(2);
    expect(results[0].score).toBeDefined();
    expect(results[0].distance_km).toBe(10);
  });

  it('adds specialty match bonus when on-duty specialist matches', () => {
    const results = rankHospitals({
      hospitals: sampleHospitals,
      userLat: 18.52,
      userLng: 73.84,
      needs: ['EMERGENCY_BED'],
      specialty: 'Cardiology',
    });

    expect(results[0].hospital_id).toBe('h1');
    expect(results[0].matching_specialist).toBe('Dr. Mehta');
    expect(
      results[0].reasons.some((r) => r.includes('Cardiology specialist available'))
    ).toBe(true);
  });
});
