import { DispatchForm } from '../components/ambulance/DispatchForm';
import { PhoneCall } from 'lucide-react';

export default function CallAmbulance() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-xs font-bold text-rose-600">
          <PhoneCall className="w-4 h-4 animate-pulse" />
          <span>Emergency Response Dispatch</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white">
          Request Medical Dispatch
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Provide the patient location and condition. Our AI dispatch system analyzes the notes to prepare hospital ICU beds and reserve the closest qualified ambulance unit.
        </p>
      </div>

      <DispatchForm />
    </div>
  );
}
