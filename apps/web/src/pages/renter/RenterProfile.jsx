import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LogOut, User, Home, Calendar, Building2 } from 'lucide-react'
import RenterLayout from './RenterLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { tenancies } from '../../lib/api.js'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RenterProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: tenancyList } = useQuery({
    queryKey: ['renter-tenancy'],
    queryFn: async () => {
      const r = await tenancies.list()
      return Array.isArray(r) ? r : (r?.tenancies ?? [])
    },
  })

  const activeTenancy = tenancyList?.find(t => t.status === 'ACTIVE') ?? tenancyList?.[0]
  const unit = activeTenancy?.unit
  const property = unit?.property

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

  return (
    <RenterLayout>
      <div className="max-w-sm mx-auto w-full px-4 pt-8">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-3">
            {initials}
          </div>
          <h1 className="text-xl font-bold text-text">{user?.name ?? '—'}</h1>
          <p className="text-sm text-text-muted mt-0.5">{user?.email ?? '—'}</p>
          <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-bg text-success border border-success/20">
            Renter
          </span>
        </div>

        {/* Tenancy info */}
        {activeTenancy && (
          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Your tenancy</h2>
            <div className="flex flex-col gap-4">
              {property && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Property</p>
                    <p className="text-sm font-semibold text-text">{property.name}</p>
                    {property.address && <p className="text-xs text-text-muted">{property.address}</p>}
                  </div>
                </div>
              )}
              {unit && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0">
                    <Home size={16} className="text-text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Unit</p>
                    <p className="text-sm font-semibold text-text">{unit.name}</p>
                    <p className="text-xs text-text-muted">{unit.type}</p>
                  </div>
                </div>
              )}
              {activeTenancy.startDate && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Tenancy started</p>
                    <p className="text-sm font-semibold text-text">{fmtDate(activeTenancy.startDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account info */}
        <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">Account</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-text-muted" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Full name</p>
                <p className="text-sm font-semibold text-text">{user?.name ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-danger-bg text-danger border border-danger/20 py-3.5 rounded-xl text-sm font-semibold hover:bg-danger/10 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </RenterLayout>
  )
}
