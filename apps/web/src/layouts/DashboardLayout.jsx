import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { key: 'overview',    label: 'Overview',    letter: 'O' },
  { key: 'properties',  label: 'Properties',  letter: 'P' },
  { key: 'tenants',     label: 'Tenants',     letter: 'T' },
  { key: 'bills',       label: 'Bills',       letter: 'B' },
  { key: 'payments',    label: 'Payments',    letter: 'P', badge: 2 },
  { key: 'receipts',    label: 'Receipts',    letter: 'R' },
  { key: 'settings',    label: 'Settings',    letter: 'S' },
]

export default function DashboardLayout({ children, activeKey = 'overview' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar */}
      <aside className="w-[168px] shrink-0 bg-bg-dark flex flex-col py-5 overflow-y-auto">
        <div className="flex items-center gap-2 px-4 pb-5 border-b border-white/[0.06] mb-4">
          <span className="w-7 h-7 bg-primary text-white rounded-md flex items-center justify-center text-[13px] font-bold shrink-0">G</span>
          <span className="text-sm font-semibold text-white">GharPay</span>
        </div>

        <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-white/30 px-4 mb-2">Workspace</p>

        <nav className="flex flex-col gap-0.5 px-3 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={`/dashboard${item.key === 'overview' ? '' : `/${item.key}`}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all ${
                activeKey === item.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:bg-white/[0.06] hover:text-white/85'
              }`}
            >
              <span className={`w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                activeKey === item.key ? 'bg-primary text-white' : 'bg-white/10 text-white/70'
              }`}>{item.letter}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-primary text-white text-[10px] font-semibold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-[5px]">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="px-4 pt-5 border-t border-white/[0.06] mt-auto">
          <p className="text-[11px] text-white/30 mb-2">Viewing as landlord</p>
          <button className="text-xs text-white/55 flex items-center gap-2 hover:text-white transition-colors">
            Switch to renter view <span>›</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border flex items-center gap-4 px-6 bg-bg shrink-0">
          <div className="flex-1 max-w-[400px] flex items-center gap-3 bg-surface border border-border rounded-md px-3 h-9 text-text-muted">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search properties, tenants, bills…" className="flex-1 border-none outline-none bg-transparent text-[13px] text-text placeholder:text-text-muted" />
            <kbd className="text-[11px] text-text-muted bg-surface-muted border border-border rounded px-1.5 py-0.5 whitespace-nowrap">⌘ K</kbd>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="w-[34px] h-[34px] flex items-center justify-center rounded-md text-text-secondary hover:bg-surface transition-colors">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-[13px] font-semibold shrink-0">{initials}</div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium">{user?.name ?? '—'}</span>
                <span className="text-[11px] text-text-muted capitalize">{user?.role?.toLowerCase() ?? ''}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-[12px] text-text-muted hover:text-danger transition-colors ml-1"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
