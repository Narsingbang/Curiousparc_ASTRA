import React, { useState } from 'react';
import {
  DoctorCreateInput,
  DoctorLevel,
  DoctorStatus,
  MEDICAL_SPECIALTIES,
  DOCTOR_LEVELS,
  DOCTOR_STATUSES,
} from '@medisync/shared';
import { apiFetch } from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import { broadcastLiveEvent } from '../../hooks/useRealtime';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDoctorAdded: () => void;
  hospitalId: string;
}

export function AddDoctorModal({
  isOpen,
  onClose,
  onDoctorAdded,
  hospitalId,
}: AddDoctorModalProps) {
  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState<string>(MEDICAL_SPECIALTIES[0]);
  const [level, setLevel] = useState<DoctorLevel>('SPECIALIST');
  const [status, setStatus] = useState<DoctorStatus>('AVAILABLE');
  const [wing, setWing] = useState('Wing A');
  const [floor, setFloor] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useUiStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: DoctorCreateInput = {
        hospital_id: hospitalId,
        full_name: fullName.trim(),
        specialty: specialty as any,
        level,
        status,
        wing,
        floor: Number(floor),
        waiting_count: 0,
        avg_wait_minutes: 0,
      };

      await apiFetch('/staff/doctors', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      broadcastLiveEvent('doctors');

      addToast({
        type: 'success',
        title: 'Doctor Added',
        message: `${fullName} has been added to the on-duty roster.`,
      });

      setFullName('');
      onClose();
      onDoctorAdded();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to Add Doctor',
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Doctor to On-Duty Roster">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Doctor Full Name"
          placeholder="e.g. Dr. Rohan Iyer"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Specialty
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-800 px-3 py-2.5 text-xs font-semibold"
            >
              {MEDICAL_SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Clinical Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as DoctorLevel)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-800 px-3 py-2.5 text-xs font-semibold"
            >
              {DOCTOR_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DoctorStatus)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-800 px-3 py-2.5 text-xs font-semibold"
            >
              {DOCTOR_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Wing"
            placeholder="Wing A"
            value={wing}
            onChange={(e) => setWing(e.target.value)}
          />

          <Input
            label="Floor"
            type="number"
            value={floor}
            onChange={(e) => setFloor(Number(e.target.value))}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Add Doctor
          </Button>
        </div>
      </form>
    </Modal>
  );
}
