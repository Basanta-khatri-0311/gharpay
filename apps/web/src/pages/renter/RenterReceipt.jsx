import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Download, Share2, CheckCircle2 } from 'lucide-react'
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
  return `#GP-${new Date().getFullYear()}-${num.padStart(5, '0')}`
}

export default function RenterReceipt() {
  const { paymentId } = useParams()
  const navigate = useNavigate()

  const { data: payment, isLoading } = useQuery({
    queryKey: ['renter-payment', paymentId],
    queryFn: () => payments.get(paymentId),
    enabled: !!paymentId,
  })

  const p = payment?.payment ?? payment
  const bill = p?.bill
  const tenancy = bill?.tenancy ?? p?.tenancy
  const unit = tenancy?.unit
  const property = unit?.property

  const charges = bill?.charges ?? []
  const total = charges.reduce((s, c) => s + Number(c.amount), 0) || Number(bill?.totalAmount ?? p?.amount ?? 0)

  const methodLabels = {
    ESEWA: 'eSewa',
    FONEPAY: 'Fonepay',
    BANK_TRANSFER: 'Bank Transfer',
    CASH: 'Cash',
  }

  const handleDownload = () => window.print()

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'GharPay Receipt', url: window.location.href }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {})
      alert('Link copied to clipboard!')
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
        <div className="max-w-sm mx-auto px-4 pt-10 text-center">
          <p className="text-text-muted text-sm">Receipt not found.</p>
          <button onClick={() => navigate('/renter/payments')} className="mt-4 text-primary text-sm font-medium hover:underline">
            ← Back to payments
          </button>
        </div>
      </RenterLayout>
    )
  }

  return (
    <RenterLayout>
      <div className="max-w-sm mx-auto w-full px-4 pt-6 pb-10">
        {/* Back */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-surface-muted transition-colors text-text-muted"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Success banner */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Payment complete</p>
          <h1 className="text-2xl font-bold text-text">Your receipt is ready</h1>
        </div>

        {/* Receipt card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6 print:shadow-none">
          {/* Receipt header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-primary text-white rounded-md flex items-center justify-center text-sm font-bold">G</span>
              <span className="text-sm font-bold text-text">GharPay</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Payment receipt</p>
              <p className="text-xs font-mono font-semibold text-text">{padReceiptNum(paymentId)}</p>
            </div>
          </div>

          {/* Status row */}
          <div className="flex items-center justify-between px-5 py-3 bg-success-bg/60 border-b border-success/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-success" />
              <div>
                <p className="text-xs font-semibold text-text-muted">Payment status</p>
                <p className="text-sm font-bold text-success">PAID</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Date paid</p>
              <p className="text-sm font-semibold text-text">{fmtDate(p.updatedAt ?? p.createdAt)}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-5 border-b border-border">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Tenant</p>
              <p className="text-sm font-semibold text-text">{tenancy?.renter?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Property</p>
              <p className="text-sm font-semibold text-text">{property?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Billing period</p>
              <p className="text-sm font-semibold text-text">{fmtMonth(bill?.billingPeriodStart)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Payment method</p>
              <p className="text-sm font-semibold text-text">{methodLabels[p.method] ?? p.method}</p>
            </div>
          </div>

          {/* Charge breakdown */}
          {charges.length > 0 && (
            <div className="p-5 border-b border-border flex flex-col gap-2.5">
              {charges.map((charge, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-text">{charge.description}</span>
                  <span className="text-sm text-text">{fmtNPR(charge.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <span className="text-sm font-semibold text-text">Total paid</span>
            <span className="text-xl font-bold text-text">{fmtNPR(total)}</span>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-success flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-text">Verified by property owner</p>
              <p className="text-xs text-text-muted">This is a digitally generated GharPay receipt.</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-accent transition-colors"
          >
            <Download size={16} />
            Download receipt
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-surface border border-border text-text py-3.5 rounded-xl text-sm font-semibold hover:bg-surface-muted transition-colors"
          >
            <Share2 size={16} />
            Share receipt
          </button>
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate('/renter')}
          className="mt-5 w-full text-center text-sm text-primary font-medium hover:underline"
        >
          Back to home
        </button>
      </div>
    </RenterLayout>
  )
}
