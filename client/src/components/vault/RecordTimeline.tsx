import React, { useState } from 'react';
import { PatientRecord, SeverityLevel } from '@medisync/shared';
import { SeverityBadge } from '../ui/Badge';
import { formatDate } from '../../lib/format';
import { apiFetch } from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { RecordModal } from './RecordModal';
import {
  FileText,
  Calendar,
  Download,
  Printer,
  Plus,
  Trash2,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

interface RecordTimelineProps {
  records: PatientRecord[];
  onRefresh: () => void;
}

export function RecordTimeline({ records, onRefresh }: RecordTimelineProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { addToast } = useUiStore();

  const filtered = records.filter((r) => {
    if (selectedSeverity === 'All') return true;
    return r.severity === selectedSeverity;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this health record?')) return;

    setDeletingId(id);
    try {
      await apiFetch(`/vault/records/${id}`, { method: 'DELETE' });
      addToast({
        type: 'info',
        title: 'Record Removed',
        message: 'The record was deleted from your encrypted vault.',
      });
      onRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete record.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportJson = () => {
    const token = localStorage.getItem('medisync_token');
    const url = `/api/vault/export`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `medisync_health_vault_export_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        addToast({
          type: 'success',
          title: 'Export Downloaded',
          message: 'Full JSON health record exported successfully.',
        });
      })
      .catch(() => {
        addToast({
          type: 'error',
          title: 'Export Failed',
          message: 'Could not generate JSON export.',
        });
      });
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Filter:
          </span>
          {(['All', 'MILD', 'SEVERE'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSeverity(s)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedSeverity === s
                  ? 'bg-medical-blue text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {s === 'All' ? 'All Records' : s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print / PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Records Timeline Feed */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-400">
          No health records match this filter. Use the "Add Entry" button to record a consult.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((record) => (
            <div
              key={record.id}
              className="rounded-3xl p-6 bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500">
                      {record.source} RECORD
                    </span>
                    {record.severity && <SeverityBadge severity={record.severity} />}
                  </div>
                  <h4 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                    {record.title}
                  </h4>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(record.created_at)}
                  </span>
                  <button
                    onClick={() => handleDelete(record.id)}
                    disabled={deletingId === record.id}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recorded Symptoms */}
              {record.symptoms && (
                <div className="text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Symptoms
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-navy-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {record.symptoms}
                  </p>
                </div>
              )}

              {/* AI Structured Summary if from Triage */}
              {record.ai_summary && (
                <div className="text-xs p-4 rounded-2xl bg-blue-50/60 dark:bg-navy-950 border border-blue-100 dark:border-blue-900 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-medical-blue flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Triage Clinical Summary
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {record.ai_summary.patient_friendly_summary ||
                      record.ai_summary.summary ||
                      JSON.stringify(record.ai_summary)}
                  </p>
                </div>
              )}

              {/* Doctor details & notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                {record.doctor_name && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Stethoscope className="w-4 h-4 text-medical-blue shrink-0" />
                    <span>
                      Attending: <strong>{record.doctor_name}</strong> (
                      {record.doctor_specialty || 'General'})
                    </span>
                  </div>
                )}
                {record.notes && (
                  <div className="text-slate-500">
                    <strong>Notes:</strong> {record.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecordSaved={onRefresh}
      />
    </div>
  );
}
