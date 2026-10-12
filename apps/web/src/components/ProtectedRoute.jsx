import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Wraps a route so only authenticated users can access it.
 * Shows nothing while auth is being resolved (silent refresh).
 * Redirects to /login with the attempted path saved in state.
 */
export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-9 h-9 bg-primary text-white rounded-md flex items-center justify-center text-sm font-bold">G</span>
          <p className="text-sm text-text-muted">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
