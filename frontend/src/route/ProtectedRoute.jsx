/**
 * src/route/ProtectedRoute.jsx — UPGRADED
 * Exports ProtectedRoute, AdminRoute, VendorRoute, PublicRoute.
 * All guard components show a spinner while auth is loading.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/** Any logged-in user */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)  return <Spinner />;
  if (!user)    return <Navigate to="/login" replace />;
  return children;
}

/** Admin only */
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)               return <Spinner />;
  if (!user)                 return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/"      replace />;
  return children;
}

/** Vendor or admin */
export function VendorRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)  return <Spinner />;
  if (!user)    return <Navigate to="/login" replace />;
  if (user.role !== 'vendor' && user.role !== 'admin')
    return <Navigate to="/" replace />;
  return children;
}

/** Redirect already-logged-in users away from auth pages */
export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user)    return <Navigate to="/" replace />;
  return children;
}

// Default export for backward compat
export default ProtectedRoute;
