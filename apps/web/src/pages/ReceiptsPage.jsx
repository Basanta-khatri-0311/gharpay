import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { payments as paymentsApi } from '../lib/api'
import DashboardLayout from '../layouts/DashboardLayout'
import {
  ArrowLeft, Share2, Download, CheckCircle2,
  ChevronRight, Loader2, AlertCircle, FileText
} from 'lucide-react'

function formatNPR(amount) {
  return 'NPR ' + Number(amount).toLocaleString('en-IN')
}

function formatDate(str, opts) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', opts || {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function formatMonth(str) {
  if (!str) return '—'
  const d = new Date(str + '-01')
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

const METHOD_LABELS = {
  ESEWA: 'eSewa',
  FONEPAY: 'Fonepay',
  BANK_TRANSFER: 'Bank transfer',
  CASH: 'Cash',
}

function ReceiptDocument({ payment }) {
  const receipt = payment.receipt
  const renter = payment.bill?.tenancy?.renter
  const unit = payment.bill?.tenancy?.unit
  const property = unit?.property
  const items = payment.bill?.items || []
  const methodLabel = METHOD_LABELS[payment.method] || payment.method

  return (
    <div
      id="receipt-printable"
      className="bg-white border border-gray-200 rounded-2xl max-w-2xl mx-auto shadow-sm print:shadow-none print:border-none"
    >
      {/* Receipt top */}
      <div className="flex items-start justify-between px-8 pt-8 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-base">G</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">GharPay</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Payment receipt</p>
          <p className="font-mono font-semibold text-gray-700">#{receipt?.receiptNumber || receipt?.id?.slice(0,12)}</p>
        </div>
      </div>

      <div className="border-t border-gray-100 mx-8" />

      {/* Status bar */}
      <div className="mx-8 my-5 flex items-center justify-between bg-green-50 rounded-xl px-5 py-3">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 size={18} />
          <div>
            <p className="text-xs text-green-600 uppercase tracking-wide font-medium">Payment status</p>
            <p className="font-bold text-green-800">PAID</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Date paid</p>
          <p className="font-semibold text-gray-800">{formatDate(payment.verifiedAt || receipt?.issuedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="border-t border-gray-100 mx-8" />

      {/* Parties */}
      <div className="mx-8 my-5 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tenant</p>
          <p className="font-semibold text-gray-800">{renter?.name || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Property</p>
          <p className="font-semibold text-gray-800">{property?.name || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Billing period</p>
          <p className="font-semibold text-gray-800">{formatMonth(payment.bill?.billingMonth)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment method</p>
          <p className="font-semibold text-gray-800">{methodLabel}</p>
        </div>
      </div>

      <div className="border-t border-gray-100 mx-8" />

      {/* Line items */}
      <div className="mx-8 my-5 space-y-2.5">
        {items.length === 0 ? (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <span className="font-semibold text-gray-900">{formatNPR(payment.amount)}</span>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.description}</span>
              <span className="font-medium text-gray-800 tabular-nums">{formatNPR(item.amount)}</span>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-gray-200 mx-8" />

      {/* Total */}
      <div className="mx-8 my-5 flex justify-between items-center">
        <span className="font-semibold text-gray-700">Total paid</span>
        <span className="text-2xl font-bold text-gray-900">{formatNPR(payment.amount)}</span>
      </div>

      <div className="border-t border-gray-100 mx-8" />

      {/* Footer */}
      <div className="mx-8 py-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle2 size={15} />
          <span>Verified by property owner</span>
        </div>
        <p className="text-xs text-gray-400">This is a digitally generated GharPay receipt.</p>
      </div>
    </div>
  )
}

function ReceiptList({ paymentsWithReceipt, onSelect }) {
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-1">Receipts</p>
        <h1 className="text-3xl font-bold text-text">Payment receipts</h1>
        <p className="text-text-muted mt-1">Verified payment receipts for all tenants.</p>
      </div>

      {paymentsWithReceipt.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <FileText size={48} className="text-text-muted mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-text">No receipts yet</p>
          <p className="text-sm text-text-muted mt-1">Receipts appear here once payments are verified.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 text-text-muted font-medium">Receipt #</th>
                <th className="text-left px-5 py-3.5 text-text-muted font-medium">Tenant</th>
                <th className="text-left px-5 py-3.5 text-text-muted font-medium">Property</th>
                <th className="text-right px-5 py-3.5 text-text-muted font-medium">Amount</th>
                <th className="text-left px-5 py-3.5 text-text-muted font-medium">Billing month</th>
                <th className="text-left px-5 py-3.5 text-text-muted font-medium">Issued</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {paymentsWithReceipt.map(payment => {
                const receipt = payment.receipt
                const renter = payment.bill?.tenancy?.renter
                const property = payment.bill?.tenancy?.unit?.property
                return (
                  <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-bg/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-primary font-medium">
                      #{receipt?.receiptNumber || receipt?.id?.slice(0, 12)}
                    </td>
                    <td className="px-5 py-4 font-medium text-text">{renter?.name || '—'}</td>
                    <td className="px-5 py-4 text-text-secondary">{property?.name || '—'}</td>
                    <td className="px-5 py-4 text-right font-medium text-text tabular-nums">
                      {formatNPR(payment.amount)}
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{formatMonth(payment.bill?.billingMonth)}</td>
                    <td className="px-5 py-4 text-text-secondary">{formatDate(receipt?.issuedAt)}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => onSelect(payment)}
                        className="flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                      >
                        View <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ReceiptDetailView({ payment, onBack }) {
  const receipt = payment.receipt
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handlePrint = () => window.print()

  return (
    <div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between mb-6">
            <div>
              <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-1">
                Receipt #{receipt?.receiptNumber || receipt?.id?.slice(0, 12)}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-text">Payment receipt</h1>
              <p className="text-text-muted mt-1">A verified record for tenant and property owner.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 border border-border bg-surface hover:bg-bg rounded-xl px-4 py-2.5 text-sm font-medium text-text transition-colors"
              >
                <Share2 size={15} />
                {copied ? 'Copied!' : 'Share receipt'}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
              >
                <Download size={15} />
                Download PDF
              </button>
            </div>
          </div>

      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to receipts
      </button>

      <ReceiptDocument payment={payment} />
    </div>
  )
}

export default function ReceiptsPage() {
  const { receiptId } = useParams()
  const [localSelected, setLocalSelected] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.list(),
  })

  const allPayments = Array.isArray(data) ? data : data?.payments || []
  const paymentsWithReceipt = allPayments
    .filter(p => p.receipt !== null && p.receipt !== undefined)
    .sort((a, b) => new Date(b.receipt?.issuedAt) - new Date(a.receipt?.issuedAt))

  // If URL has a receiptId, find that payment
  const urlPayment = receiptId
    ? paymentsWithReceipt.find(p => p.receipt?.id === receiptId || p.id === receiptId)
    : null

  const activePayment = localSelected || urlPayment

  return (
    <DashboardLayout activeKey="receipts">
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {isLoading && (
          <div className="flex items-center gap-2 text-text-muted">
            <Loader2 size={18} className="animate-spin" /> Loading receipts…
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-danger bg-danger-bg rounded-xl px-4 py-3">
            <AlertCircle size={16} /> Failed to load receipts: {error.message}
          </div>
        )}
        {!isLoading && !error && (
          activePayment ? (
            <ReceiptDetailView
              payment={activePayment}
              onBack={() => setLocalSelected(null)}
            />
          ) : (
            <ReceiptList
              paymentsWithReceipt={paymentsWithReceipt}
              onSelect={setLocalSelected}
            />
          )
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-printable { display: block !important; }
        }
      `}</style>
    </DashboardLayout>
  )
}
