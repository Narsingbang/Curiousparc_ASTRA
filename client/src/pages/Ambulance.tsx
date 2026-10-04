import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useRealtimeSubscription } from '../hooks/useRealtime';
import {
  DispatchNeed,
  MEDICAL_SPECIALTIES,
  RankedHospitalRecommendation,
  EmergencyRequestRecord,
} from '@medisync/shared';
import { RecommendationCard } from '../components/ambulance/RecommendationCard';
import { IncomingRequestsFeed } from '../components/ambulance/IncomingRequestsFeed';
import { Button } from '../components/ui/Button';
import {
  Truck,
  Compass,
  Radio,
  Sliders,
  Bed,
  Activity,
  Layers,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function Ambulance() {
  const { role, token, quickDemoLogin } = useAuthStore();
  const [selectedNeeds, setSelectedNeeds] = useState<DispatchNeed[]>(['EMERGENCY_BED']);
  const [specialty, setSpecialty] = useState<string>('All');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({
    lat: 18.5204,
    lng: 73.8567, // Default Pune City Center
  });
  const [isLocating, setIsLocating] = useState(false);

  // Realtime subscription for incoming emergency requests
  useRealtimeSubscription(['emergency_requests']);

  // Fetch hospital recommendations
  const {
    data: recData,
    refetch: refetchRecs,
    isFetching: isFetchingRecs,
  } = useQuery<{ recommendations: RankedHospitalRecommendation[] }>({
    queryKey: ['ambulance-recs', coords, selectedNeeds, specialty],
    queryFn: () => {
      const params = new URLSearchParams();
      if (coords.lat) params.set('lat', coords.lat.toString());
      if (coords.lng) params.set('lng', coords.lng.toString());
      selectedNeeds.forEach((n) => params.append('needs[]', n));
      if (specialty !== 'All') params.set('specialty', specialty);
      return apiFetch(`/ambulance/recommendations?${params.toString()}`);
    },
  });

  // Fetch incoming emergency requests
  const {
    data: requestsData,
    refetch: refetchRequests,
    isFetching: isFetchingRequests,
  } = useQuery<{ requests: EmergencyRequestRecord[] }>({
    queryKey: ['emergency-requests'],
    queryFn: () => apiFetch('/emergency-requests'),
    enabled: role === 'ambulance' || role === 'staff' || !!token,
  });

  const handleToggleNeed = (need: DispatchNeed) => {
    setSelectedNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { timeout: 8000 }
    );
  };

  const isAuthorized = role === 'ambulance' || role === 'staff';

  return (
    <div className="min-h-screen bg-navy-950 text-white p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-glow-cyan">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-2xl tracking-wider text-cyan-400">
                DRIVER MODE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                HUD ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-contrast triage routing, open bay inventory, and realtime dispatch queue
            </p>
          </div>
        </div>

        {!isAuthorized && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Public Preview Mode</span>
            <Button
              variant="cyan"
              size="sm"
              onClick={() => quickDemoLogin('ambulance')}
              className="font-bold text-xs"
            >
              Log In as Paramedic Driver
            </Button>
          </div>
        )}
      </div>

      {/* Grid: Recommendation Filters & Ranked Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Resource Filters */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-navy-900 border border-slate-800 space-y-5">
            <h3 className="font-bold text-base font-display text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Patient Resource Requirements
            </h3>

            {/* Checkbox Need Selectors */}
            <div className="space-y-2.5">
              {[
                { id: 'EMERGENCY_BED', label: 'Emergency Bed', icon: <Bed className="w-4 h-4" /> },
                { id: 'ICU_BED', label: 'ICU Bed (Critical)', icon: <Bed className="w-4 h-4 text-cyan-400" /> },
                { id: 'VENTILATOR', label: 'Ventilator / Oxygen', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
              ].map((item) => {
                const isChecked = selectedNeeds.includes(item.id as DispatchNeed);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleNeed(item.id as DispatchNeed)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm font-semibold transition-all ${
                      isChecked
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      {item.label}
                    </span>
                    <span
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs ${
                        isChecked
                          ? 'bg-cyan-500 border-cyan-400 text-navy-950 font-bold'
                          : 'border-slate-700'
                      }`}
                    >
                      {isChecked && '✓'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Specialty Requirement Dropdown */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Specialist Department Needed
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-navy-950 px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="All">Any Department (General/ER)</option>
                {MEDICAL_SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Geolocation Trigger */}
            <Button
              variant="outline"
              size="md"
              className="w-full border-slate-700 text-cyan-300 hover:bg-slate-800"
              onClick={handleGetLocation}
              isLoading={isLocating}
            >
              <Compass className="w-4 h-4 mr-2" />
              Use Current Vehicle GPS Coords
            </Button>
          </div>

          {/* Incoming Emergency Requests Feed */}
          {isAuthorized && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base font-display text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                  Live Dispatch Feed
                </h3>
                <span className="text-xs text-slate-400">
                  {requestsData?.requests?.length || 0} active
                </span>
              </div>
              <IncomingRequestsFeed
                requests={requestsData?.requests || []}
                onStatusUpdated={refetchRequests}
                isReadOnly={!isAuthorized}
              />
            </div>
          )}
        </div>

        {/* Right Columns: Ranked Hospital Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base font-display text-white">
              Ranked Receiving Hospitals (Top Matches)
            </h3>
            <span className="text-xs text-slate-400">
              Deterministic Algorithm · Updated Live
            </span>
          </div>

          <div className="space-y-4">
            {recData?.recommendations?.map((h, idx) => (
              <RecommendationCard key={h.hospital_id} hospital={h} rank={idx + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
