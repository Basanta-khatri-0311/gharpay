import { useState } from 'react'
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import { Home, CreditCard, FileText, User, Sun, Moon, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

const tabs = [
  { to: '/renter',          label: 'Home',     letter: 'H', exact: true },
  { to: '/renter/payments', label: 'Payments', letter: 'P' },
  { to: '/renter/receipts', label: 'Receipts', letter: 'R' },
  { to: '/renter/profile',  label: 'Profile',  letter: 'U' },
]

// ── Shared sidebar nav content ────────────────────────────────────────────────
function SidebarContent({ location }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 pb-5 border-b border-white/[0.06] mb-4">
        <span className="w-7 h-7 bg-primary text-white rounded-md flex items-center justify-center text-[13px] font-bold shrink-0">G</span>
        <span className="text-sm font-semibold text-white">GharPay</span>
      </div>

      <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-white/30 px-4 mb-2">My Account</p>

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {tabs.map(({ to, label, letter, exact }) => {
          const isActive = exact
            ? location.pathname === to
            : location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:bg-white/[0.06] hover:text-white/85'
              }`}
            >
              <span className={`w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                isActive ? 'bg-primary text-white' : 'bg-white/10 text-white/70'
              }`}>{letter}</span>
              <span className="flex-1">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom label */}
      <div className="px-4 pt-5 border-t border-white/[0.06] mt-auto">
        <p className="text-[11px] text-white/30">Viewing as renter</p>
      </div>
    </>
  )
}

// ── Main layout ────────────────────────────────────────────────────────────────
export default function RenterLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const handleLogout = async () => {
    setMobileOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">

      {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[220px] bg-bg-dark shrink-0 py-5 overflow-y-auto">
        <SidebarContent location={location} />
      </aside>

      {/* ── Mobile Sidebar Overlay ───────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-[220px] bg-bg-dark flex flex-col py-5 overflow-y-auto">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-md text-white/50 hover:text-white"
            >
              <X size={18} />
            </button>
            <SidebarContent location={location} />
          </div>
        </div>
      )}

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar — identical style to landlord dashboard */}
        <header className="h-14 border-b border-border flex items-center gap-3 px-4 md:px-6 bg-bg shrink-0">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-1.5 rounded-md text-text-secondary hover:bg-surface transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Page title slot (spacer on desktop) */}
          <div className="flex-1" />

          {/* Right side controls */}
          <div className="flex items-center gap-2 md:gap-3 ml-auto">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="w-[34px] h-[34px] flex items-center justify-center rounded-md text-text-secondary hover:bg-surface transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Avatar + name + role */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[13px] font-medium leading-tight">{user?.name ?? '—'}</span>
                <span className="text-[11px] text-text-muted capitalize">Renter</span>
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="text-[12px] text-text-muted hover:text-danger transition-colors hidden sm:block"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40">
        <div className="flex">
          {tabs.map(({ to, label, exact }) => {
            const icons = { '/renter': Home, '/renter/payments': CreditCard, '/renter/receipts': FileText, '/renter/profile': User }
            const Icon = icons[to]
            const isActive = exact
              ? location.pathname === to
              : location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-text-muted hover:text-text'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
