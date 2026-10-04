import { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Footer } from './Footer';
import { ToastContainer } from '../ui/Toast';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import {
  WifiOff,
  Home,
  HeartPulse,
  Activity,
  FolderHeart,
  Truck,
} from 'lucide-react';

export function AppShell({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const { isOnline, setIsOnline } = useUiStore();
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initAuth, setIsOnline]);

  const isLandingPage = location.pathname === '/';

  const bottomTabs = [
    { label: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { label: 'Triage', path: '/triage', icon: <HeartPulse className="w-5 h-5" /> },
    { label: 'Pulse', path: '/dashboard', icon: <Activity className="w-5 h-5" /> },
    { label: 'Driver', path: '/ambulance', icon: <Truck className="w-5 h-5" /> },
    { label: 'Vault', path: '/vault', icon: <FolderHeart className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Offline Banner */}
      {!isOnline && (
        <div
          id="offline-banner"
          className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md"
        >
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. MediSync AI is running in local cached mode.</span>
        </div>
      )}

      {/* Top Navigation */}
      <TopNav />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 md:pb-0">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Tab Bar */}
      <nav
        id="bottom-tabs"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-navy-950/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-around h-16 px-2 safe-area-inset-bottom"
      >
        {bottomTabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-medical-blue font-bold dark:text-cyan-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
