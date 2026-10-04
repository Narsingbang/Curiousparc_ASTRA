import { Link } from 'react-router-dom';
import { ShieldAlert, Heart, Activity, PhoneCall } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-navy-950/80 backdrop-blur-md pt-12 pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mandatory Demo Disclaimer Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center gap-3 text-xs leading-relaxed text-center sm:text-left">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p>
            <strong className="font-semibold">DEMONSTRATION & NON-CLINICAL ADVISORY:</strong>{' '}
            MediSync AI is an AI-powered triage and hospital availability prototype built for the{' '}
            <strong>CURIOUSPARC 2026 State Innovation Challenge</strong>. It does not provide medical diagnoses or replace clinical judgement. In any real emergency, immediately call{' '}
            <strong className="underline">112</strong> (National Emergency) or{' '}
            <strong className="underline">108</strong> (Ambulance).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200/60 dark:border-slate-800/80 text-sm">
          {/* Brand & Team */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-medical-blue flex items-center justify-center text-white font-bold text-sm">
                ✦
              </div>
              <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-white">
                MediSync AI
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Live hospital availability + AI triage in one unified platform.
            </p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Team ASTRA · VIT Pune
            </p>
            <p className="text-[11px] text-slate-400">
              Rushikesh Soni, Narsing Bang, Pawan Sankhla
            </p>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Application Modules
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/triage" className="hover:text-medical-blue transition-colors">
                  AI Symptom Router (Triage)
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-medical-blue transition-colors">
                  Hospital Pulse (Live Dashboard)
                </Link>
              </li>
              <li>
                <Link to="/ambulance" className="hover:text-medical-blue transition-colors">
                  Ambulance Driver Mode
                </Link>
              </li>
              <li>
                <Link to="/call-ambulance" className="hover:text-medical-blue transition-colors">
                  Request Emergency Dispatch
                </Link>
              </li>
              <li>
                <Link to="/vault" className="hover:text-medical-blue transition-colors">
                  Universal Health Vault
                </Link>
              </li>
            </ul>
          </div>

          {/* Hackathon & Pitch */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Presentation
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/pitch" className="hover:text-medical-blue transition-colors">
                  Hackathon Pitch Walkthrough
                </Link>
              </li>
              <li>
                <Link to="/pitch#architecture" className="hover:text-medical-blue transition-colors">
                  System Architecture (Diagram)
                </Link>
              </li>
              <li>
                <Link to="/staff" className="hover:text-medical-blue transition-colors">
                  Hospital Staff Console
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-medical-blue transition-colors">
                  Demo Accounts Login
                </Link>
              </li>
            </ul>
          </div>

          {/* India Emergency Hotlines */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" /> Emergency Hotlines
            </h4>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span>National Emergency:</span>
                <a href="tel:112" className="font-bold text-rose-600 hover:underline">
                  112
                </a>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Medical Ambulance:</span>
                <a href="tel:108" className="font-bold text-rose-600 hover:underline">
                  108
                </a>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Mental Health (Tele-MANAS):</span>
                <a href="tel:14416" className="font-bold text-medical-blue hover:underline">
                  14416
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© 2026 MediSync AI. Designed for CURIOUSPARC 2026.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> by Team ASTRA (VIT Pune)
          </p>
        </div>
      </div>
    </footer>
  );
}
