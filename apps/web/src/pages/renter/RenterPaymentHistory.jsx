import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import RenterLayout from './RenterLayout.jsx'
import { bills, payments } from '../../lib/api.js'

function fmtNPR(v) {
  if (!v && v !== 0) return 'NPR —'
  return `NPR ${Number(v).toLocaleString('en-IN')}`
}
function fmtMonth(d) {
  if (!d) return 'Unknown'
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusChip({ status }) {
  const map = {
    PENDING: { label: 'Pending', cls: 'bg-warning-bg text-warning border-warning/20', Icon: Clock },
    SENT:    { label: 'Due',     cls: 'bg-warning-bg text-warning border-warning/20', Icon: Clock },
    PAID:    { label: 'Paid',    cls: 'bg-success-bg text-success border-success/20', Icon: CheckCircle2 },
    VERIFIED:{ label: 'Paid',   cls: 'bg-success-bg text-success border-success/20', Icon: CheckCircle2 },
    OVERDUE: { label: 'Overdue', cls: 'bg-danger-bg text-danger border-danger/20', Icon: AlertTriangle },
    DRAFT:   { label: 'Draft',  cls: 'bg-surface-muted text-text-muted border-border', Icon: FileText },
  }
  const { label, cls, Icon } = map[status] || map.DRAFT
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  )
}

export default function RenterPaymentHistory() {
  const navigate = useNavigate()

  const { data: billList, isLoading } = useQuery({
    queryKey: ['renter-bills'],
    queryFn: async () => {
      const r = await bills.mine()
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

  const sortedBills = [...(billList ?? [])].sort(
    (a, b) => new Date(b.billingMonth ?? b.createdAt) - new Date(a.billingMonth ?? a.createdAt)
  )

  const tenancyLabel = billList?.[0]?.tenancy
    ? `${billList[0].tenancy.unit?.property?.name ?? ''} · ${billList[0].tenancy.unit?.name ?? ''}`
    : ''

  return (
    <RenterLayout>
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 pt-6 pb-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Your records</p>
          <h1 className="text-2xl font-bold text-text">Payment History</h1>
          {tenancyLabel && <p className="text-sm text-text-muted mt-1">{tenancyLabel}</p>}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 border-b border-border animate-pulse bg-surface-muted last:border-0" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && sortedBills.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-16 text-center">
            <FileText size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text font-semibold mb-1">No bills yet</p>
            <p className="text-text-muted text-sm">Bills will appear here once your landlord sends them.</p>
          </div>
        )}

        {/* Table on desktop, cards on mobile */}
        {!isLoading && sortedBills.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-muted">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Period</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Property / Unit</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Amount</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Date</th>
                    <th className="px-6 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedBills.map((bill) => {
                    const isPaid = ['PAID', 'VERIFIED'].includes(bill.status)
                    // Match any payment for this bill (verified OR pending)
                    const anyPayment = paymentList?.find(p => p.billId === bill.id &&
                      ['VERIFIED', 'PAID', 'PENDING'].includes(p.status))
                    const isVerified = anyPayment && ['VERIFIED', 'PAID'].includes(anyPayment.status)
                    const total = bill.items?.reduce((s, c) => s + Number(c.amount), 0) ?? Number(bill.totalAmount ?? 0)
                    const dateStr = isVerified
                      ? `Paid ${fmtDate(anyPayment.verifiedAt ?? anyPayment.submittedAt)}`
                      : anyPayment ? 'Awaiting verification'
                      : bill.dueDate ? `Due ${fmtDate(bill.dueDate)}` : '—'
                    const canClick = !!anyPayment

                    return (
                      <tr
                        key={bill.id}
                        onClick={() => canClick && navigate(`/renter/receipts/${anyPayment.id}`)}
                        className={`transition-colors ${canClick ? 'hover:bg-surface-muted cursor-pointer' : ''}`}
                      >
                        <td className="px-6 py-4 font-semibold text-text">{fmtMonth(bill.billingMonth)}</td>
                        <td className="px-6 py-4 text-text-muted text-sm">
                          {bill.tenancy?.unit?.property?.name ?? '—'}
                          {bill.tenancy?.unit?.name ? ` · ${bill.tenancy.unit.name}` : ''}
                        </td>
                        <td className="px-6 py-4"><StatusChip status={bill.status} /></td>
                        <td className="px-6 py-4 text-right font-semibold text-text">{fmtNPR(total)}</td>
                        <td className="px-6 py-4 text-sm text-text-muted">{dateStr}</td>
                        <td className="px-6 py-4 text-right">
                          {canClick && <ChevronRight size={16} className="text-text-muted ml-auto" />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {sortedBills.map((bill) => {
                // Any payment submitted for this bill
                const anyPayment = paymentList?.find(p => p.billId === bill.id &&
                  ['VERIFIED', 'PAID', 'PENDING'].includes(p.status))
                const isVerified = anyPayment && ['VERIFIED', 'PAID'].includes(anyPayment.status)
                const total = bill.items?.reduce((s, c) => s + Number(c.amount), 0) ?? Number(bill.totalAmount ?? 0)
                const sub = isVerified
                  ? `Paid ${fmtDate(anyPayment.verifiedAt ?? anyPayment.submittedAt)}`
                  : anyPayment ? 'Awaiting verification'
                  : bill.dueDate ? `Due ${fmtDate(bill.dueDate)}` : ''

                return (
                  <button key={bill.id}
                    onClick={() => anyPayment && navigate(`/renter/receipts/${anyPayment.id}`)}
                    className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left ${anyPayment ? 'hover:bg-surface-muted' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{fmtMonth(bill.billingMonth)}</p>
                      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium text-text">{fmtNPR(total)}</p>
                        <StatusChip status={bill.status} />
                      </div>
                      {anyPayment && <ChevronRight size={16} className="text-text-muted" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </RenterLayout>
  )
}
