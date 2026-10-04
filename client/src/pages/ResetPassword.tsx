import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase, isClientMock } from '../lib/supabase';
import { useUiStore } from '../store/uiStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const { addToast } = useUiStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if recovery token or hash is present in URL
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsUpdateMode(true);
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isClientMock) {
        setIsSent(true);
        addToast({
          type: 'info',
          title: 'Demo Mode Simulation',
          message: `Password reset link simulated for ${email}. You may now update your password directly.`,
        });
        setIsUpdateMode(true);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) throw error;

      setIsSent(true);
      addToast({
        type: 'success',
        title: 'Reset Link Dispatched',
        message: 'Check your email for the password recovery link.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message || 'Unable to send recovery link.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast({
        type: 'warning',
        title: 'Weak Password',
        message: 'Password must be at least 8 characters with letters and numbers.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Passwords Do Not Match',
        message: 'Please ensure both password fields match exactly.',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isClientMock) {
        setIsComplete(true);
        addToast({
          type: 'success',
          title: 'Password Updated',
          message: 'Your password has been successfully updated.',
        });
        setTimeout(() => navigate('/auth'), 2000);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setIsComplete(true);
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been successfully updated. Redirecting to sign in...',
      });

      setTimeout(() => navigate('/auth'), 2500);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
      {/* Brand Icon */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-medical-blue/10 text-medical-blue border border-medical-blue/20 shadow-glow-blue/10">
        <Lock className="w-8 h-8" />
      </div>

      <div>
        <h1 className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight">
          {isUpdateMode ? 'Create New Password' : 'Reset Account Password'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isUpdateMode
            ? 'Enter your new credentials below to restore secure vault access.'
            : 'Enter your registered email address to receive a secure recovery link.'}
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-white/70 dark:bg-navy-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 text-left">
        {isComplete ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Password Restored
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You will be redirected to the sign-in screen shortly.
            </p>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              Sign In Now
            </Button>
          </div>
        ) : isUpdateMode ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Minimum 8 characters with at least one letter and number"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-glow-blue"
              isLoading={isLoading}
            >
              Save New Password
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <Input
              label="Registered Email Address"
              type="email"
              placeholder="name@medisync.demo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-glow-blue"
              isLoading={isLoading}
            >
              Send Recovery Link
            </Button>

            {isSent && (
              <div className="p-3 rounded-2xl bg-medical-blue/10 border border-medical-blue/20 text-xs text-medical-blue flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Recovery email dispatched. If you are testing locally in demo mode,{' '}
                  <button
                    type="button"
                    onClick={() => setIsUpdateMode(true)}
                    className="font-bold underline"
                  >
                    click here to enter new password
                  </button>
                  .
                </span>
              </div>
            )}
          </form>
        )}

        <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-medical-blue transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
