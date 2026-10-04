import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShieldAlert, Home, Activity, MessageSquareHeart, PhoneCall } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-8">
      {/* 404 Visual badge */}
      <div className="relative inline-flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-emergency-red/20 blur-2xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-3xl bg-emergency-red/10 border border-emergency-red/30 flex items-center justify-center text-emergency-red">
          <ShieldAlert className="w-12 h-12" />
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-black tracking-widest text-emergency-red uppercase">
          Error 404 · Signal Lost
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tracking-tight">
          Emergency Route Not Found
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          The requested coordinate or clinical department does not exist in the MediSync AI emergency registry.
        </p>
      </div>

      {/* Emergency Hotline notice */}
      <div className="p-4 rounded-2xl bg-emergency-red/10 border border-emergency-red/20 text-xs text-emergency-red flex items-center justify-center gap-3 max-w-md mx-auto">
        <PhoneCall className="w-4 h-4 shrink-0 animate-bounce" />
        <span>
          Experiencing a life-threatening medical emergency? Call{' '}
          <a href="tel:112" className="font-black underline">
            112
          </a>{' '}
          or{' '}
          <a href="tel:108" className="font-black underline">
            108
          </a>{' '}
          immediately.
        </span>
      </div>

      {/* Safe quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
        <Link to="/">
          <Button variant="outline" size="md" className="w-full flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Home
          </Button>
        </Link>
        <Link to="/triage">
          <Button variant="primary" size="md" className="w-full flex items-center justify-center gap-2">
            <MessageSquareHeart className="w-4 h-4" />
            AI Triage
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="outline" size="md" className="w-full flex items-center justify-center gap-2">
            <Activity className="w-4 h-4" />
            Live Pulse
          </Button>
        </Link>
      </div>
    </div>
  );
}
