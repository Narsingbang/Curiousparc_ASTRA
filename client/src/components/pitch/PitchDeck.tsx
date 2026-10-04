import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Milestone,
  TrendingUp,
  Users,
  Play,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Building2,
  Activity,
  HeartPulse,
} from 'lucide-react';

export function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Problem & Critical Gaps in Indian Emergency Care',
      subtitle: 'The Healthcare Inefficiency Crisis in Emergency Response',
      icon: <AlertTriangle className="w-8 h-8 text-rose-500" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 space-y-3">
            <span className="text-2xl font-black text-rose-600 font-display">01</span>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Blind Ambulance Routing
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Paramedics and ambulances drive blindly based on phone calls or guesswork, arriving only to find no open ICU beds or ventilators.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
            <span className="text-2xl font-black text-amber-600 font-display">02</span>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              ER Specialist Overload
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Super-specialists get tied up with mild coughs or routine ailments while critical emergencies wait in overcrowded triage lobbies.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-3">
            <span className="text-2xl font-black text-medical-blue font-display">03</span>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Fragmented Health Records
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Patients arrive with scattered paper prescriptions; attending emergency doctors have zero visibility into drug allergies or cardiac history.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'The Solution — MediSync AI',
      subtitle: 'Live Hospital Availability + Clinical AI Triage in One App',
      icon: <Lightbulb className="w-8 h-8 text-amber-500" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-medical-blue">
              <HeartPulse className="w-5 h-5" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Intelligent Clinical Triage
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Patients chat with our cautious AI assistant (Gemini 3.8 Flash with deterministic safety overrides). Classifies severity as MILD or SEVERE, automatically routing Mild cases to Junior Interns and Severe cases to On-Duty Specialists.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-cyan-500">
              <Activity className="w-5 h-5" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Hospital Pulse & Realtime Inventory
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Public dashboard broadcasting live doctor on-duty status, queues, and bed/ventilator availability with sub-second Supabase Realtime synchronization across all devices.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-500">
              <Building2 className="w-5 h-5" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Deterministic Ambulance Re-Ranking
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              High-contrast Driver Mode ranks receiving hospitals using a multi-factor formula (Haversine distance, open ICU/ventilator capacity, specialist availability) with zero guesswork.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-purple-500">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Universal Health Vault
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Encrypted patient timeline storing blood group, drug allergies, chronic conditions, and previous triage summaries, exportable as JSON or printable as an intake slip.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Technology & Architecture Flow',
      subtitle: 'INPUT → PROCESS → MODEL → OUTPUT (Strict Server-Side AI Safety)',
      icon: <Cpu className="w-8 h-8 text-cyan-500" />,
      content: (
        <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                1. INPUT
              </div>
              <h5 className="font-bold text-sm">Patient / Driver</h5>
              <p className="text-[11px] text-slate-400">
                Symptom description (voice/text), GPS coordinates, emergency needs (ICU, vent)
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                2. PROCESS
              </div>
              <h5 className="font-bold text-sm">Deterministic Filters</h5>
              <p className="text-[11px] text-slate-400">
                Server-side red flag scanner (&gt;=30 keywords in English/Hindi/Marathi), rate limiter, prompt-injection shield
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                3. MODEL
              </div>
              <h5 className="font-bold text-sm">Gemini 3.8 Flash</h5>
              <p className="text-[11px] text-slate-400">
                Structured JSON schema validation via Zod, model fallback chain, safe self-care advice
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                4. OUTPUT
              </div>
              <h5 className="font-bold text-sm">Realtime Action</h5>
              <p className="text-[11px] text-slate-400">
                MILD → Junior Intern, SEVERE → Specialist, 112/108 banner, ranked hospital GPS deep link
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800/80 text-xs text-slate-400 flex flex-wrap justify-between items-center gap-2">
            <span>Stack: React 18, Vite, Three.js, Express TypeScript, Supabase Realtime, PostgreSQL, Google GenAI SDK</span>
            <span className="text-emerald-400 font-bold">100% Server-Side Secrets Security</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Implementation Roadmap',
      subtitle: 'From Hackathon MVP to State-Wide Innovation Deployment',
      icon: <Milestone className="w-8 h-8 text-medical-blue" />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
          <div className="p-5 rounded-3xl bg-blue-50/60 dark:bg-navy-900 border border-medical-blue/40 shadow-sm space-y-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-medical-blue text-white">
              Phase 1: NOW
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Hackathon MVP
            </h4>
            <p className="text-xs text-slate-500">
              End-to-end working prototype: 3D landing, symptom chat, live dashboard, driver mode, health vault, staff console.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Phase 2: NEXT
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Clinical & UAT Testing
            </h4>
            <p className="text-xs text-slate-500">
              Clinical validation with doctors from Pune hospitals, multi-lingual voice enhancements, FHIR/ABHA integration.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Phase 3: PILOT
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Hospital Pilot Cluster
            </h4>
            <p className="text-xs text-slate-500">
              Onboard 5 emergency care centers in Pune-Mumbai corridor. Hardware IoT integration with ambulance telemetry.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Phase 4: SCALE
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              State Emergency Grid
            </h4>
            <p className="text-xs text-slate-500">
              Direct API integration with 108 Emergency Medical Services fleet across Maharashtra state.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Team ASTRA & Hackathon Partners',
      subtitle: 'CURIOUSPARC 2026 State Innovation Challenge — Team ASTRA (VIT Pune)',
      icon: <Users className="w-8 h-8 text-emerald-500" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-medical-blue">
                Team Leader
              </span>
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                Rushikesh Soni
              </h4>
              <p className="text-xs text-slate-500">
                Full-Stack Architecture & Realtime Systems · VIT Pune
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">
                Co-Developer & Systems
              </span>
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                Narsing Bang
              </h4>
              <p className="text-xs text-slate-500">
                AI Pipeline & Cloud Integration · VIT Pune
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                Creative Technologist
              </span>
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                Pawan Sankhla
              </h4>
              <p className="text-xs text-slate-500">
                3D Motion & Frontend UX · VIT Pune
              </p>
            </div>
          </div>

          {/* Sponsors & Institution Badges */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3 text-center">
              Institutional Partners & Challenge Sponsors
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                'VIT Pune',
                'Christ University',
                'Google for Developers',
                'Supabase',
                'Vercel',
                'Government of Maharashtra Health Mission',
                'CuriousParc 2026',
                'AWS Healthcare',
                'GitHub Education',
                'Apollo Telehealth',
              ].map((partner, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Top Deck Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-medical-blue text-white">
            SLIDE {currentSlide + 1} OF {slides.length}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            (Use ← → Arrow Keys to navigate)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
            disabled={currentSlide === 0}
            className="h-9 w-9 rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
            disabled={currentSlide === slides.length - 1}
            className="h-9 w-9 rounded-xl"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Link to="/triage">
            <Button variant="primary" size="sm" className="shadow-glow-blue ml-2 font-bold">
              <Play className="w-3.5 h-3.5 fill-white mr-1.5" /> Start Live Demo
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl min-h-[500px] flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-navy-800">
              {slide.icon}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
                {slide.title}
              </h2>
              <p className="text-sm font-semibold text-medical-blue mt-0.5">
                {slide.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-8">{slide.content}</div>
        </div>

        {/* Slide Indicator Dots */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800 mt-8">
          <span className="text-xs text-slate-400">
            CURIOUSPARC 2026 · State Innovation Challenge · Team ASTRA
          </span>
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === i ? 'w-8 bg-medical-blue' : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
