import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { payments as paymentsApi } from '../lib/api'
import DashboardLayout from '../layouts/DashboardLayout'
import {
  ArrowLeft, CheckCircle2, XCircle, ExternalLink,
  Check, X, AlertCircle, Clock, Loader2
} from 'lucide-react'

const METHOD_LABELS = {
  ESEWA: 'eSewa',
  FONEPAY: 'Fonepay',
  BANK_TRANSFER: 'Bank transfer',
  CASH: 'Cash',
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatNPR(amount) {
  return 'NPR ' + Number(amount).toLocaleString('en-IN')
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatMonth(str) {
  if (!str) return '—'
  const d = new Date(str + '-01')
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function StatusBadge({ status }) {
  const map = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    VERIFIED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.charAt(0) + status?.slice(1).toLowerCase()}
    </span>
  )
}

function EsewaMockCard({ amount, reference }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6 flex flex-col items-center gap-1 mt-3">
      <span className="text-green-600 font-bold text-lg tracking-wide">eSewa</span>
      <p className="text-sm text-gray-500 mt-1">Payment successful</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">
        NPR {Number(amount).toLocaleString('en-IN')}.00
      </p>
      {reference && <p className="text-xs text-gray-500 mt-1">Ref: {reference} · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
    </div>
  )
}

function PaymentCard({ payment, onClick, selected }) {
  const renter = payment.bill?.tenancy?.renter
  const unit = payment.bill?.tenancy?.unit
  const property = unit?.property
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all mb-3 ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-surface hover:border-primary/40'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {initials(renter?.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text truncate">{renter?.name || 'Unknown'}</span>
            <span className="font-bold text-text whitespace-nowrap">{formatNPR(payment.amount)}</span>
          </div>
          <p className="text-sm text-text-muted truncate">{property?.name} · {unit?.name}</p>
        </div>
        <StatusBadge status={payment.status} />
      </div>
    </button>
  )
}

