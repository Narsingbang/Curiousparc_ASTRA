import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ProtectedRoute, RoleGate } from './components/layout/ProtectedRoute';

// Lazy load heavy 3D landing page to keep initial bundles featherlight
const Landing = React.lazy(() => import('./pages/Landing'));
import Triage from './pages/Triage';
import Dashboard from './pages/Dashboard';
import Ambulance from './pages/Ambulance';
import CallAmbulance from './pages/CallAmbulance';
import Vault from './pages/Vault';
import Staff from './pages/Staff';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import Pitch from './pages/Pitch';
import NotFound from './pages/NotFound';

const PageLoader = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 rounded-full border-2 border-medical-blue border-t-transparent animate-spin" />
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
      Synchronizing System Core...
    </span>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: (
      <AppShell>
        <ErrorBoundary>
          <NotFound />
        </ErrorBoundary>
      </AppShell>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Landing />
          </Suspense>
        ),
      },
      {
        path: 'triage',
        element: <Triage />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'ambulance',
        element: <Ambulance />,
      },
      {
        path: 'call-ambulance',
        element: <CallAmbulance />,
      },
      {
        path: 'vault',
        element: (
          <ProtectedRoute>
            <Vault />
          </ProtectedRoute>
        ),
      },
      {
        path: 'staff',
        element: (
          <ProtectedRoute>
            <RoleGate allowedRoles={['staff']}>
              <Staff />
            </RoleGate>
          </ProtectedRoute>
        ),
      },
      {
        path: 'auth',
        element: <Auth />,
      },
      {
        path: 'auth/reset',
        element: <ResetPassword />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
      {
        path: 'pitch',
        element: <Pitch />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
