import { TriageAssessment } from '@medisync/shared';
import { SeverityBadge } from '../ui/Badge';
import {
  ShieldAlert,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface AssessmentCardProps {
  assessment: TriageAssessment;
  isFallback?: boolean;
}

export function AssessmentCard({ assessment, isFallback }: AssessmentCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 p-6 shadow-lg space-y-6">
      {/* Header with Severity & Specialty */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Triage Assessment
            </span>
            {isFallback && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                Deterministic Rule Fallback
              </span>
            )}
          </div>
          <h3 className="text-xl font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-medical-blue" />
            {assessment.specialty} Evaluation
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <SeverityBadge severity={assessment.severity} />
          <div className="text-right">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {Math.round(assessment.confidence * 100)}%
            </span>
            <span className="text-[10px] text-slate-400 block">Confidence</span>
          </div>
        </div>
      </div>

      {/* Plain Language Summary */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-medical-blue" />
          Clinical Summary
        </h4>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {assessment.summary}
        </p>
      </div>

      {/* Red Flags if any */}
      {assessment.red_flags && assessment.red_flags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            Red Flags & Risk Factors Detected
          </h4>
          <div className="flex flex-wrap gap-2">
            {assessment.red_flags.map((flag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Self-care / Next steps advice */}
      {assessment.advice && assessment.advice.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Safe Next Steps & Self-Care Guidance
          </h4>
          <ul className="space-y-2">
            {assessment.advice.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Non-clinical advisory footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center sm:text-left">
        MediSync AI provides triage guidance, not a medical diagnosis. If you think this is an emergency, call 112 or 108 immediately.
      </div>
    </div>
  );
}