function PaymentDetail({ payment, onBack }) {
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [verifyError, setVerifyError] = useState(null)
  const [rejectError, setRejectError] = useState(null)

  const renter = payment.bill?.tenancy?.renter
  const unit = payment.bill?.tenancy?.unit
  const property = unit?.property

  const verifyMutation = useMutation({
    mutationFn: () => paymentsApi.verify(payment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      setVerifyError(null)
    },
    onError: (e) => setVerifyError(e.message),
  })

  const rejectMutation = useMutation({
    mutationFn: () => paymentsApi.reject(payment.id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      setRejecting(false)
      setReason('')
      setRejectError(null)
    },
    onError: (e) => setRejectError(e.message),
  })

  const hasRef = !!payment.transactionReference
  const hasProof = !!payment.proofUrl

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to payments
      </button>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left — Payment info card */}
        <div className="flex-1 bg-surface border border-border rounded-2xl p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-base flex-shrink-0">
                {initials(renter?.name)}
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">Payment from:</p>
                <p className="font-semibold text-text text-lg leading-tight">{renter?.name}</p>
                <p className="text-sm text-text-muted">{property?.name} · {unit?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-text">{formatNPR(payment.amount)}</p>
              <StatusBadge status={payment.status} />
            </div>
          </div>

          <div className="border-t border-border my-4" />

          {/* Grid info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm mb-5">
            <div>
              <p className="text-text-muted mb-0.5">Billing period</p>
              <p className="font-medium text-text">{formatMonth(payment.bill?.billingMonth)}</p>
            </div>
            <div>
              <p className="text-text-muted mb-0.5">Payment method</p>
              <p className="font-medium text-text">{METHOD_LABELS[payment.method] || payment.method}</p>
            </div>
            <div>
              <p className="text-text-muted mb-0.5">Transaction reference</p>
              <p className="font-mono font-medium text-text">{payment.transactionReference || '—'}</p>
            </div>
            <div>
              <p className="text-text-muted mb-0.5">Submitted</p>
              <p className="font-medium text-text">{formatDate(payment.submittedAt)}</p>
            </div>
          </div>

          {/* Proof */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-text-muted text-sm mb-0.5">Payment proof</p>
                <p className="font-medium text-text text-sm">
                  {hasProof ? payment.proofUrl.split('/').pop() : 'No proof uploaded'}
                </p>
              </div>
              {hasProof && (
                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Open full size <ExternalLink size={14} />
                </a>
              )}
            </div>
            {hasProof ? (
              <img
                src={payment.proofUrl}
                alt="Payment proof"
                className="rounded-xl border border-border w-full object-contain max-h-64"
              />
            ) : (
              <EsewaMockCard
                amount={payment.amount}
                reference={payment.transactionReference}
              />
            )}
          </div>

          {(verifyError || rejectError) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-danger bg-danger-bg rounded-lg px-3 py-2">
              <AlertCircle size={15} /> {verifyError || rejectError}
            </div>
          )}
        </div>

        {/* Right — Review panel */}
        <div className="w-full lg:w-72 lg:flex-shrink-0 bg-surface border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-text mb-1">Review payment</h3>
          <p className="text-xs text-text-muted mb-5">
            Confirm that NPR {Number(payment.amount).toLocaleString('en-IN')} has arrived in your account and the reference matches.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2.5">
              {hasRef ? (
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-green-700" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={12} className="text-red-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-text">{hasRef ? 'Reference provided' : 'No reference'}</p>
                {hasRef && <p className="text-xs text-text-muted font-mono">{payment.transactionReference}</p>}
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              {hasProof ? (
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={12} className="text-green-700" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={12} className="text-yellow-700" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-text">{hasProof ? 'Proof uploaded' : 'No proof'}</p>
                <p className="text-xs text-text-muted">{hasProof ? 'Submitted with payment' : 'Tenant did not attach proof'}</p>
              </div>
            </div>
          </div>

          {payment.status === 'VERIFIED' ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-3">
              <CheckCircle2 size={16} /> Payment verified
            </div>
          ) : payment.status === 'REJECTED' ? (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-3">
              <XCircle size={16} /> Payment rejected
            </div>
          ) : (
            <>
              <button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl py-3 text-sm transition-colors mb-3 disabled:opacity-60"
              >
                {verifyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Verify payment
              </button>

              {!rejecting ? (
                <button
                  onClick={() => setRejecting(true)}
                  className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-xl py-3 text-sm transition-colors"
                >
                  Reject payment
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Reason for rejection (optional)"
                    rows={3}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setRejecting(false); setReason('') }}
                      className="flex-1 border border-border text-text-muted rounded-xl py-2 text-sm hover:bg-bg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate()}
                      disabled={rejectMutation.isPending}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      {rejectMutation.isPending ? 'Rejecting…' : 'Confirm reject'}
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-text-muted text-center mt-3">
                The tenant will be notified of your decision.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const { paymentId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.list(),
  })

  const allPayments = Array.isArray(data) ? data : data?.payments || []
  const pendingCount = allPayments.filter(p => p.status === 'PENDING').length

  const selected = paymentId
    ? allPayments.find(p => p.id === paymentId) || allPayments[0]
    : allPayments[0]

  const [localSelected, setLocalSelected] = useState(null)
  const activePayment = localSelected || (paymentId ? allPayments.find(p => p.id === paymentId) : null)

  return (
    <DashboardLayout activeKey="payments">
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          {pendingCount > 0 && (
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-1">
              {pendingCount} payment{pendingCount !== 1 ? 's' : ''} awaiting review
            </p>
          )}
          <h1 className="text-3xl font-bold text-text">Payment verification</h1>
          <p className="text-text-muted mt-1">
            Match the reference and proof before confirming funds received.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-text-muted">
            <Loader2 size={18} className="animate-spin" /> Loading payments…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-danger bg-danger-bg rounded-xl px-4 py-3">
            <AlertCircle size={16} /> Failed to load payments: {error.message}
          </div>
        )}

        {!isLoading && !error && (
          activePayment ? (
            <PaymentDetail
              payment={activePayment}
              onBack={() => setLocalSelected(null)}
            />
          ) : (
            <div>
              {allPayments.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                  <CheckCircle2 size={48} className="text-green-400 mx-auto mb-3" />
                  <p className="font-semibold text-text">All caught up!</p>
                  <p className="text-sm text-text-muted mt-1">No payments to review right now.</p>
                </div>
              ) : (
                <div className="max-w-xl">
                  {allPayments.map(payment => (
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                      selected={false}
                      onClick={() => setLocalSelected(payment)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}
