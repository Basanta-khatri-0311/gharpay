import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { auth } from '../lib/api'
import { Eye, EyeOff, ArrowRight, Building2, User } from 'lucide-react'

/* ─── Shared branded left panel (same as LoginPage) ──────────────────────── */
function BrandPanel() {
  const features = [
    { title: 'Manage any property', desc: 'Rooms, flats, shops — all in one dashboard.' },
    { title: 'Automated monthly bills', desc: 'Bundle rent and utilities into one statement.' },
    { title: 'Digital receipts', desc: 'Verified receipts issued automatically after payment.' },
  ]

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

      {/* Center */}
      <div className="flex flex-col gap-10 relative z-10">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-3" style={{ color: '#6FCF97' }}>
            Free to get started
          </p>
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
            Everything you need<br />to manage rent.
          </h2>
          <p className="text-[15px] text-white/55 mt-4 leading-relaxed max-w-[320px]">
            Join thousands of landlords and renters who've replaced WhatsApp receipts with GharPay.
          </p>
        </div>

        {/* Feature list */}
        <div className="flex flex-col gap-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4 bg-white/[0.05] border border-white/[0.07] rounded-xl p-4">
              <span className="text-2xl shrink-0 leading-none mt-0.5">{f.icon}</span>
              <div>
                <p className="text-[14px] font-semibold text-white">{f.title}</p>
                <p className="text-[12px] text-white/45 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {['BK','RS','PM','SJ'].map((init, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-dark flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: ['#1B3A2D','#2D6A4F','#40916C','#52B788'][i] }}>
                {init}
              </div>
            ))}
          </div>
          <p className="text-[12px] text-white/40 leading-tight">
            2,400+ landlords<br />already managing with GharPay
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[12px] text-white/25 relative z-10">
        © {new Date().getFullYear()} GharPay · Built for Nepal
      </p>
    </div>
  )
}

/* ─── Password input with show/hide ──────────────────────────────────────── */
function PasswordInput({ id, name, placeholder, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        minLength={8}
        autoComplete={autoComplete}
        className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-lg text-sm text-text bg-bg outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 placeholder:text-text-muted pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

/* ─── Register Page ───────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite') ?? ''

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'LANDLORD' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await auth.register(form)
      if (inviteToken) {
        navigate(`/accept-invite?token=${encodeURIComponent(inviteToken)}`)
      } else {
        navigate('/login', { state: { registered: true } })
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

        <div className="w-full max-w-sm sm:max-w-[400px] flex flex-col gap-6">
          {/* Heading */}
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-text">Create your account</h1>
            <p className="text-[14px] text-text-muted mt-1">Free to set up · No card required</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, role: 'LANDLORD' }))}
              className={`flex flex-col items-start gap-2 p-4 rounded-xl border-[1.5px] transition-all text-left ${
                form.role === 'LANDLORD'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-text-muted bg-surface'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                form.role === 'LANDLORD' ? 'bg-primary text-white' : 'bg-surface-muted text-text-muted'
              }`}>
                <Building2 size={15} />
              </div>
              <div>
                <p className={`text-[13px] font-semibold ${form.role === 'LANDLORD' ? 'text-primary' : 'text-text'}`}>
                  I'm a landlord
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">I own or manage properties</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, role: 'RENTER' }))}
              className={`flex flex-col items-start gap-2 p-4 rounded-xl border-[1.5px] transition-all text-left ${
                form.role === 'RENTER'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-text-muted bg-surface'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                form.role === 'RENTER' ? 'bg-primary text-white' : 'bg-surface-muted text-text-muted'
              }`}>
                <User size={15} />
              </div>
              <div>
                <p className={`text-[13px] font-semibold ${form.role === 'RENTER' ? 'text-primary' : 'text-text'}`}>
                  I'm a renter
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">I pay rent for a property</p>
              </div>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-danger-bg border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary" htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Basant Khatri"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
                className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-lg text-sm text-text bg-bg outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 placeholder:text-text-muted"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary" htmlFor="reg-email">Email address</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-lg text-sm text-text bg-bg outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 placeholder:text-text-muted"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-text-secondary" htmlFor="reg-password">Password</label>
              <PasswordInput
                id="reg-password"
                name="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-lg text-[14px] font-semibold hover:bg-accent transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create account <ArrowRight size={15} />
                </span>
              )}
            </button>
          </form>

          {/* Sign in link */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[12px] text-text-muted">Already have an account?</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 border border-border text-text px-5 py-3 rounded-lg text-[14px] font-medium hover:bg-surface hover:border-text-muted transition-all"
          >
            Sign in instead
          </Link>

          <p className="text-[12px] text-text-muted text-center">
            By registering you agree to our{' '}
            <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
