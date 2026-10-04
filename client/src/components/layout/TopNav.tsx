import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import {
  Activity,
  HeartPulse,
  Truck,
  FolderHeart,
  Presentation,
  Sun,
  Moon,
  LogOut,
  PhoneCall,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react';
import { useState } from 'react';

export function TopNav() {
  const location = useLocation();
  const { token, role, profile, signOut } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'AI Doctor', path: '/triage', icon: <HeartPulse className="w-4 h-4" /> },
    { label: 'Hospital Pulse', path: '/dashboard', icon: <Activity className="w-4 h-4" /> },
    { label: 'Ambulance', path: '/ambulance', icon: <Truck className="w-4 h-4" /> },
    { label: 'Health Vault', path: '/vault', icon: <FolderHeart className="w-4 h-4" /> },
    ...(role === 'staff'
      ? [{ label: 'Staff Console', path: '/staff', icon: <Stethoscope className="w-4 h-4" /> }]
      : []),
    { label: 'Pitch Deck', path: '/pitch', icon: <Presentation className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-navy-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand logo - inspired by ADA minimalist high-tech style */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-medical-blue to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-glow-cyan">
            ✦
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            MEDISYNC <span className="text-medical-blue font-semibold">AI</span>
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-medical-blue/10 text-medical-blue dark:bg-medical-blue/20 dark:text-cyan-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-900'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Emergency 112 quick link */}
          <a
            href="tel:112"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            112 / 108
          </a>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
            title="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Auth State Button */}
          {token ? (
            <div className="flex items-center gap-2">
              <Link
                to={role === 'staff' ? '/staff' : '/vault'}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {profile?.full_name ? profile.full_name.split(' ')[0] : 'My Account'} ({role})
              </Link>
              <button
                onClick={() => signOut()}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="primary" size="sm" className="shadow-glow-blue">
                Download App →
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-950 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-900"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <a
              href="tel:112"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200"
            >
              <PhoneCall className="w-4 h-4" /> Emergency 112
            </a>
            {token ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
              >
                Sign out
              </Button>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
