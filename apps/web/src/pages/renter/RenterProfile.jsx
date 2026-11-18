import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LogOut, User, Mail, Phone, Home, Calendar, Building2, Shield } from 'lucide-react'
import RenterLayout from './RenterLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { tenancies } from '../../lib/api.js'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-border last:border-0">
      <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
        <Icon size={16} className="text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-semibold text-text truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function RenterProfile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: tenancyList } = useQuery({
    queryKey: ['renter-tenancy'],
    queryFn: async () => {
      const r = await tenancies.mine()
      return Array.isArray(r) ? r : (r?.tenancies ?? [])
    },
  })

  const activeTenancy = tenancyList?.find(t => t.active === true) ?? tenancyList?.[0]
  const unit = activeTenancy?.unit
  const property = unit?.property

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

  return (
    <RenterLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-10 max-w-5xl mx-auto">

        {/* Page heading */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Account</p>
          <h1 className="text-2xl font-bold text-text">My Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

          {/* ── LEFT: identity card ── */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4">
                {initials}
              </div>
              <h2 className="text-lg font-bold text-text">{user?.name ?? '—'}</h2>
              <p className="text-sm text-text-muted mt-0.5 mb-3">{user?.email ?? '—'}</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-bg text-success border border-success/20">
                <Shield size={11} /> Verified Renter
              </span>
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-danger-bg text-danger border border-danger/20 py-3 rounded-xl text-sm font-semibold hover:bg-danger/10 transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>

          {/* ── RIGHT: detail cards ── */}
          <div className="flex flex-col gap-4">

            {/* Account info */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Account details</p>
              <InfoRow icon={User}  label="Full name"     value={user?.name} />
              <InfoRow icon={Mail}  label="Email address" value={user?.email} />
              <InfoRow icon={Phone} label="Phone number"  value={user?.phone} />
            </div>

            {/* Tenancy info */}
            {activeTenancy ? (
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Active tenancy</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-bg text-success border border-success/20">
                    Active
                  </span>
                </div>
                {property && <InfoRow icon={Building2} label="Property" value={`${property.name}${property.address ? ' · ' + property.address : ''}`} />}
                {unit     && <InfoRow icon={Home}      label="Unit"     value={unit.name} />}
                <InfoRow icon={Calendar} label="Tenancy started" value={fmtDate(activeTenancy.startDate)} />
                {activeTenancy.endDate && (
                  <InfoRow icon={Calendar} label="Tenancy ends" value={fmtDate(activeTenancy.endDate)} />
                )}
              </div>
            ) : tenancyList !== undefined ? (
              <div className="bg-surface border border-border rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold text-text mb-1">No active tenancy</p>
                <p className="text-sm text-text-muted">Go to Home to accept your landlord's invitation.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </RenterLayout>
  )
}
