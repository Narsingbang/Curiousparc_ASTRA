import React from 'react';
import { getResourceStatus } from '../../lib/format';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface ResourceCardProps {
  name: string;
  available: number;
  total: number;
  ratio: number;
  icon: React.ReactNode;
}

export function ResourceCard({
  name,
  available,
  total,
  ratio,
  icon,
}: ResourceCardProps) {
  const status = getResourceStatus(ratio);
  const percentage = Math.min(100, Math.round(ratio * 100));

  const progressColors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-rose-500',
  };

  const statusIcons = {
    green: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    yellow: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    red: <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-navy-900 p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200">
            {icon}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white font-display">
              {name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold">
              {statusIcons[status.color]}
              <span className={status.textClass}>{status.label}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black font-display text-slate-900 dark:text-white">
            {available}
          </span>
          <span className="text-xs text-slate-400 font-medium"> / {total}</span>
        </div>
      </div>

      {/* Progress Bar with Color Thresholds */}
      <div className="w-full bg-slate-100 dark:bg-navy-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn('h-2.5 rounded-full transition-all duration-500', progressColors[status.color])}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-medium">
        <span>Available: {percentage}%</span>
        <span>{total - available} in use</span>
      </div>
    </div>
  );
}
