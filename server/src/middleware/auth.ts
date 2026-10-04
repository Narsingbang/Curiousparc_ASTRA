import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { ApiError } from '../lib/errors';
import { UserProfile, UserRole } from '@medisync/shared';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role: UserRole;
        hospital_id?: string | null;
        profile: UserProfile;
      };
    }
  }
}

// In-memory demo profile lookup for local / mock mode
const demoProfiles: Record<string, UserProfile> = {
  'demo-patient-id': {
    id: 'demo-patient-id',
    full_name: 'Rushikesh Soni (Demo Patient)',
    role: 'patient',
    phone: '+919876543210',
    blood_group: 'O+',
    allergies: ['Penicillin'],
    chronic_conditions: ['Mild Asthma'],
    emergency_contact: {
      name: 'Narsing Bang',
      phone: '+919876543211',
      relationship: 'Friend',
    },
  },
  'demo-ambulance-id': {
    id: 'demo-ambulance-id',
    full_name: 'Pawan Paramedic (Unit 108)',
    role: 'ambulance',
    phone: '+919876543212',
    allergies: [],
    chronic_conditions: [],
  },
  'demo-staff-id': {
    id: 'demo-staff-id',
    full_name: 'Dr. Ananya Sharma (Hospital Staff)',
    role: 'staff',
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    phone: '+919876543213',
    allergies: [],
    chronic_conditions: [],
  },
};

let resolvedCentralHospitalId: string | null = null;
async function getCentralHospitalId(): Promise<string> {
  if (resolvedCentralHospitalId) return resolvedCentralHospitalId;
  if (!isMockSupabase) {
    try {
      const { data } = await supabaseAdmin
        .from('hospitals')
        .select('id')
        .ilike('name', '%MediSync Central%')
        .maybeSingle();
      if (data?.id) {
        resolvedCentralHospitalId = data.id;
        return data.id;
      }
    } catch {
      // fallback
    }
  }
  return 'a0000000-0000-0000-0000-000000000001';
}

export async function authenticateToken(
  req: Request,
  required: boolean
): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (required) throw ApiError.unauthorized('Missing or invalid Authorization header');
    return false;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    if (required) throw ApiError.unauthorized('Bearer token required');
    return false;
  }

  // Handle mock tokens for testing/development
  if (token.startsWith('mock-token-') || token === 'demo-token-patient') {
    const profile = demoProfiles['demo-patient-id'];
    req.user = {
      id: profile.id,
      email: 'patient@medisync.demo',
      role: profile.role,
      hospital_id: profile.hospital_id,
      profile,
    };
    return true;
  }
  if (token === 'demo-token-ambulance') {
    const profile = demoProfiles['demo-ambulance-id'];
    req.user = {
      id: profile.id,
      email: 'driver@medisync.demo',
      role: profile.role,
      hospital_id: profile.hospital_id,
      profile,
    };
    return true;
  }

  if (token === 'demo-token-staff') {
    const profile = { ...demoProfiles['demo-staff-id'] };
    const centralHospId = await getCentralHospitalId();
    profile.hospital_id = centralHospId;
    req.user = {
      id: profile.id,
      email: 'staff@medisync.demo',
      role: profile.role,
      hospital_id: centralHospId,
      profile,
    };
    return true;
  }

  if (isMockSupabase) {
    // If mock supabase is configured and unknown token passed, default to patient
    const profile = demoProfiles['demo-patient-id'];
    req.user = {
      id: profile.id,
      email: 'user@medisync.demo',
      role: profile.role,
      hospital_id: profile.hospital_id,
      profile,
    };
    return true;
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      if (required) throw ApiError.unauthorized('Invalid or expired token');
      return false;
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      if (required) throw ApiError.unauthorized('User profile not found');
      return false;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: profile.role,
      hospital_id: profile.hospital_id,
      profile: profile as UserProfile,
    };
    return true;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (required) throw ApiError.unauthorized('Authentication verification failed');
    return false;
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    await authenticateToken(req, true);
    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    await authenticateToken(req, false);
    next();
  } catch {
    next();
  }
}
