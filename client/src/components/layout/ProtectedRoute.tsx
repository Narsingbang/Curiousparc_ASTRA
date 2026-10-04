import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '@medisync/shared';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

export function RoleGate({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: JSX.Element;
}) {
  const { role, isLoading, quickDemoLogin } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue" />
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-center shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 mx-auto flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-2">
          Role Access Required
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          This portal requires a <strong>{allowedRoles.join(' or ')}</strong> role. Your current role is <strong>{role}</strong>.
        </p>
        <div className="space-y-3">
          {allowedRoles.includes('ambulance') && (
            <Button
              variant="primary"
              className="w-full"
              onClick={() => quickDemoLogin('ambulance')}
            >
              Switch to Ambulance Paramedic Demo
            </Button>
          )}
          {allowedRoles.includes('staff') && (
            <Button
              variant="primary"
              className="w-full"
              onClick={() => quickDemoLogin('staff')}
            >
              Switch to Hospital Staff Demo
            </Button>
          )}
        </div>
      </div>
    );
  }

  return children;
}
