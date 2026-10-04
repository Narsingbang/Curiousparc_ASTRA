import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EmergencyRequestInputSchema,
  EmergencyRequestInput,
  STANDARD_ADVISORIES,
} from '@medisync/shared';
import { apiFetch } from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import { broadcastLiveEvent } from '../../hooks/useRealtime';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  PhoneCall,
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function DispatchForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const { addToast } = useUiStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmergencyRequestInput>({
    resolver: zodResolver(EmergencyRequestInputSchema),
    defaultValues: {
      patient_name: '',
      phone: '',
      location_text: '',
      notes: '',
      website: '', // honeypot
    },
  });

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      addToast({
        type: 'warning',
        title: 'Geolocation Not Supported',
        message: 'Please enter your pickup location manually.',
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('lat', pos.coords.latitude);
        setValue('lng', pos.coords.longitude);
        setValue(
          'location_text',
          `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Current Location)`
        );
        setIsLocating(false);
        addToast({
          type: 'success',
          title: 'Location Captured',
          message: 'GPS coordinates attached to dispatch request.',
        });
      },
      () => {
        setIsLocating(false);
        addToast({
          type: 'warning',
          title: 'GPS Permission Denied',
          message: 'Please type your street address or landmark manually.',
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const onSubmit = async (values: EmergencyRequestInput) => {
    setIsSubmitting(true);
    try {
      const res = await apiFetch<any>('/emergency-requests', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      setDispatchResult(res);
      broadcastLiveEvent('emergency_requests');
      addToast({
        type: 'success',
        title: 'Dispatch Request Transmitted',
        message: `Assigned Request ID: ${res.id}`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Dispatch Failed',
        message: err.message || 'Could not dispatch ambulance.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (dispatchResult) {
    const hospital = dispatchResult.recommended_hospital;
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-navy-900 border border-emerald-500/40 shadow-2xl space-y-6 animate-in zoom-in-95 duration-400">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Ambulance Dispatch Confirmed
          </h2>
          <p className="text-xs text-slate-400">
            Request ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{dispatchResult.id}</span>
          </p>
        </div>

        {/* Recommended Hospital Details */}
        {hospital && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-white dark:from-navy-950 dark:to-navy-900 border border-blue-200 dark:border-blue-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-medical-blue uppercase tracking-wider">
                Assigned Receiving Hospital
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                ~{hospital.eta_min} min ETA
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {hospital.name}
              </h3>
              <p className="text-xs text-slate-500">{hospital.address}, {hospital.city}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {hospital.reasons?.map((r: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-navy-800 text-blue-700 dark:text-cyan-300 border border-blue-200/60 dark:border-slate-700"
                >
                  ✓ {r}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 leading-relaxed text-center">
          <strong>Reminder:</strong> Keep your phone line active. The ambulance paramedic unit has been dispatched and will contact <span className="font-bold underline">{dispatchResult.phone}</span>.
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setDispatchResult(null)}
        >
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-navy-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      {/* Demo Warning Banner */}
      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>
          <strong>EMERGENCY NOTICE:</strong> {STANDARD_ADVISORIES.AMBULANCE_FORM} Call{' '}
          <a href="tel:112" className="underline font-bold">112</a> or{' '}
          <a href="tel:108" className="underline font-bold">108</a> right now.
        </p>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
          Request Emergency Ambulance
        </h2>
        <p className="text-xs text-slate-500">
          AI Dispatch Engine auto-analyzes symptom notes to book open ICU/ER beds and assign the nearest qualified hospital.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Honeypot field (hidden from real users) */}
        <input
          type="text"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />

        <Input
          label="Patient Full Name"
          placeholder="e.g. Rushikesh Soni"
          error={errors.patient_name?.message}
          {...register('patient_name')}
        />

        <Input
          label="Contact Phone Number (+91 Indian Format)"
          placeholder="e.g. +91 98765 43210"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <div className="space-y-1.5 text-left">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Pickup Location / Landmark
            </label>
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={isLocating}
              className="text-xs font-bold text-medical-blue hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Acquiring GPS...' : 'Use My GPS Location'}
            </button>
          </div>
          <textarea
            rows={2}
            placeholder="e.g. Flat 302, Green Avenue, Behind VIT Pune Campus, Bibwewadi"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-navy-900/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/40"
            {...register('location_text')}
          />
          {errors.location_text && (
            <p className="text-xs text-rose-600 font-medium">
              {errors.location_text.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Emergency Condition / Symptoms Description
          </label>
          <textarea
            rows={3}
            placeholder="Describe the medical situation (e.g., unconsciousness, severe chest pain, road trauma, allergic reaction)..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-navy-900/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/40"
            {...register('notes')}
          />
          {errors.notes && (
            <p className="text-xs text-rose-600 font-medium">{errors.notes.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="emergency"
          size="lg"
          className="w-full font-bold shadow-glow-red"
          isLoading={isSubmitting}
        >
          <PhoneCall className="w-5 h-5 mr-2" />
          Dispatch Ambulance Now
        </Button>
      </form>
    </div>
  );
}
