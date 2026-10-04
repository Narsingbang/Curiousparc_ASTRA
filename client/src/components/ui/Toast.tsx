import { useUiStore } from '../../store/uiStore';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-medical-blue shrink-0" />,
        };

        const borderColors = {
          success: 'border-emerald-200 dark:border-emerald-800',
          error: 'border-rose-200 dark:border-rose-800',
          warning: 'border-amber-200 dark:border-amber-800',
          info: 'border-blue-200 dark:border-blue-800',
        };

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-white/95 dark:bg-navy-900/95 backdrop-blur-md shadow-xl border text-sm transition-all',
              borderColors[toast.type]
            )}
          >
            {icons[toast.type]}
            <div className="flex-1">
              {toast.title && (
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                  {toast.title}
                </h4>
              )}
              <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
