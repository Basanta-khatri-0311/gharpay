import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import RenterLayout from './RenterLayout.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { bills, payments } from '../../lib/api.js'

function fmtNPR(v) {
  if (!v && v !== 0) return 'NPR —'
  return `NPR ${Number(v).toLocaleString('en-IN')}`
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMonth(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function StatusBadge({ status }) {
  const map = {
    PENDING: 'bg-warning-bg text-warning border-warning/20',
    SENT: 'bg-warning-bg text-warning border-warning/20',
    PAID: 'bg-success-bg text-success border-success/20',
    OVERDUE: 'bg-danger-bg text-danger border-danger/20',
    DRAFT: 'bg-surface-muted text-text-muted border-border',
    VERIFIED: 'bg-success-bg text-success border-success/20',
  }
  const cls = map[status] || 'bg-surface-muted text-text-muted border-border'
  const label = status === 'SENT' ? 'Payment pending' : status?.charAt(0) + status?.slice(1).toLowerCase()
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  )
}

// ── Pay Now Modal ─────────────────────────────────────────────────────────────
function PayModal({ bill, onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ method: 'ESEWA', transactionReference: '', proofUrl: '' })
  const [err, setErr] = useState(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => payments.submit({
      billId: bill.id,
      method: form.method,
      transactionReference: form.transactionReference.trim(),
      ...(form.proofUrl.trim() ? { proofUrl: form.proofUrl.trim() } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renter-bills'] })
      queryClient.invalidateQueries({ queryKey: ['renter-payments'] })
      setSuccess(true)
    },
    onError: (e) => setErr(e.message || 'Payment submission failed'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErr(null)
    if (!form.transactionReference.trim()) { setErr('Transaction reference is required'); return }
    mutation.mutate()
  }

  const total = bill?.charges?.reduce((s, c) => s + Number(c.amount), 0) ?? Number(bill?.totalAmount ?? 0)

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-surface border border-border rounded-2xl w-full max-w-sm p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center">
            <CheckCircle2 className="text-success" size={36} />
          </div>
          <h2 className="text-lg font-bold text-text">Payment Submitted!</h2>
          <p className="text-sm text-text-muted">Your landlord will verify and confirm your payment shortly.</p>
          <button onClick={onClose} className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-text">Pay Bill</h2>
            <p className="text-xs text-text-muted mt-0.5">{fmtMonth(bill?.billingPeriodStart)} · {fmtNPR(total)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-text-muted hover:bg-surface-muted">
            <X size={18} />
          </button>
        </div>

        {err && (
          <div className="mx-5 mt-4 flex items-center gap-2 text-xs text-danger bg-danger-bg border border-danger/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Payment method</label>
            <select
              value={form.method}
              onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="ESEWA">eSewa</option>
              <option value="FONEPAY">Fonepay</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Transaction reference *</label>
            <input
              type="text"
              placeholder="e.g. EPY892731"
              value={form.transactionReference}
              onChange={e => setForm(f => ({ ...f, transactionReference: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-text-muted"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Proof image URL <span className="text-text-muted font-normal">(optional)</span></label>
            <input
              type="url"
              placeholder="https://…"
              value={form.proofUrl}
              onChange={e => setForm(f => ({ ...f, proofUrl: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-text-muted"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-accent transition-colors mt-1 disabled:opacity-60"
          >
            {mutation.isPending ? 'Submitting…' : `Submit payment · ${fmtNPR(total)}`}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function RenterDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [payBill, setPayBill] = useState(null)

  const { data: billList } = useQuery({
    queryKey: ['renter-bills'],
    queryFn: async () => {
      const r = await bills.list()
      return Array.isArray(r) ? r : (r?.bills ?? [])
    },
  })

  const { data: paymentList } = useQuery({
    queryKey: ['renter-payments'],
    queryFn: async () => {
      const r = await payments.list()
      return Array.isArray(r) ? r : (r?.payments ?? [])
    },
  })

  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Current bill: first SENT or PENDING
  const sortedBills = [...(billList ?? [])].sort(
    (a, b) => new Date(b.billingPeriodStart ?? b.createdAt) - new Date(a.billingPeriodStart ?? a.createdAt)
  )
  const currentBill = sortedBills.find(b => ['SENT', 'PENDING'].includes(b.status))
  const recentPaid = sortedBills.filter(b => ['PAID', 'VERIFIED'].includes(b.status)).slice(0, 2)

  const totalDue = currentBill?.charges?.reduce((s, c) => s + Number(c.amount), 0) ?? Number(currentBill?.totalAmount ?? 0)
  const chargeCount = currentBill?.charges?.length ?? 0

  // Tenancy info from bill
  const tenancyLabel = currentBill?.tenancy
    ? `${currentBill.tenancy.unit?.property?.name ?? ''} · ${currentBill.tenancy.unit?.name ?? ''}`
    : ''

  return (
    <RenterLayout>
      <div className="max-w-sm mx-auto w-full px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-primary text-white rounded-md flex items-center justify-center text-sm font-bold">G</span>
            <span className="text-[15px] font-bold text-text">GharPay</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Greeting */}
        <p className="text-sm text-text-muted">{greeting}, {firstName}</p>
        <h1 className="text-[22px] font-bold text-text mt-0.5 mb-5">
          {currentBill
            ? `Your ${fmtMonth(currentBill.billingPeriodStart)} bill is due soon.`
            : ''}
          {!currentBill && billList !== undefined && 'You\'re all caught up! 🎉'}
        </h1>

        {/* Current bill card */}
        {currentBill && (
          <div className="bg-primary rounded-2xl p-5 mb-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest opacity-70">Current bill</span>
              <StatusBadge status={currentBill.status} />
            </div>
            <div className="text-xs opacity-70 mb-1">{fmtMonth(currentBill.billingPeriodStart)}</div>
            <div className="text-sm opacity-70 mb-1">Total due</div>
            <div className="text-3xl font-bold mb-1">{fmtNPR(totalDue)}</div>
            {currentBill.dueDate && (
              <div className="text-xs opacity-60 mb-4">Due {fmtDate(currentBill.dueDate)}</div>
            )}
            <button
              onClick={() => setPayBill(currentBill)}
              className="w-full bg-white/15 hover:bg-white/25 transition-colors text-white py-3 rounded-xl text-sm font-semibold border border-white/20"
            >
              Pay now
            </button>
          </div>
        )}

        {/* Bill breakdown */}
        {currentBill?.charges?.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-text">Bill breakdown</span>
              <span className="text-xs text-text-muted">{chargeCount} charges</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {currentBill.charges.map((charge, i) => (
                <div key={i} className="flex items-start justify-between">
                  <div>
                    <span className="text-sm text-text">{charge.description}</span>
                    {charge.note && <p className="text-xs text-text-muted">{charge.note}</p>}
                  </div>
                  <span className="text-sm text-text font-medium">{fmtNPR(charge.amount)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-text">Total</span>
                <span className="text-sm font-bold text-text">{fmtNPR(totalDue)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent payments */}
        {recentPaid.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-text">Recent payments</span>
              <button
                onClick={() => navigate('/renter/payments')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {recentPaid.map((bill) => {
                const paidPayment = paymentList?.find(p => p.billId === bill.id && ['VERIFIED', 'PAID'].includes(p.status))
                const paidDate = paidPayment?.createdAt ? fmtDate(paidPayment.createdAt) : null
                const amt = bill.charges?.reduce((s, c) => s + Number(c.amount), 0) ?? Number(bill.totalAmount ?? 0)
                return (
                  <button
                    key={bill.id}
                    onClick={() => paidPayment && navigate(`/renter/receipts/${paidPayment.id}`)}
                    className="flex items-center gap-3 py-3 text-left hover:bg-surface-muted rounded-lg px-1 transition-colors w-full"
                  >
                    <div className="w-5 h-5 rounded-full bg-success-bg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{fmtMonth(bill.billingPeriodStart)}</p>
                      {paidDate && <p className="text-xs text-text-muted">Paid {paidDate}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium text-text">{fmtNPR(amt)}</span>
                      <ChevronRight size={14} className="text-text-muted" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {billList !== undefined && billList.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center">
            <p className="text-text-muted text-sm">No bills yet. Your landlord will send your first bill soon.</p>
          </div>
        )}
      </div>

      {payBill && <PayModal bill={payBill} onClose={() => setPayBill(null)} />}
    </RenterLayout>
  )
}
