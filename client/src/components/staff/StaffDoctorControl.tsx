import { useState, useEffect } from 'react';
import { DoctorStatus, DOCTOR_STATUSES } from '@medisync/shared';
import { apiFetch } from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import { broadcastLiveEvent } from '../../hooks/useRealtime';
import { DoctorListItem } from '../dashboard/DoctorList';
import { StatusBadge, LevelBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Plus, Minus, Trash2, Clock } from 'lucide-react';

interface StaffDoctorControlProps {
  doctors: DoctorListItem[];
  onDoctorsUpdated: () => void;
}

export function StaffDoctorControl({
  doctors,
  onDoctorsUpdated,
}: StaffDoctorControlProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [optimisticDoctors, setOptimisticDoctors] = useState<DoctorListItem[]>(doctors);
  const { addToast } = useUiStore();

  useEffect(() => {
    setOptimisticDoctors(doctors);
  }, [doctors]);

  const handleStatusChange = async (doctor: DoctorListItem, status: DoctorStatus) => {
    const prevDoctors = [...optimisticDoctors];
    setOptimisticDoctors((prev) =>
      prev.map((d) => (d.id === doctor.id ? { ...d, status } : d))
    );
    setUpdatingId(doctor.id);
    try {
      await apiFetch(`/staff/doctors/${doctor.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      addToast({
        type: 'success',
        title: 'Doctor Status Updated',
        message: `${doctor.full_name} status set to ${status}`,
      });

      broadcastLiveEvent('doctors');
      onDoctorsUpdated();
    } catch (err: any) {
      // Roll back optimistic update on failure
      setOptimisticDoctors(prevDoctors);
      addToast({
        type: 'error',
        title: 'Status Update Failed',
        message: err.message || 'Could not update status.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQueueStep = async (
    doctor: DoctorListItem,
    field: 'waiting_count' | 'avg_wait_minutes',
    delta: number
  ) => {
    const currentVal = doctor[field];
    const nextVal = Math.max(0, currentVal + delta);
    if (nextVal === currentVal) return;

    const prevDoctors = [...optimisticDoctors];
    setOptimisticDoctors((prev) =>
      prev.map((d) => (d.id === doctor.id ? { ...d, [field]: nextVal } : d))
    );
    setUpdatingId(doctor.id);
    try {
      await apiFetch(`/staff/doctors/${doctor.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: nextVal }),
      });

      broadcastLiveEvent('doctors');
      onDoctorsUpdated();
    } catch (err: any) {
      // Roll back optimistic update on failure
      setOptimisticDoctors(prevDoctors);
      addToast({
        type: 'error',
        title: 'Queue Update Failed',
        message: err.message || 'Could not update queue count.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteDoctor = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from active staff?`))
      return;

    try {
      await apiFetch(`/staff/doctors/${id}`, { method: 'DELETE' });
      addToast({
        type: 'info',
        title: 'Doctor Removed',
        message: `${name} was removed from the roster.`,
      });
      broadcastLiveEvent('doctors');
      onDoctorsUpdated();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      {optimisticDoctors.map((doc) => (
        <div
          key={doc.id}
          className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {doc.full_name}
                </h4>
                <LevelBadge level={doc.level} />
              </div>
              <p className="text-xs text-slate-500">
                {doc.specialty} · {doc.wing}, Floor {doc.floor}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={doc.status} />
              <button
                onClick={() => handleDeleteDoctor(doc.id, doc.full_name)}
                className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                title="Remove doctor"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tap-to-update status pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              One-Tap Status Override
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DOCTOR_STATUSES.map((st) => (
                <button
                  key={st}
                  disabled={updatingId === doc.id}
                  onClick={() => handleStatusChange(doc, st)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    doc.status === st
                      ? 'bg-medical-blue text-white shadow-sm ring-2 ring-medical-blue/40'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Queue & Wait Steppers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
            {/* Waiting Count */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Waiting Patients
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => handleQueueStep(doc, 'waiting_count', -1)}
                  disabled={doc.waiting_count === 0}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="font-bold font-mono text-sm w-8 text-center text-slate-900 dark:text-white">
                  {doc.waiting_count}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => handleQueueStep(doc, 'waiting_count', 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Estimated Avg Wait Minutes */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-medical-blue" />
                Avg Wait (Min)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => handleQueueStep(doc, 'avg_wait_minutes', -5)}
                  disabled={doc.avg_wait_minutes === 0}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="font-bold font-mono text-sm w-10 text-center text-slate-900 dark:text-white">
                  {doc.avg_wait_minutes}m
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => handleQueueStep(doc, 'avg_wait_minutes', 5)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
