import { create } from 'zustand';
import { UserProfile, UserRole } from '@medisync/shared';
import { supabase, isClientMock } from '../lib/supabase';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  role: UserRole;
  profile: UserProfile | null;
  isLoading: boolean;
  setSession: (token: string, profile: UserProfile, email?: string) => void;
  quickDemoLogin: (role: 'patient' | 'ambulance' | 'staff') => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('medisync_token'),
  userId: localStorage.getItem('medisync_user_id'),
  email: localStorage.getItem('medisync_email'),
  role: (localStorage.getItem('medisync_role') as UserRole) || 'patient',
  profile: null,
  isLoading: true,

  setSession: (token, profile, email) => {
    localStorage.setItem('medisync_token', token);
    localStorage.setItem('medisync_user_id', profile.id);
    localStorage.setItem('medisync_role', profile.role);
    localStorage.setItem('medisync_profile', JSON.stringify(profile));
    if (email) localStorage.setItem('medisync_email', email);

    set({
      token,
      userId: profile.id,
      email: email || null,
      role: profile.role,
      profile,
      isLoading: false,
    });
  },

  quickDemoLogin: async (role: 'patient' | 'ambulance' | 'staff') => {
    set({ isLoading: true });

    const tokenMap = {
      patient: 'demo-token-patient',
      ambulance: 'demo-token-ambulance',
      staff: 'demo-token-staff',
    };

    const profileMap: Record<string, UserProfile> = {
      patient: {
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
      ambulance: {
        id: 'demo-ambulance-id',
        full_name: 'Pawan Paramedic (Unit 108)',
        role: 'ambulance',
        phone: '+919876543212',
        allergies: [],
        chronic_conditions: [],
      },
      staff: {
        id: 'demo-staff-id',
        full_name: 'Dr. Ananya Sharma (Hospital Staff)',
        role: 'staff',
        hospital_id: 'a0000000-0000-0000-0000-000000000001',
        phone: '+919876543213',
        allergies: [],
        chronic_conditions: [],
      },
    };

    const token = tokenMap[role];
    const profile = profileMap[role];
    const email = `${role}@medisync.demo`;

    localStorage.setItem('medisync_token', token);
    localStorage.setItem('medisync_user_id', profile.id);
    localStorage.setItem('medisync_role', profile.role);
    localStorage.setItem('medisync_profile', JSON.stringify(profile));
    localStorage.setItem('medisync_email', email);

    set({
      token,
      userId: profile.id,
      email,
      role: profile.role,
      profile,
      isLoading: false,
    });

    // In background, refresh from /api/auth/me to get canonical hospital_id and database profile
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
      const meRes = await fetch(`${base}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData?.user?.profile) {
          const freshProfile = meData.user.profile;
          localStorage.setItem('medisync_profile', JSON.stringify(freshProfile));
          set({ profile: freshProfile, role: freshProfile.role });
        }
      }
    } catch {
      // offline or mock fallback
    }
  },

  signOut: async () => {
    localStorage.removeItem('medisync_token');
    localStorage.removeItem('medisync_user_id');
    localStorage.removeItem('medisync_role');
    localStorage.removeItem('medisync_profile');
    localStorage.removeItem('medisync_email');

    if (!isClientMock) {
      try {
        await supabase.auth.signOut();
      } catch {
        // silent catch
      }
    }

    set({
      token: null,
      userId: null,
      email: null,
      role: 'patient',
      profile: null,
      isLoading: false,
    });
  },

  initAuth: async () => {
    const savedToken = localStorage.getItem('medisync_token');
    const savedRole = (localStorage.getItem('medisync_role') as UserRole) || 'patient';
    const savedEmail = localStorage.getItem('medisync_email');
    const savedId = localStorage.getItem('medisync_user_id');
    const savedProfileStr = localStorage.getItem('medisync_profile');
    let parsedProfile: UserProfile | null = null;
    if (savedProfileStr) {
      try {
        parsedProfile = JSON.parse(savedProfileStr);
      } catch {
        parsedProfile = null;
      }
    }

    if (savedToken) {
      set({
        token: savedToken,
        role: parsedProfile?.role || savedRole,
        email: savedEmail,
        userId: savedId,
        profile: parsedProfile,
        isLoading: false,
      });

      // Refresh latest profile from /api/auth/me
      try {
        const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
        const meRes = await fetch(`${base}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData?.user?.profile) {
            const freshProfile = meData.user.profile;
            localStorage.setItem('medisync_profile', JSON.stringify(freshProfile));
            set({ profile: freshProfile, role: freshProfile.role });
          }
        }
      } catch {
        // ignore network error
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
