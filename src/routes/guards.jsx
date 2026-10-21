import { Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';
import { PageLoader } from '../components/layout/PageLoader.jsx';

// NOTE: These guards only control navigation. Real protection must be enforced by the API
// (the demo server rejects admin/account calls without the right session and role).

function useAuthReady() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  return { ready: status !== 'idle' && status !== 'loading', user };
}

export function RequireAuth({ children }) {
  const { ready, user } = useAuthReady();
  const location = useLocation();
  if (!ready) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

export function RequireAdmin({ children }) {
  const { ready, user } = useAuthReady();
  const location = useLocation();
  if (!ready) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname, adminHint: true }} />;
  if (user.role !== 'admin') return <Navigate to="/account" replace state={{ notice: 'That area is for store administrators.' }} />;
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export function GuestOnly({ children }) {
  const { ready, user } = useAuthReady();
  const location = useLocation();
  if (!ready) return <PageLoader />;
  if (user) return <Navigate to={location.state?.from || (user.role === 'admin' ? '/admin' : '/account')} replace />;
  return children;
}
