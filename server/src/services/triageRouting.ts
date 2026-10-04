import { DoctorLevel, DoctorStatus, RoutedDoctor, SeverityLevel } from '@medisync/shared';

export interface DoctorCandidate {
  id: string;
  hospital_id: string;
  full_name: string;
  specialty: string;
  level: DoctorLevel;
  status: DoctorStatus;
  wing?: string | null;
  floor?: number | null;
  waiting_count: number;
  avg_wait_minutes: number;
  hospital_name: string;
  hospital_city: string;
  hospital_address?: string;
  hospital_phone?: string | null;
  emergency_beds_available?: number;
}

export function routeDoctor(opts: {
  severity: SeverityLevel;
  isEmergency: boolean;
  specialty: string;
  doctors: DoctorCandidate[];
  city?: string;
}): { routedDoctor?: RoutedDoctor; emergencyBannerRequired?: boolean } {
  const { severity, isEmergency, specialty, doctors, city } = opts;

  // Filter by city if specified
  let pool = city
    ? doctors.filter((d) => d.hospital_city.toLowerCase() === city.toLowerCase())
    : doctors;

  if (pool.length === 0) {
    pool = doctors; // fallback to all cities if none found in city
  }

  const targetLevel: DoctorLevel =
    severity === 'SEVERE' || isEmergency ? 'SPECIALIST' : 'JUNIOR_INTERN';

  // Available candidates matching target level
  let candidates = pool.filter(
    (d) => d.level === targetLevel && d.status === 'AVAILABLE'
  );

  // If no available doctors at target level, try other available doctors
  if (candidates.length === 0) {
    candidates = pool.filter((d) => d.status === 'AVAILABLE');
  }

  // If still none, allow BUSY doctors
  if (candidates.length === 0) {
    candidates = pool.filter((d) => d.status === 'BUSY');
  }

  if (candidates.length === 0) {
    return {
      emergencyBannerRequired: severity === 'SEVERE' || isEmergency,
    };
  }

  // Score candidate doctors:
  // Exact specialty match (+100) or General/Emergency Medicine (+50)
  // Penalize waiting_count and avg_wait_minutes
  // Bonus for hospital with open emergency beds
  const scored = candidates.map((doc) => {
    let specialtyScore = 0;
    if (doc.specialty.toLowerCase() === specialty.toLowerCase()) {
      specialtyScore = 100;
    } else if (
      doc.specialty === 'General Medicine' ||
      doc.specialty === 'Emergency Medicine'
    ) {
      specialtyScore = 50;
    }

    const waitPenalty = doc.waiting_count * 5 + doc.avg_wait_minutes;
    const bedBonus = (doc.emergency_beds_available || 0) * 2;
    const totalScore = specialtyScore - waitPenalty + bedBonus;

    return { doc, totalScore };
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);
  const best = scored[0].doc;

  const routedDoctor: RoutedDoctor = {
    id: best.id,
    full_name: best.full_name,
    specialty: best.specialty,
    level: best.level,
    status: best.status,
    wing: best.wing,
    floor: best.floor,
    waiting_count: best.waiting_count,
    avg_wait_minutes: best.avg_wait_minutes,
    hospital_id: best.hospital_id,
    hospital_name: best.hospital_name,
    hospital_city: best.hospital_city,
    hospital_address: best.hospital_address,
    hospital_phone: best.hospital_phone,
  };

  return {
    routedDoctor,
    emergencyBannerRequired: isEmergency,
  };
}
