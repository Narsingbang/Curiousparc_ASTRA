import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useRealtimeSubscription } from '../hooks/useRealtime';
import { PatientRecord, UserProfile } from '@medisync/shared';
import { ProfileCard } from '../components/vault/ProfileCard';
import { RecordTimeline } from '../components/vault/RecordTimeline';
import { FolderHeart, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function Vault() {
  const { token, profile, quickDemoLogin } = useAuthStore();

  // Listen to realtime / cross-tab updates for patient records
  useRealtimeSubscription(['patient_records']);

  const { data, refetch, isFetching } = useQuery<{
    profile: UserProfile;
    records: PatientRecord[];
    stats: { total: number; mild: number; severe: number };
  }>({
    queryKey: ['vault-data'],
    queryFn: () => apiFetch('/vault'),
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (!token) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-center shadow-xl space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-medical-blue mx-auto flex items-center justify-center">
          <FolderHeart className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Universal Health Vault
          </h2>
          <p className="text-xs text-slate-500">
            Secure, encrypted medical history and AI triage records. Please sign in to view your profile.
          </p>
        </div>
        <div className="space-y-2.5">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => quickDemoLogin('patient')}
          >
            Quick Demo Login (Patient Account)
          </Button>
          <Link to="/auth" className="block">
            <Button variant="outline" className="w-full">
              Sign In with Custom Email
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeProfile = data?.profile || profile || {
    id: 'demo-patient-id',
    full_name: 'Rushikesh Soni (Demo Patient)',
    role: 'patient',
    phone: '+919876543210',
    blood_group: 'O+',
    allergies: ['Penicillin'],
    chronic_conditions: ['Mild Asthma'],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted at Rest · Row-Level Security Verified</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white">
            Universal Health Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personal health record timeline, drug allergy flags, and verified AI triage consult notes.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <span className="text-lg font-black text-slate-900 dark:text-white block font-display">
              {data?.stats?.total ?? 2}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Records
            </span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <span className="text-lg font-black text-rose-600 dark:text-rose-400 block font-display">
              {data?.stats?.severe ?? 0}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Severe Consults
            </span>
          </div>
        </div>
      </div>

      {/* Patient Profile Card */}
      <ProfileCard profile={activeProfile} onProfileUpdated={refetch} />

      {/* Records Timeline */}
      <RecordTimeline records={data?.records || []} onRefresh={refetch} />
    </div>
  );
}
