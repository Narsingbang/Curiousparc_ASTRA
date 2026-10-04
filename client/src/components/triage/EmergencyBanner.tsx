import { PhoneCall, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export function EmergencyBanner() {
  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-emergency-red text-white p-5 sm:p-6 shadow-glow-red animate-pulse-slow my-4 border border-rose-400">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 text-center md:text-left">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shrink-0 mx-auto md:mx-0">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold font-display tracking-tight text-white">
              Potential Medical Emergency Detected
            </h3>
            <p className="text-xs sm:text-sm text-rose-100 max-w-xl mt-1 leading-relaxed">
              Critical red-flag indicators detected. Do not wait for standard clinic hours.
              Immediately contact emergency response or request high-priority ambulance dispatch.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <a
            href="tel:112"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-rose-700 font-extrabold text-sm shadow-md hover:bg-rose-50 transition-transform active:scale-95"
          >
            <PhoneCall className="w-4 h-4 fill-rose-600" />
            Call 112 (National)
          </a>

          <a
            href="tel:108"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 border border-white/40 text-white font-extrabold text-sm backdrop-blur-sm hover:bg-white/30 transition-transform active:scale-95"
          >
            <PhoneCall className="w-4 h-4" />
            Call 108 (Ambulance)
          </a>

          <Link to="/call-ambulance">
            <Button
              variant="cyan"
              size="md"
              className="font-bold text-sm shadow-glow-cyan"
            >
              Request Ambulance <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
