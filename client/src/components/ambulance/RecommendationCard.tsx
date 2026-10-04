import { RankedHospitalRecommendation } from '@medisync/shared';
import {
  Building2,
  Navigation,
  Clock,
  MapPin,
  CheckCircle2,
  Phone,
  Bed,
  Activity,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface RecommendationCardProps {
  hospital: RankedHospitalRecommendation;
  rank: number;
}

export function RecommendationCard({ hospital, rank }: RecommendationCardProps) {
  const isTopMatch = rank === 1;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`;

  return (
    <div
      className={`rounded-3xl p-6 border transition-all duration-300 ${
        isTopMatch
          ? 'bg-gradient-to-br from-blue-900/40 via-navy-900 to-navy-950 border-cyan-500/50 shadow-glow-cyan/20 ring-1 ring-cyan-500/40'
          : 'bg-navy-900/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-display font-extrabold text-sm ${
              isTopMatch
                ? 'bg-gradient-to-tr from-cyan-400 to-medical-blue text-white shadow-glow-cyan'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            #{rank}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              {hospital.name}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {hospital.address}, {hospital.city}
            </p>
          </div>
        </div>

        {/* Distance & ETA Badge */}
        <div className="flex items-center gap-2">
          <div className="text-right px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-1 text-cyan-400 font-bold text-sm">
              <Clock className="w-3.5 h-3.5" />
              ~{hospital.eta_min} min
            </div>
            <span className="text-[10px] text-slate-400">{hospital.distance_km} km away</span>
          </div>

          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="cyan" size="sm" className="font-bold">
              <Navigation className="w-3.5 h-3.5 mr-1" />
              Navigate
            </Button>
          </a>
        </div>
      </div>

      {/* Capacity Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs">
        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
            Emergency Beds
          </span>
          <span className="text-base font-bold text-white mt-0.5 block">
            {hospital.capacity_summary.emergency_beds.available}
            <span className="text-xs text-slate-400 font-normal">
              /{hospital.capacity_summary.emergency_beds.total}
            </span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
            ICU Beds
          </span>
          <span className="text-base font-bold text-cyan-300 mt-0.5 block">
            {hospital.capacity_summary.icu_beds.available}
            <span className="text-xs text-slate-400 font-normal">
              /{hospital.capacity_summary.icu_beds.total}
            </span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
            Ventilators
          </span>
          <span className="text-base font-bold text-emerald-400 mt-0.5 block">
            {hospital.capacity_summary.ventilators.available}
            <span className="text-xs text-slate-400 font-normal">
              /{hospital.capacity_summary.ventilators.total}
            </span>
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
            Ambulance Bays
          </span>
          <span className="text-base font-bold text-amber-400 mt-0.5 block">
            {hospital.capacity_summary.ambulances.available}
            <span className="text-xs text-slate-400 font-normal">
              /{hospital.capacity_summary.ambulances.total}
            </span>
          </span>
        </div>
      </div>

      {/* Reasons Why Ranked */}
      <div className="pt-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Deterministic Ranking Justification
        </h4>
        <div className="flex flex-wrap gap-2">
          {hospital.reasons.map((reason, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/70 border border-slate-700/80 text-slate-200"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              {reason}
            </span>
          ))}
        </div>
      </div>

      {hospital.phone && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Direct ER Intake Desk:</span>
          <a
            href={`tel:${hospital.phone}`}
            className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <Phone className="w-3.5 h-3.5" />
            {hospital.phone}
          </a>
        </div>
      )}
    </div>
  );
}
