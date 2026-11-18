import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { invitations } from '../lib/api.js'

export default function AcceptInvitePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState(null)

  // If not logged in, redirect to register with token preserved
  const handleAccept = async (e) => {
    e?.preventDefault()
    if (!token.trim()) return

    if (!user) {
      navigate(`/register?invite=${encodeURIComponent(token.trim())}`)
      return
    }

    if (user.role !== 'RENTER') {
      setStatus('error')
      setErrorMsg('Only renters can accept invitations. Please sign in with a renter account.')
      return
    }

    setStatus('loading')
    setErrorMsg('')
    try {
      const data = await invitations.accept(token.trim())
      setResult(data)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Invalid or expired invitation token.')
    }
  }

  // Auto-submit if token is in URL and user is logged in as renter
  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (urlToken && user?.role === 'RENTER') {
      handleAccept()
    }
  }, [user]) // eslint-disable-line

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-9 h-9 bg-primary text-white rounded-md flex items-center justify-center text-sm font-bold">G</span>
          <span className="text-lg font-bold text-text">GharPay</span>
        </Link>

        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center">
                <CheckCircle2 size={36} className="text-success" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text">You're in! 🎉</h1>
                <p className="text-sm text-text-muted mt-1">
                  Your tenancy has been created. Welcome to GharPay.
                </p>
              </div>
              <button
                onClick={() => navigate('/renter', { replace: true })}
                className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-accent transition-colors mt-2"
              >
                Go to dashboard
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-text mb-1">Accept invitation</h1>
              <p className="text-sm text-text-muted mb-5">
                Paste the invitation token shared by your landlord to link your account to your rental unit.
              </p>

              {status === 'error' && (
                <div className="mb-4 flex items-start gap-2 text-sm text-danger bg-danger-bg border border-danger/20 rounded-lg px-3 py-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAccept} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Invitation token</label>
                  <textarea
                    rows={3}
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="Paste your invitation token here…"
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-mono placeholder:text-text-muted resize-none"
                  />
                </div>

                {!user ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/login?invite=${encodeURIComponent(token.trim())}`)}
                      className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-accent transition-colors"
                    >
                      Sign in to accept
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/register?invite=${encodeURIComponent(token.trim())}`)}
                      className="w-full bg-surface border border-border text-text py-3 rounded-xl text-sm font-semibold hover:bg-surface-muted transition-colors"
                    >
                      Create renter account
                    </button>
                    <p className="text-xs text-text-muted text-center">
                      You need a renter account to accept this invitation.
                    </p>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={status === 'loading' || !token.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-60"
                  >
                    {status === 'loading' ? (
                      <><Loader2 size={16} className="animate-spin" /> Accepting…</>
                    ) : (
                      'Accept invitation'
                    )}
                  </button>
                )}
              </form>
            </>
          )}
        </div>

        {/* Help text */}
        <p className="text-xs text-text-muted text-center mt-4">
          Don't have a token? Ask your landlord to send you an invitation from their GharPay dashboard.
        </p>
      </div>
    </div>
  )
}
