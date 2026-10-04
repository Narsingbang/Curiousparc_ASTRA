import { useState } from 'react';
import { DispatchStatus, EmergencyRequestRecord } from '@medisync/shared';
import { DispatchBadge } from '../ui/Badge';
import { apiFetch } from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import { broadcastLiveEvent } from '../../hooks/useRealtime';
import {
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface IncomingRequestsFeedProps {
  requests: EmergencyRequestRecord[];
  onStatusUpdated: () => void;
  isReadOnly?: boolean;
}

export function IncomingRequestsFeed({
  requests,
  onStatusUpdated,
  isReadOnly = false,
}: IncomingRequestsFeedProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { addToast } = useUiStore();

  const handleUpdateStatus = async (id: string, nextStatus: DispatchStatus) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/emergency-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });

      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Dispatch request moved to ${nextStatus}`,
      });

      broadcastLiveEvent('emergency_requests');
      onStatusUpdated();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Status Update Failed',
        message: err.message || 'Illegal status transition',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextAction = (
    current: DispatchStatus
  ): { next: DispatchStatus; label: string; variant: 'primary' | 'cyan' | 'emergency' } | null => {
    if (current === 'PENDING') return { next: 'ASSIGNED', label: 'Accept & Assign', variant: 'primary' };
    if (current === 'ASSIGNED') return { next: 'EN_ROUTE', label: 'Mark En Route', variant: 'cyan' };
    if (current === 'EN_ROUTE') return { next: 'ARRIVED', label: 'Mark Arrived', variant: 'primary' };
    if (current === 'ARRIVED') return { next: 'COMPLETED', label: 'Complete Handover', variant: 'primary' };
    return null;
  };

  if (requests.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-navy-900 border border-slate-800 text-center text-slate-400 text-sm">
        No active emergency dispatch requests currently in queue.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => {
        const action = getNextAction(req.status);
        const brief = req.ai_brief || {};

        return (
          <div
            key={req.id}
            className="rounded-3xl p-5 border border-slate-800 bg-navy-900/90 backdrop-blur-md shadow-lg space-y-4"
          >
            {/* Top row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-white text-base font-display">
                  {req.patient_name}
                </span>
                <DispatchBadge status={req.status} />
                {brief.urgency === 'CRITICAL' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                    CRITICAL
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {new Date(req.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {/* Location & Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    Pickup Location
                  </span>
                  <span>{req.location_text}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                    Caller Contact
                  </span>
                  <a href={`tel:${req.phone}`} className="text-cyan-400 hover:underline font-bold">
                    {req.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* AI Paramedic Brief */}
            {brief.paramedic_note && (
              <div className="p-3 rounded-2xl bg-navy-950/70 border border-slate-800 text-xs">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-0.5">
                  AI Paramedic Handover Note ({brief.suspected_category || 'EMERGENCY'})
                </span>
                <p className="text-slate-300">{brief.paramedic_note}</p>
                {brief.needs && (
                  <div className="flex gap-1.5 mt-2">
                    {brief.needs.map((n: string) => (
                      <span
                        key={n}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-semibold"
                      >
                        {n.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            {!isReadOnly && action && (
              <div className="pt-2 flex justify-end">
                <Button
                  variant={action.variant}
                  size="sm"
                  isLoading={updatingId === req.id}
                  onClick={() => handleUpdateStatus(req.id, action.next)}
                  className="font-bold text-xs"
                >
                  {action.label} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
