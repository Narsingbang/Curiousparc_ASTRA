import { RoutedDoctor } from '@medisync/shared';
import { LevelBadge, StatusBadge } from '../ui/Badge';
import { formatWaitTime } from '../../lib/format';
import { Building2, MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface RoutedDoctorCardProps {
  doctor: RoutedDoctor;
}

export function RoutedDoctorCard({ doctor }: RoutedDoctorCardProps) {
  return (
    <div className="rounded-3xl border border-medical-blue/30 dark:border-medical-blue/40 bg-gradient-to-br from-blue-50/50 via-white to-white dark:from-navy-900 dark:via-navy-900 dark:to-navy-950 p-6 shadow-glow-blue/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full bg-medical-blue animate-ping" />
        <span className="text-xs font-bold text-medical-blue uppercase tracking-wider">
          Recommended On-Duty Doctor Routed
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              {doctor.full_name}
            </h3>
            <LevelBadge level={doctor.level} />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {doctor.specialty} Department
          </p>
        </div>

        <StatusBadge status={doctor.status} />
      </div>

      {/* Hospital Location & Waiting Queue Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
            <Building2 className="w-4 h-4 text-medical-blue shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                {doctor.hospital_name}
              </span>
              <span className="text-slate-500 text-[11px]">
                {doctor.wing}, Floor {doctor.floor}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {doctor.hospital_address || doctor.hospital_city}
            </span>
          </div>

          {doctor.hospital_phone && (
            <div className="flex items-center gap-2 text-slate-500">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <a href={`tel:${doctor.hospital_phone}`} className="hover:text-medical-blue">
                {doctor.hospital_phone}
              </a>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white dark:bg-navy-950 p-4 border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="w-4 h-4 text-medical-blue" />
            <span className="font-bold uppercase tracking-wider text-[10px]">
              Live Queue Status
            </span>
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {formatWaitTime(doctor.waiting_count, doctor.avg_wait_minutes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {doctor.waiting_count === 0
              ? 'Zero patients ahead. Ready for immediate consultation.'
              : `${doctor.waiting_count} patient(s) currently ahead of you.`}
          </p>
        </div>
      </div>

      <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-400">
          Walk-in registration counter notified
        </span>
        <Button variant="primary" size="sm" onClick={() => window.print()}>
          Print Triage Slip <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
