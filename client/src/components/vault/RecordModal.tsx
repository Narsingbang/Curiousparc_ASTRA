import React, { useState } from 'react';
import { RecordCreateInput, SeverityLevel } from '@medisync/shared';
import { apiFetch } from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordSaved: () => void;
}

export function RecordModal({ isOpen, onClose, onRecordSaved }: RecordModalProps) {
  const [title, setTitle] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('MILD');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { addToast } = useUiStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const payload: RecordCreateInput = {
        source: 'MANUAL',
        title: title.trim(),
        symptoms: symptoms.trim() || undefined,
        severity,
        notes: notes.trim() || undefined,
      };

      await apiFetch('/vault/records', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      addToast({
        type: 'success',
        title: 'Record Saved',
        message: 'Manual health entry recorded in vault.',
      });

      setTitle('');
      setSymptoms('');
      setNotes('');
      onClose();
      onRecordSaved();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Saving Record',
        message: err.message || 'Could not save record',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Health Record Entry">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Record Title / Reason for Visit"
          placeholder="e.g. Annual Blood Panel & Cardiology Consult"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Recorded Symptoms
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Mild headache and blurred vision after reading"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-800 px-4 py-2.5 text-sm"
          />
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Severity Assessment
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer">
              <input
                type="radio"
                name="severity"
                value="MILD"
                checked={severity === 'MILD'}
                onChange={() => setSeverity('MILD')}
              />
              Mild / Routine
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400 cursor-pointer">
              <input
                type="radio"
                name="severity"
                value="SEVERE"
                checked={severity === 'SEVERE'}
                onChange={() => setSeverity('SEVERE')}
              />
              Severe / Urgent
            </label>
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Physician Notes / Prescribed Tests
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Blood pressure 125/82. Advised 30 minutes brisk walking daily."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-800 px-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
            Save to Vault
          </Button>
        </div>
      </form>
    </Modal>
  );
}
