import { useState } from 'react';
import { DoctorLevel, DoctorStatus } from '@medisync/shared';
import { StatusBadge, LevelBadge } from '../ui/Badge';
import { formatWaitTime } from '../../lib/format';
import { Search, MapPin, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export interface DoctorListItem {
  id: string;
  full_name: string;
  specialty: string;
  level: DoctorLevel;
  status: DoctorStatus;
  wing: string;
  floor: number;
  waiting_count: number;
  avg_wait_minutes: number;
  updated_at: string;
  hospitals?: {
    name: string;
    city: string;
  };
}

interface DoctorListProps {
  doctors: DoctorListItem[];
  isLoading: boolean;
  onRefresh: () => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export function DoctorList({
  doctors,
  isLoading,
  onRefresh,
  selectedCity,
  onCityChange,
}: DoctorListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const specialties = [
    'All',
    ...Array.from(new Set(doctors.map((d) => d.specialty))),
  ];

  const filtered = doctors.filter((d) => {
    const matchSearch =
      d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.hospitals?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSpecialty =
      selectedSpecialty === 'All' || d.specialty === selectedSpecialty;

    return matchSearch && matchSpecialty;
  });

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md p-6 shadow-sm">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-medical-blue" />
            Doctors on Duty
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime hospital roster & wait times across connected facilities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* City Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-navy-800 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Cities</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
            </select>
          </div>

          {/* Specialty Filter */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="bg-slate-100 dark:bg-navy-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 sm:w-60 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-800 text-xs focus:outline-none focus:ring-2 focus:ring-medical-blue/30"
            />
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            isLoading={isLoading}
            className="h-8 px-2.5"
            title="Refresh doctor roster"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-3">Doctor</th>
              <th className="py-3 px-3">Specialty & Level</th>
              <th className="py-3 px-3">Hospital & Location</th>
              <th className="py-3 px-3">Queue & Estimated Wait</th>
              <th className="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                  No doctors found matching the search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-navy-800/40 transition-colors group"
                >
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {doc.full_name}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {doc.specialty}
                      </span>
                      <LevelBadge level={doc.level} />
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {doc.hospitals?.name || 'MediSync Central Hospital'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {doc.wing}, Floor {doc.floor} · {doc.hospitals?.city || 'Pune'}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {formatWaitTime(doc.waiting_count, doc.avg_wait_minutes)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {doc.waiting_count === 0 ? 'Direct consult available' : 'In waiting lobby'}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <StatusBadge status={doc.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
