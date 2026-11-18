import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'

/* ─── Shared branded left panel ──────────────────────────────────────────── */
function BrandPanel() {
  const stats = [
    { label: 'Properties managed', value: '2,400+' },
    { label: 'Payments tracked',   value: 'NPR 48M+' },
    { label: 'Receipts issued',    value: '18,000+' },
  ]
  const testimonial = {
    quote: 'GharPay turned our chaotic WhatsApp payment screenshots into clean, verifiable records. My tenants love it.',
    author: 'Ramesh Shrestha',
    role: 'Landlord · Butwal',
  }

  return (
    <div className="hidden lg:flex flex-col justify-between bg-bg-dark px-8 xl:px-12 py-8 xl:py-10 relative overflow-hidden min-h-screen">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-20 -left-10 w-72 h-72 rounded-full bg-white" />
        <div className="absolute bottom-20 right-0 w-96 h-96 rounded-full bg-primary" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-accent" />
      </div>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 relative z-10">
        <span className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center text-[15px] font-bold">G</span>
        <span className="text-[17px] font-bold text-white">GharPay</span>
      </Link>

      {/* Center content */}
      <div className="flex flex-col gap-10 relative z-10">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary mb-3" style={{ color: '#6FCF97' }}>
            Rental management for Nepal
          </p>
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
            Rent, bills, and<br />payments. All in<br />one place.
          </h2>
          <p className="text-[15px] text-white/55 mt-4 leading-relaxed max-w-[320px]">
            Manage properties, verify payments, and issue receipts — without the spreadsheets.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-4">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-white/40 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-5">
          <div className="flex gap-1 mb-3">
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ))}
          </div>
          <p className="text-[13px] text-white/70 leading-relaxed italic">"{testimonial.quote}"</p>
          <div className="flex items-center gap-2.5 mt-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-white">RS</div>
            <div>
              <p className="text-[13px] font-semibold text-white">{testimonial.author}</p>
              <p className="text-[11px] text-white/40">{testimonial.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[12px] text-white/25 relative z-10">
        © {new Date().getFullYear()} GharPay · Built for Nepal
      </p>
    </div>
  )
}

/* ─── Input component ─────────────────────────────────────────────────────── */
function Input({ label, id, type = 'text', showToggle, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-text-secondary" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={showToggle ? (show ? 'text' : 'password') : type}
          className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-lg text-sm text-text bg-bg outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 placeholder:text-text-muted pr-10"
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Login Page ──────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite') ?? ''
  const from = location.state?.from?.pathname ?? '/dashboard'
  const justRegistered = location.state?.registered === true

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await login(form)
      const role = data?.user?.role ?? data?.role
      if (inviteToken) {
        navigate(`/accept-invite?token=${encodeURIComponent(inviteToken)}`)
      } else if (from && from !== '/dashboard' && from !== '/renter') {
        navigate(from, { replace: true })
      } else {
        navigate(role === 'RENTER' ? '/renter' : '/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex overflow-y-auto">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:max-w-[480px] xl:max-w-[520px]">
        <BrandPanel />
      </div>

      {/* Right form panel */}
      <div className="w-full lg:flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-10 bg-bg min-h-screen">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <span className="w-8 h-8 bg-primary text-white rounded-md flex items-center justify-center text-sm font-bold">G</span>
          <span className="text-[16px] font-bold text-text">GharPay</span>
        </Link>

        <div className="w-full max-w-sm sm:max-w-[400px] flex flex-col gap-7">
          {/* Heading */}
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-text">Welcome back</h1>
            <p className="text-[14px] text-text-muted mt-1">Sign in to your GharPay account</p>
          </div>

          {/* Success banner */}
          {justRegistered && (
            <div className="flex items-center gap-2.5 bg-success-bg border border-success/20 text-success text-[13px] px-4 py-3 rounded-lg">
              <CheckCircle2 size={15} className="shrink-0" />
              Account created! Sign in to get started.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-danger-bg border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              id="password"
              name="password"
              showToggle
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-lg text-[14px] font-semibold hover:bg-accent transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</span>
              ) : (
                <span className="flex items-center gap-2">Sign in <ArrowRight size={15} /></span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[12px] text-text-muted">New to GharPay?</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Register CTA */}
          <Link
            to="/register"
            className="w-full flex items-center justify-center gap-2 border border-border text-text px-5 py-3 rounded-lg text-[14px] font-medium hover:bg-surface hover:border-text-muted transition-all"
          >
            Create a free account
          </Link>

          <p className="text-[12px] text-text-muted text-center">
            By signing in you agree to our{' '}
            <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
