import { AuditLogEntry } from '@medisync/shared';
import { formatDate } from '../../lib/format';
import { ShieldCheck, Clock, User } from 'lucide-react';

interface AuditFeedProps {
  logs: AuditLogEntry[];
}

export function AuditFeed({ logs }: AuditFeedProps) {
  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        No recent audit actions logged.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <ShieldCheck className="w-5 h-5 text-medical-blue" />
        <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
          Staff Operational Audit Trail
        </h3>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start justify-between gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {log.action}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-navy-800 text-slate-600 dark:text-slate-300 font-semibold">
                  {log.entity}
                </span>
              </div>
              <p className="text-slate-500">
                Actor: {log.actor_name || 'System / Staff'} · Details:{' '}
                {JSON.stringify(log.meta)}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(log.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
