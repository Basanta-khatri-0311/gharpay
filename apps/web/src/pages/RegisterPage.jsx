import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'LANDLORD' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(form)
      // After registering, send user to login
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-surface border border-border rounded-2xl p-8 shadow-sm flex flex-col gap-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-[30px] h-[30px] bg-primary text-white rounded-md flex items-center justify-center text-[13px] font-bold">G</span>
          <span className="text-[15px] font-semibold text-text">GharPay</span>
        </Link>

        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Create your account</h1>
          <p className="text-[13px] text-text-muted mt-1">Free to set up · No card required</p>
        </div>

        {/* Role toggle */}
        <div className="grid grid-cols-2 gap-1 bg-surface-muted border border-border rounded-lg p-1">
          {['LANDLORD', 'RENTER'].map((r) => (
            <button
              key={r}
              type="button"
              className={`py-2 rounded-md text-[13px] font-medium transition-all ${
                form.role === r
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
              onClick={() => setForm((f) => ({ ...f, role: r }))}
            >
              {r === 'LANDLORD' ? "I'm a landlord" : "I'm a renter"}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-danger-bg border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-secondary" htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-md text-sm text-text bg-surface outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 placeholder:text-text-muted"
              placeholder="Basant Khatri"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-secondary" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-md text-sm text-text bg-surface outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 placeholder:text-text-muted"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-secondary" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-md text-sm text-text bg-surface outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 placeholder:text-text-muted"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-[13px] text-text-muted text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
