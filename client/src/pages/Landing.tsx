import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { DashboardSummary } from '@medisync/shared';
import { usePerformanceTier } from '../hooks/usePerformanceTier';
import { useUiStore, OrganType } from '../store/uiStore';
import { Button } from '../components/ui/Button';
import { SceneCanvas } from '../components/three/SceneCanvas';
import { Hero2DFallback } from '../components/three/Hero2DFallback';
import {
  HeartPulse,
  Activity,
  Truck,
  FolderHeart,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Bed,
  Users,
  Compass,
  Play,
  Heart,
  Moon,
  Clock,
  Building2,
  Navigation,
} from 'lucide-react';

const ORGAN_OPTIONS: OrganType[] = [
  'Brain',
  'Thyroid',
  'Stomach',
  'Heart',
  'Lungs',
  'Kidneys',
  'Liver',
];

const ORGAN_PROMPTS: Record<OrganType, string> = {
  Heart: 'Palpitations, chest heaviness, or sudden racing heartbeat?',
  Brain: 'Headache, dizziness, slurred speech, or vision blur?',
  Lungs: 'Shortness of breath, dry cough, or wheezing sounds?',
  Stomach: 'Abdominal cramping, persistent acidity, or nausea?',
  Kidneys: 'Lower flank pain, fluid retention, or burning sensation?',
  Liver: 'Jaundice tint, fatigue, or right upper quadrant discomfort?',
  Thyroid: 'Unexplained weight changes, throat tightness, or tremors?',
};

