import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Home, CreditCard, FileText, User, LogOut, Key } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { Sun, Moon } from 'lucide-react'

const tabs = [
  { to: '/renter', icon: Home, label: 'Home', exact: true },
  { to: '/renter/payments', icon: CreditCard, label: 'Payments' },
  { to: '/renter/receipts', icon: FileText, label: 'Receipts' },
  { to: '/renter/profile', icon: User, label: 'Profile' },
]

export default function RenterLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, toggle } = useTheme()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg flex">

      {/* ── Desktop Sidebar (hidden on mobile) ─────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-bg-dark border-r border-border-dark min-h-screen sticky top-0 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border-dark">
          <span className="w-8 h-8 bg-primary text-white rounded-md flex items-center justify-center text-sm font-bold shrink-0">G</span>
          <span className="text-[15px] font-bold text-white">GharPay</span>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-border-dark">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/50">Renter</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {tabs.map(({ to, icon: Icon, label, exact }) => {
            const isActive = exact
              ? location.pathname === to
              : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border-dark flex flex-col gap-1">
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors w-full"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors w-full"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 bg-primary text-white rounded-md flex items-center justify-center text-xs font-bold">G</span>
            <span className="text-sm font-bold text-text">GharPay</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-1.5 rounded-lg text-text-muted hover:bg-surface-muted">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav (hidden on desktop) ───────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
        <div className="flex">
          {tabs.map(({ to, icon: Icon, label, exact }) => {
            const isActive = exact
              ? location.pathname === to
              : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-text-muted hover:text-text'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
