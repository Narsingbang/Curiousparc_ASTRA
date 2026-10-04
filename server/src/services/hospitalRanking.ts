import {
  DispatchNeed,
  RankedHospitalRecommendation,
} from '@medisync/shared';
import { calculateEtaMinutes, calculateHaversineDistanceKm } from './geo';

export interface HospitalWithDetails {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  inventory: Array<{
    type: string;
    total: number;
    available: number;
  }>;
  doctors: Array<{
    id: string;
    full_name: string;
    specialty: string;
    level: string;
    status: string;
  }>;
}

export function rankHospitals(opts: {
  hospitals: HospitalWithDetails[];
  userLat?: number;
  userLng?: number;
  needs: DispatchNeed[];
  specialty?: string;
}): RankedHospitalRecommendation[] {
  const { hospitals, userLat, userLng, needs, specialty } = opts;

  const ranked = hospitals.map((h) => {
    // 1. Distance & ETA
    let distanceKm = 10; // default neutral
    let distanceScore = 0.5; // neutral 0.5 if no coords
    let hasCoords = false;

    if (userLat !== undefined && userLng !== undefined) {
      hasCoords = true;
      distanceKm = calculateHaversineDistanceKm(userLat, userLng, h.lat, h.lng);
      distanceScore = 1 - Math.min(distanceKm, 40) / 40;
    }

    const etaMin = calculateEtaMinutes(distanceKm);

    // 2. Capacity ratio over requested needs (or ER bed if no needs specified)
    const activeNeeds = needs.length > 0 ? needs : (['EMERGENCY_BED'] as DispatchNeed[]);
    let ineligibleCount = 0;
    const capacityRatios: number[] = [];
    const reasons: string[] = [];

    // Map inventories by type
    const invMap = new Map<string, { total: number; available: number }>();
    for (const inv of h.inventory) {
      invMap.set(inv.type, { total: inv.total, available: inv.available });
    }

    for (const need of activeNeeds) {
      const inv = invMap.get(need) || { total: 0, available: 0 };
      if (inv.available === 0) {
        ineligibleCount++;
      }
      const ratio = inv.total > 0 ? inv.available / inv.total : 0;
      capacityRatios.push(ratio);

      if (inv.available > 0) {
        const label = need.toLowerCase().replace('_', ' ');
        reasons.push(`${inv.available} ${label}s available`);
      }
    }

    const meanCapacityRatio =
      capacityRatios.reduce((sum, r) => sum + r, 0) / capacityRatios.length;

    // 3. Specialty match
    let specialtyMatch = 0;
    let matchingSpecialistName: string | undefined;

    if (specialty) {
      const specialist = h.doctors.find(
        (doc) =>
          doc.level === 'SPECIALIST' &&
          doc.status === 'AVAILABLE' &&
          doc.specialty.toLowerCase() === specialty.toLowerCase()
      );
      if (specialist) {
        specialtyMatch = 1;
        matchingSpecialistName = specialist.full_name;
        reasons.push(`${specialty} specialist available (${specialist.full_name})`);
      }
    }

    // 4. Doctor availability ratio
    const totalDoctors = h.doctors.length;
    const availableDoctors = h.doctors.filter((d) => d.status === 'AVAILABLE').length;
    const doctorRatio = totalDoctors > 0 ? availableDoctors / totalDoctors : 0;

    if (availableDoctors > 0) {
      reasons.push(`${availableDoctors}/${totalDoctors} doctors on duty`);
    }

    if (hasCoords) {
      reasons.unshift(`${distanceKm} km • ~${etaMin} min away`);
    }

    // Deterministic scoring formula:
    // score = 0.40 * distanceTerm + 0.35 * capacityTerm + 0.15 * specialtyTerm + 0.10 * docTerm - 0.50 * ineligibleTerm
    let score =
      0.4 * distanceScore +
      0.35 * meanCapacityRatio +
      0.15 * specialtyMatch +
      0.1 * doctorRatio -
      0.5 * ineligibleCount;

    score = Math.round(score * 100) / 100;

    const capacitySummary = {
      ambulances: invMap.get('AMBULANCE') || { available: 0, total: 0 },
      emergency_beds: invMap.get('EMERGENCY_BED') || { available: 0, total: 0 },
      icu_beds: invMap.get('ICU_BED') || { available: 0, total: 0 },
      ventilators: invMap.get('VENTILATOR') || { available: 0, total: 0 },
    };

    return {
      hospital_id: h.id,
      name: h.name,
      city: h.city,
      address: h.address,
      phone: h.phone,
      lat: h.lat,
      lng: h.lng,
      score,
      distance_km: distanceKm,
      eta_min: etaMin,
      reasons,
      capacity_summary: capacitySummary,
      matching_specialist: matchingSpecialistName,
    };
  });

  // Sort descending by score
  ranked.sort((a, b) => b.score - a.score);

  return ranked.slice(0, 5);
}
