import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards a route by auth state and optionally by role.
 * Props:
 *   allowedRole?: 'LANDLORD' | 'RENTER'  — if set, also checks user.role
 *   redirectTo?: string                   — where to send unauthorized users
 */
export default function ProtectedRoute({ children, allowedRole, redirectTo }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <span className="w-9 h-9 bg-primary text-white rounded-md flex items-center justify-center text-sm font-bold">G</span>
          <p className="text-sm text-text-muted animate-pulse">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role check: if allowedRole is specified and doesn't match, redirect
  if (allowedRole && user.role !== allowedRole) {
    const fallback = redirectTo ?? (user.role === 'RENTER' ? '/renter' : '/dashboard');
    return <Navigate to={fallback} replace />;
  }

  return children;
}
