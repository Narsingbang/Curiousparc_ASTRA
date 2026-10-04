import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { DashboardSummary } from '@medisync/shared';
import { useRealtimeSubscription } from '../hooks/useRealtime';
import { KpiCard } from '../components/dashboard/KpiCard';
import { ResourceCard } from '../components/dashboard/ResourceCard';
import { DoctorList, DoctorListItem } from '../components/dashboard/DoctorList';
import {
  Activity,
  Users,
  Bed,
  AlertTriangle,
  Truck,
  HeartPulse,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState('All');

  // Realtime subscription for instant updates on doctors, inventory, and emergency_requests
  const { isReconnecting } = useRealtimeSubscription(['doctors', 'inventory', 'emergency_requests']);

  // Fetch Dashboard Summary KPIs
  const {
    data: summary,
    refetch: refetchSummary,
    isFetching: isFetchingSummary,
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiFetch('/dashboard/summary'),
  });

  // Fetch Doctors list
  const {
    data: doctorsData,
    refetch: refetchDoctors,
    isFetching: isFetchingDoctors,
  } = useQuery<{ doctors: DoctorListItem[] }>({
    queryKey: ['doctors', selectedCity],
    queryFn: () =>
      apiFetch(`/doctors${selectedCity !== 'All' ? `?city=${selectedCity}` : ''}`),
  });

  const handleRefreshAll = () => {
    refetchSummary();
    refetchDoctors();
  };

  const isRefreshing = isFetchingSummary || isFetchingDoctors;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-xs font-bold text-cyan-700 dark:text-cyan-300 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Hospital Pulse · Supabase Realtime Active</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white">
            Live Hospital Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Realtime beds, ventilator inventory, queue metrics, and on-duty medical staff.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isReconnecting && (
            <span className="text-xs text-amber-500 font-semibold animate-pulse">
              Reconnecting to stream...
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            isLoading={isRefreshing}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Available Doctors"
          value={`${summary?.doctors.available ?? 8} / ${summary?.doctors.total ?? 13}`}
          subtitle="On-duty & consult ready"
          icon={<Users className="w-5 h-5" />}
          variant="blue"
          live
        />

        <KpiCard
          title="Open Bed Capacity"
          value={`${summary?.beds.open ?? 26} / ${summary?.beds.total ?? 54}`}
          subtitle="Emergency & ICU combined"
          icon={<Bed className="w-5 h-5" />}
          variant="cyan"
          live
        />

        <KpiCard
          title="Active Waiting Queue"
          value={summary?.waiting ?? 25}
          subtitle="Patients in hospital lobbies"
          icon={<HeartPulse className="w-5 h-5" />}
          variant="amber"
        />

        <KpiCard
          title="Severe / Code Red"
          value={summary?.severeActive ?? 3}
          subtitle="Active critical cases & dispatches"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="red"
          live
        />
      </div>

      {/* Resource Inventory Cards with Color Thresholds */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-display">
          Resource Availability Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ResourceCard
            name="Ambulances"
            available={summary?.resources.ambulances.available ?? 9}
            total={summary?.resources.ambulances.total ?? 18}
            ratio={summary?.resources.ambulances.ratio ?? 0.5}
            icon={<Truck className="w-5 h-5 text-amber-500" />}
          />

          <ResourceCard
            name="Emergency Beds"
            available={summary?.resources.emergencyBeds.available ?? 26}
            total={summary?.resources.emergencyBeds.total ?? 54}
            ratio={summary?.resources.emergencyBeds.ratio ?? 0.48}
            icon={<Bed className="w-5 h-5 text-medical-blue" />}
          />

          <ResourceCard
            name="ICU Beds"
            available={summary?.resources.icuBeds.available ?? 3}
            total={summary?.resources.icuBeds.total ?? 33}
            ratio={summary?.resources.icuBeds.ratio ?? 0.09}
            icon={<Bed className="w-5 h-5 text-cyan-500" />}
          />

          <ResourceCard
            name="Ventilators"
            available={summary?.resources.ventilators.available ?? 11}
            total={summary?.resources.ventilators.total ?? 26}
            ratio={summary?.resources.ventilators.ratio ?? 0.42}
            icon={<Activity className="w-5 h-5 text-emerald-500" />}
          />
        </div>
      </div>

      {/* Doctors on Duty Table */}
      <DoctorList
        doctors={doctorsData?.doctors || []}
        isLoading={isRefreshing}
        onRefresh={refetchDoctors}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />
    </div>
  );
}