export default function Landing() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const { selectedOrgan, setSelectedOrgan } = useUiStore();
  const { useFallback2D } = usePerformanceTier();

  // Fetch live summary for real counters and stat pill
  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiFetch('/dashboard/summary'),
    refetchInterval: 10000,
  });

  // Track scroll progress 0 -> 1 for the 3D canvas
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = Math.min(1, Math.max(0, window.scrollY / scrollHeight));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-[500vh] text-slate-900 dark:text-slate-100">
      {/* 3D WebGL Canvas or 2D Accessible Fallback */}
      {useFallback2D ? (
        <Hero2DFallback />
      ) : (
        <SceneCanvas scrollProgress={scrollProgress} />
      )}

      {/* ======================================================== */}
      {/* CHAPTER 0 — HERO (ADA INSPIRED HIGH-TECH MEDICAL SUITE) */}
      {/* ======================================================== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-12 pb-24 text-center">
        {/* Glowing Ambient Background Aura */}
        <div className="absolute inset-0 glow-bg-radial pointer-events-none -z-10" />

        {/* Live System Stat Pill */}
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>
            Live System ·{' '}
            <strong className="text-slate-900 dark:text-white">
              {summary?.doctors?.available ?? 8}/{summary?.doctors?.total ?? 13}
            </strong>{' '}
            Doctors Online ·{' '}
            <strong className="text-slate-900 dark:text-white">
              {summary?.beds?.open ?? 28}
            </strong>{' '}
            Beds Open
          </span>
        </div>

        {/* New Feature Pill - ADA inspired */}
        <div className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/80 dark:border-cyan-800 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>New AI-Powered Health Companion</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white max-w-4xl leading-[1.1]">
          AI Health Powered by{' '}
          <span className="bg-gradient-to-r from-medical-blue via-cyan-500 to-[#0051EB] bg-clip-text text-transparent">
            MediSync
          </span>
          <br />
          Understand <span className="text-slate-900 dark:text-white">Symptoms</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Get personalized health insights with AI-powered symptom assessment, live hospital bed
          & doctor tracking, emergency ambulance dispatch, and smart medical records.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link to="/triage">
            <Button
              variant="primary"
              size="lg"
              className="font-bold text-base shadow-glow-blue px-7"
            >
              Start AI Triage <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>

          <Link to="/dashboard">
            <Button
              variant="glass"
              size="lg"
              className="font-semibold text-base px-6"
            >
              Hospital Pulse Live <Activity className="w-4 h-4 ml-1.5 text-medical-blue" />
            </Button>
          </Link>

          <Link to="/call-ambulance">
            <Button
              variant="emergency"
              size="lg"
              className="font-bold text-base shadow-glow-red"
            >
              <PhoneCall className="w-4 h-4 mr-1.5" /> Call 112 / 108
            </Button>
          </Link>
        </div>

        {/* ======================================================== */}
        {/* ADA FLOATING VITALS & CONSOLE MOCKUP (IMAGE REPLICATION) */}
        {/* ======================================================== */}
        <div className="mt-14 w-full max-w-5xl mx-auto relative px-2">
          {/* Floating Vitals Glass Pill (Left) */}
          <div className="hidden lg:flex absolute -left-4 top-1/4 z-20 items-center gap-4 p-4 rounded-3xl glass-panel shadow-glass animate-float-slow">
            <div className="flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <Heart className="w-5 h-5 fill-rose-500 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Heart Rate
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                  72 <span className="text-[10px] text-slate-400 font-normal">BPM</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                  Optimal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-medical-blue flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Sleep & Rest
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                  7h 45m
                </span>
                <span className="text-[10px] font-bold text-medical-blue block mt-0.5">
                  Normal
                </span>
              </div>
            </div>
          </div>

          {/* Center Mobile/Console Mockup */}
          <div className="max-w-md mx-auto rounded-[40px] p-4 bg-gradient-to-b from-slate-800 to-slate-950 shadow-2xl border-4 border-slate-700/80">
            <div className="rounded-[32px] bg-gradient-to-b from-sky-400/20 via-blue-950 to-navy-950 p-5 text-white overflow-hidden relative border border-white/10">
              {/* Top Phone Status Bar */}
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono pb-4 border-b border-white/10">
                <span className="font-bold">9:41</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-cyan-300 font-sans">
                    AI Doctor
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              </div>

              {/* Organ Selection Chips (Interactive from Image) */}
              <div className="pt-4 pb-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2 text-left">
                  Select Anatomical Focus Area:
                </span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {ORGAN_OPTIONS.map((organ) => {
                    const isSelected = selectedOrgan === organ;
                    return (
                      <button
                        key={organ}
                        onClick={() => setSelectedOrgan(organ)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                          isSelected
                            ? 'bg-rose-500 text-white shadow-glow-red scale-105'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        {organ}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Holographic Glowing AI Orb */}
              <div className="my-6 relative flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-500 blur-xl opacity-60 animate-pulse-slow" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-300 via-white to-blue-400 shadow-glow-cyan flex items-center justify-center relative z-10 animate-float-slow">
                  <HeartPulse className="w-10 h-10 text-medical-blue animate-pulse" />
                </div>
              </div>

              {/* Dynamic Assessment Prompt */}
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left space-y-1">
                <span className="text-[10px] uppercase font-bold text-cyan-300">
                  Focus: {selectedOrgan}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {ORGAN_PROMPTS[selectedOrgan]}
                </p>
                <Link
                  to="/triage"
                  className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1 pt-1"
                >
                  Start Triage For {selectedOrgan} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Floating Emergency Pill (Right) */}
          <div className="hidden lg:flex absolute -right-4 top-1/3 z-20 items-center gap-3 p-4 rounded-3xl glass-panel shadow-glass animate-float-slow [animation-delay:2s]">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 fill-rose-500" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Emergency Hotline
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 block">
                Call 112 / 108
              </span>
              <span className="text-[10px] text-slate-400">Immediate Ambulance</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* CHAPTER 1 — AI TRIAGE (15% - 38%) */}
      {/* ======================================================== */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-24">
        <div className="max-w-4xl mx-auto rounded-3xl glass-panel p-8 sm:p-12 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-xs font-bold text-medical-blue">
            <HeartPulse className="w-4 h-4" />
            Chapter 01 · Clinical AI Routing
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 dark:text-white">
            Describe it. We route it.
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Never wait in an emergency room to discover the specialist is off duty. Our AI assistant analyzes symptoms, checks for over 30 clinical red flags in English, Hindi, and Marathi, and immediately routes:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-900/60 space-y-2">
              <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider block">
                Severity: MILD
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Junior Intern Routing
              </h4>
              <p className="text-xs text-slate-500">
                Sore throats, mild fever, routine rash. Handled swiftly by on-duty medical interns, keeping specialists unburdened.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/60 space-y-2">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">
                Severity: SEVERE
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                On-Duty Specialist Routing
              </h4>
              <p className="text-xs text-slate-500">
                Chest tightness, stroke signs, respiratory distress. Routed directly to attending Cardiologists and Emergency doctors.
              </p>
            </div>
          </div>

          <Link to="/triage">
            <Button variant="primary" size="md" className="mt-4">
              Try Symptom Router Now <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ======================================================== */}
      {/* CHAPTER 2 — LIVE HOSPITAL NETWORK (38% - 62%) */}
      {/* ======================================================== */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-24">
        <div className="max-w-4xl mx-auto rounded-3xl glass-panel p-8 sm:p-12 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-xs font-bold text-cyan-700 dark:text-cyan-300">
            <Activity className="w-4 h-4" />
            Chapter 02 · Hospital Pulse
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 dark:text-white">
            Beds & doctors, live.
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Live hospital availability across connected facilities in Pune and Mumbai. Single-tap inventory updates from hospital staff sync live within 2 seconds without manual page refreshes.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-black text-medical-blue font-display">
                {summary?.doctors.available ?? 8}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Doctors On Duty</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-black text-emerald-500 font-display">
                {summary?.beds.open ?? 26}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Open Beds</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-black text-cyan-500 font-display">
                {summary?.resources.icuBeds.available ?? 3}
              </span>
              <span className="text-xs text-slate-500 block mt-1">ICU Beds Ready</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl font-black text-amber-500 font-display">
                {summary?.resources.ventilators.available ?? 11}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Ventilators Active</span>
            </div>
          </div>

          <Link to="/dashboard">
            <Button variant="primary" size="md" className="mt-4">
              Open Live Dashboard <Activity className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ======================================================== */}
      {/* CHAPTER 3 — AMBULANCE ROUTING (62% - 82%) */}
      {/* ======================================================== */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-24">
        <div className="max-w-4xl mx-auto rounded-3xl bg-navy-900 border border-slate-800 text-white p-8 sm:p-12 text-left space-y-6 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400 border border-cyan-500/30">
            <Truck className="w-4 h-4" />
            Chapter 03 · Driver Mode
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white">
            The best hospital — before arrival.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Ambulance crews enter required resources (ICU, ventilator, trauma bed) and GPS coordinates. The deterministic ranking engine evaluates urban travel time, capacity ratios, and specialist matches to route directly to the best receiving hospital.
          </p>

          <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              Deterministic Ranking Scoring Formula:
            </span>
            <code className="block font-mono text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-xl overflow-x-auto">
              Score = 0.40*(1 - min(dist, 40)/40) + 0.35*(capacity_ratio) + 0.15*(specialist_match) - 0.50*(ineligible_needs)
            </code>
          </div>

          <div className="flex gap-3">
            <Link to="/ambulance">
              <Button variant="cyan" size="md">
                Open Driver View <Navigation className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/call-ambulance">
              <Button variant="emergency" size="md">
                Call Ambulance
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* CHAPTER 4 — HEALTH VAULT & FINAL CTA (82% - 100%) */}
      {/* ======================================================== */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto rounded-3xl glass-panel p-8 sm:p-14 space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-medical-blue to-cyan-400 text-white flex items-center justify-center mx-auto shadow-glow-blue">
            <FolderHeart className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900 dark:text-white">
            Your history. One tap away.
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Encrypted Universal Health Vault storing your symptom history, previous AI triage assessments, and assigned physician notes. Download as JSON or print for intake counter registration.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link to="/vault">
              <Button variant="primary" size="lg" className="shadow-glow-blue font-bold">
                Access Health Vault <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>

            <Link to="/pitch">
              <Button variant="glass" size="lg" className="font-semibold">
                View Hackathon Pitch Deck
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
