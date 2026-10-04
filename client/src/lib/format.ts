import { RESOURCE_THRESHOLDS } from '@medisync/shared';

export function formatWaitTime(waitingCount: number, avgWaitMinutes: number): string {
  if (waitingCount === 0) return 'No queue';
  return `~${avgWaitMinutes} min (${waitingCount} waiting)`;
}

export function getResourceStatus(ratio: number): {
  color: 'green' | 'yellow' | 'red';
  bgClass: string;
  textClass: string;
  borderClass: string;
  label: string;
} {
  if (ratio >= RESOURCE_THRESHOLDS.GREEN) {
    return {
      color: 'green',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      label: 'Good Capacity',
    };
  }

  if (ratio >= RESOURCE_THRESHOLDS.YELLOW) {
    return {
      color: 'yellow',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40',
      textClass: 'text-amber-700 dark:text-amber-300',
      borderClass: 'border-amber-200 dark:border-amber-800',
      label: 'Moderate',
    };
  }

  return {
    color: 'red',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-200 dark:border-rose-800',
    label: 'Critical / Low',
  };
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
