import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { supabase, isClientMock } from '../lib/supabase';
import { UserRole } from '@medisync/shared';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  User,
  Truck,
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function Auth() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setSession, quickDemoLogin } = useAuthStore();
  const { addToast } = useUiStore();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from?.pathname || (role === 'staff' ? '/staff' : role === 'ambulance' ? '/ambulance' : '/vault');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isClientMock) {
        // Mock sign in
        await quickDemoLogin(role);
        addToast({
          type: 'success',
          title: 'Sign In Successful',
          message: `Logged in as ${email || role}`,
        });
        navigate(redirectPath, { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid credentials');
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile) {
        setSession(data.session.access_token, profile, data.user.email);
      }

      addToast({
        type: 'success',
        title: 'Welcome Back',
        message: `Signed in as ${data.user.email}`,
      });

      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sign In Failed',
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'staff' && !staffCode.trim()) {
      addToast({
        type: 'error',
        title: 'Staff Code Required',
        message: 'Please provide the hospital staff authorization code.',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isClientMock) {
        await quickDemoLogin(role);
        addToast({
          type: 'success',
          title: 'Account Created',
          message: `Demo profile created with role ${role}`,
        });
        navigate(redirectPath, { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Registration failed');
      }

      if (role === 'staff') {
        // Claim staff
        await fetch('/api/auth/claim-staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session?.access_token}`,
          },
          body: JSON.stringify({
            code: staffCode.trim(),
            hospital_id: 'a0000000-0000-0000-0000-000000000001',
          }),
        });
      }

      addToast({
        type: 'success',
        title: 'Registration Successful',
        message: 'Your account is ready.',
      });

      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
      {/* Brand logo & title */}
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-medical-blue to-cyan-400 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-glow-blue mb-3">
          ✦
        </div>
        <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
          {tab === 'signin' ? 'Sign In to MediSync' : 'Create Account'}
        </h2>
        <p className="text-xs text-slate-500">
          Live hospital synchronization & universal medical vault
        </p>
      </div>

      {/* Quick Demo Logins for Judges */}
      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-navy-950 border border-blue-100 dark:border-blue-900/60 space-y-2.5">
        <span className="text-[10px] font-bold text-medical-blue uppercase tracking-wider flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 fill-medical-blue" />
          Judge 1-Click Demo Login
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              quickDemoLogin('patient');
              navigate('/vault');
            }}
            className="p-2 rounded-xl bg-white dark:bg-navy-900 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-medical-blue transition-colors text-center"
          >
            Patient
          </button>
          <button
            onClick={() => {
              quickDemoLogin('ambulance');
              navigate('/ambulance');
            }}
            className="p-2 rounded-xl bg-white dark:bg-navy-900 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 transition-colors text-center"
          >
            Driver
          </button>
          <button
            onClick={() => {
              quickDemoLogin('staff');
              navigate('/staff');
            }}
            className="p-2 rounded-xl bg-white dark:bg-navy-900 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors text-center"
          >
            Staff
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-slate-100 dark:bg-navy-950 p-1 border border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setTab('signin')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            tab === 'signin'
              ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setTab('signup')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            tab === 'signup'
              ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Role Selector Card */}
      <div className="space-y-1.5 text-left">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Select Your System Role
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'patient', label: 'Patient', icon: <User className="w-4 h-4" /> },
            { id: 'ambulance', label: 'Paramedic', icon: <Truck className="w-4 h-4" /> },
            { id: 'staff', label: 'Staff', icon: <Building2 className="w-4 h-4" /> },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id as UserRole)}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                role === item.id
                  ? 'bg-medical-blue text-white border-medical-blue shadow-glow-blue/20'
                  : 'bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={tab === 'signin' ? handleSignIn : handleSignUp}
        className="space-y-4"
      >
        {tab === 'signup' && (
          <Input
            label="Full Name"
            placeholder="e.g. Rushikesh Soni"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="name@medisync.demo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password (min 8 characters, letter + number)"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {tab === 'signup' && role === 'staff' && (
          <Input
            label="Hospital Staff Access Code"
            placeholder="MEDISYNC-STAFF-2026-ASTRA"
            value={staffCode}
            onChange={(e) => setStaffCode(e.target.value)}
            helperText="Provided by hospital administration"
            required
          />
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full font-bold shadow-glow-blue"
          isLoading={isLoading}
        >
          {tab === 'signin' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      <div className="pt-2 text-center text-[11px] text-slate-400">
        By continuing, you agree to use this demo for non-clinical purposes only.
      </div>
    </div>
  );
}
