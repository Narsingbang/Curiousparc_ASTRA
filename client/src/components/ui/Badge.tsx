import React from 'react';
import { cn } from '../../lib/utils';
import {
  DoctorStatus,
  DoctorLevel,
  SeverityLevel,
  DispatchStatus,
} from '@medisync/shared';
import {
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  MinusCircle,
  Award,
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  Truck,
  CheckCheck,
  XCircle,
} from 'lucide-react';

export function StatusBadge({ status }: { status: DoctorStatus }) {
  const configs: Record<
    DoctorStatus,
    { label: string; bg: string; text: string; icon: React.ReactNode }
  > = {
    AVAILABLE: {
      label: 'Available',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      text: 'text-emerald-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    BUSY: {
      label: 'Busy',
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      text: 'text-amber-700',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    IN_SURGERY: {
      label: 'In Surgery',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
      text: 'text-indigo-700',
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    EMERGENCY: {
      label: 'Emergency',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      text: 'text-rose-700',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    OFF_DUTY: {
      label: 'Off Duty',
      bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      text: 'text-slate-600',
      icon: <MinusCircle className="w-3.5 h-3.5" />,
    },
  };

  const c = configs[status] || configs.OFF_DUTY;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        c.bg
      )}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

export function LevelBadge({ level }: { level: DoctorLevel }) {
  if (level === 'SPECIALIST') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
        <Award className="w-3 h-3 text-purple-600 dark:text-purple-400" />
        Specialist
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800">
      <GraduationCap className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
      Junior Intern
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  if (severity === 'SEVERE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
        <ShieldAlert className="w-4 h-4 text-rose-600" />
        Severe
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
      <ShieldCheck className="w-4 h-4 text-emerald-600" />
      Mild
    </span>
  );
}

export function DispatchBadge({ status }: { status: DispatchStatus }) {
  const configs: Record<
    DispatchStatus,
    { label: string; bg: string; icon: React.ReactNode }
  > = {
    PENDING: {
      label: 'Pending',
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    ASSIGNED: {
      label: 'Assigned',
      bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    EN_ROUTE: {
      label: 'En Route',
      bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300',
      icon: <Truck className="w-3.5 h-3.5" />,
    },
    ARRIVED: {
      label: 'Arrived',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
      icon: <CheckCheck className="w-3.5 h-3.5" />,
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  };

  const c = configs[status] || configs.PENDING;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        c.bg
      )}
    >
      {c.icon}
      {c.label}
    </span>
  );
}
