import React from 'react';
import { cn } from '../../lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  variant?: 'blue' | 'cyan' | 'amber' | 'red';
  live?: boolean;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'blue',
  live = false,
}: KpiCardProps) {
  const variantStyles = {
    blue: 'border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/60 to-white dark:from-navy-900 dark:to-navy-950',
    cyan: 'border-cyan-200/80 dark:border-cyan-900/50 bg-gradient-to-br from-cyan-50/60 to-white dark:from-navy-900 dark:to-navy-950',
    amber: 'border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/60 to-white dark:from-navy-900 dark:to-navy-950',
    red: 'border-rose-200/80 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/60 to-white dark:from-navy-900 dark:to-navy-950',
  };

  const iconColors = {
    blue: 'text-medical-blue bg-blue-100/70 dark:bg-blue-950/60',
    cyan: 'text-cyan-600 bg-cyan-100/70 dark:bg-cyan-950/60',
    amber: 'text-amber-600 bg-amber-100/70 dark:bg-amber-950/60',
    red: 'text-rose-600 bg-rose-100/70 dark:bg-rose-950/60',
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md backdrop-blur-sm',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {title}
            </span>
            {live && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          <div className="text-3xl font-extrabold font-display text-slate-900 dark:text-white mt-1.5">
            {value}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className={cn('p-3 rounded-2xl shrink-0', iconColors[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
