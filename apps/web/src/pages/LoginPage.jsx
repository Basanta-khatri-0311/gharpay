import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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
      await login(form)
      navigate(from, { replace: true })
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
          <h1 className="text-[22px] font-bold tracking-tight">Welcome back</h1>
          <p className="text-[13px] text-text-muted mt-1">Sign in to your account</p>
        </div>

        {justRegistered && (
          <div className="bg-success-bg border border-success/20 text-success text-[13px] px-4 py-3 rounded-lg">
            Account created! Sign in to get started.
          </div>
        )}

        {error && (
          <div className="bg-danger-bg border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-secondary" htmlFor="email">Email</label>
            <input
              id="email"
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
            <label className="text-[13px] font-medium text-text-secondary" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-md text-sm text-text bg-surface outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 placeholder:text-text-muted"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-[13px] text-text-muted text-center">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
