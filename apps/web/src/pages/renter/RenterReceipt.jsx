import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Download, Share2, CheckCircle2, Clock, Building2, Home, CreditCard } from 'lucide-react'
import RenterLayout from './RenterLayout.jsx'
import { payments } from '../../lib/api.js'

function fmtNPR(v) {
  if (!v && v !== 0) return 'NPR —'
  return `NPR ${Number(v).toLocaleString('en-IN')}`
}
function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtMonth(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
function padReceiptNum(id) {
  const num = typeof id === 'string' ? id.replace(/\D/g, '').slice(-5) : String(id).slice(-5)
  return `GP-${new Date().getFullYear()}-${num.padStart(5, '0')}`
}

const methodLabels = {
  ESEWA: 'eSewa', FONEPAY: 'Fonepay', BANK_TRANSFER: 'Bank Transfer', CASH: 'Cash',
}

export default function RenterReceipt() {
  const { paymentId } = useParams()
  const navigate = useNavigate()

  const { data: paymentData, isLoading } = useQuery({
    queryKey: ['renter-payment', paymentId],
    queryFn: () => payments.get(paymentId),
    enabled: !!paymentId,
  })

  const p = paymentData?.payment ?? paymentData
  const bill = p?.bill
  const tenancy = bill?.tenancy ?? p?.tenancy
  const unit = tenancy?.unit
  const property = unit?.property
  const items = bill?.items ?? []
  const total = items.reduce((s, c) => s + Number(c.amount), 0) || Number(bill?.totalAmount ?? p?.amount ?? 0)

  const handleDownload = () => window.print()
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'GharPay Receipt', url: window.location.href }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {})
      alert('Link copied!')
    }
  }

  if (isLoading) {
    return (
      <RenterLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-text-muted text-sm animate-pulse">Loading receipt…</p>
        </div>
      </RenterLayout>
    )
  }

  if (!p) {
    return (
      <RenterLayout>
        <div className="max-w-md mx-auto px-4 pt-16 text-center">
          <p className="text-text font-semibold mb-2">Receipt not found</p>
          <p className="text-text-muted text-sm mb-6">This receipt may not exist or you don't have access.</p>
          <button onClick={() => navigate('/renter/payments')}
            className="text-primary text-sm font-medium hover:underline">← Back to payments</button>
        </div>
      </RenterLayout>
    )
  }

  return (
    <RenterLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6 pb-10 max-w-5xl mx-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
            <ChevronLeft size={18} /> Back
          </button>
          <div className="flex gap-2">
            <button onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-border text-text rounded-xl text-sm font-medium hover:bg-surface-muted transition-colors">
              <Share2 size={15} /> Share
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-accent transition-colors">
              <Download size={15} /> Download PDF
            </button>
          </div>
        </div>

        {/* Page heading */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Payment receipt</p>
          <h1 className="text-2xl font-bold text-text">Receipt #{padReceiptNum(paymentId)}</h1>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* ── LEFT: receipt card ── */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden print:shadow-none">

            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-bold">G</span>
                <div>
                  <p className="text-sm font-bold text-text">GharPay</p>
                  <p className="text-xs text-text-muted">Digital rent receipt</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Receipt no.</p>
                <p className="text-sm font-mono font-semibold text-text">#{padReceiptNum(paymentId)}</p>
              </div>
            </div>

            {/* Status banner — adapts to PENDING vs VERIFIED */}
            {p.status === 'PENDING' ? (
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-warning-bg/60 border-b border-warning/15">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-warning/15 flex items-center justify-center">
                    <Clock size={18} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Payment status</p>
                    <p className="text-sm font-bold text-warning">Submitted — awaiting verification</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Submitted</p>
                  <p className="text-sm font-semibold text-text">{fmtDate(p.submittedAt)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-success-bg/50 border-b border-success/15">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-success-bg flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Payment status</p>
                    <p className="text-sm font-bold text-success">Verified & Paid</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Date</p>
                  <p className="text-sm font-semibold text-text">{fmtDate(p.verifiedAt ?? p.submittedAt)}</p>
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:p-6 border-b border-border">
              {[
                { label: 'Tenant', value: tenancy?.renter?.name ?? '—' },
                { label: 'Property', value: property?.name ?? '—' },
                { label: 'Unit', value: unit?.name ?? '—' },
                { label: 'Billing period', value: fmtMonth(bill?.billingMonth) },
                { label: 'Payment method', value: methodLabels[p.method] ?? p.method ?? '—' },
                { label: 'Transaction ref.', value: p.transactionReference ?? '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-text-muted mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-text break-all">{value}</p>
                </div>
              ))}
            </div>

            {/* Items breakdown */}
            {items.length > 0 && (
              <div className="p-5 sm:p-6 border-b border-border">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Charges</p>
                <div className="flex flex-col gap-2.5">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-text">{item.description}</span>
                      <span className="text-sm font-medium text-text">{fmtNPR(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border">
              <span className="text-base font-bold text-text">Total paid</span>
              <span className="text-2xl font-bold text-text">{fmtNPR(total)}</span>
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 flex items-center gap-2.5 bg-surface-muted">
              <CheckCircle2 size={14} className="text-success shrink-0" />
              <p className="text-xs text-text-muted">
                {p.status === 'PENDING'
                  ? 'Payment submitted via GharPay. Awaiting landlord verification.'
                  : 'This is an official GharPay digital receipt. Verified by the property owner.'}
              </p>
            </div>
          </div>

          {/* ── RIGHT: summary cards ── */}
          <div className="flex flex-col gap-4">

            {/* Property info */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Property details</p>
              <div className="flex flex-col gap-3">
                {property && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Property</p>
                      <p className="text-sm font-semibold text-text">{property.name}</p>
                      {property.address && <p className="text-xs text-text-muted">{property.address}</p>}
                    </div>
                  </div>
                )}
                {unit && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
                      <Home size={16} className="text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Unit</p>
                      <p className="text-sm font-semibold text-text">{unit.name}</p>
                    </div>
                  </div>
                )}
                {p.method && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
                      <CreditCard size={16} className="text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Paid via</p>
                      <p className="text-sm font-semibold text-text">{methodLabels[p.method] ?? p.method}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amount summary */}
            <div className="bg-primary rounded-2xl p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Total paid</p>
              <p className="text-3xl font-bold mb-1">{fmtNPR(total)}</p>
              <p className="text-sm opacity-70">{fmtMonth(bill?.billingMonth)}</p>
            </div>

            {/* Actions — repeated for desktop convenience */}
            <div className="flex flex-col gap-2">
              <button onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-accent transition-colors">
                <Download size={15} /> Download PDF
              </button>
              <button onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 bg-surface border border-border text-text py-3 rounded-xl text-sm font-semibold hover:bg-surface-muted transition-colors">
                <Share2 size={15} /> Share receipt
              </button>
              <button onClick={() => navigate('/renter/payments')}
                className="text-sm text-text-muted hover:text-text text-center mt-1 transition-colors">
                ← Back to payments
              </button>
            </div>
          </div>
        </div>
      </div>
    </RenterLayout>
  )
}
