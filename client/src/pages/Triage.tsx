import { ChatWindow } from '../components/triage/ChatWindow';
import { HeartPulse, ShieldAlert } from 'lucide-react';
import { STANDARD_ADVISORIES } from '@medisync/shared';

export default function Triage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-xs font-bold text-medical-blue">
          <HeartPulse className="w-4 h-4" />
          <span>AI Symptom Router</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white">
          Clinical Triage & Routing
        </h1>
        <p className="text-sm text-slate-500">
          Describe your symptoms. The AI will ask up to 3 focused follow-up questions, then route you to an available doctor based on clinical severity.
        </p>
      </div>

      <ChatWindow />

      <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5 text-center">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <p>{STANDARD_ADVISORIES.TRIAGE_FOOTER}</p>
      </div>
    </div>
  );
}
