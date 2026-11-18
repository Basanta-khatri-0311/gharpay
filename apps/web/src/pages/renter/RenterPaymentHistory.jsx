import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

function StatusBadge({ status }) {
  const map = {
    PENDING: 'bg-warning-bg text-warning border-warning/20',
    SENT: 'bg-warning-bg text-warning border-warning/20',
    PAID: 'bg-success-bg text-success border-success/20',
    VERIFIED: 'bg-success-bg text-success border-success/20',
    OVERDUE: 'bg-danger-bg text-danger border-danger/20',
    DRAFT: 'bg-surface-muted text-text-muted border-border',
  }
  const cls = map[status] || 'bg-surface-muted text-text-muted border-border'
  const labels = { SENT: 'Pending', PENDING: 'Pending', PAID: 'Paid', VERIFIED: 'Paid', OVERDUE: 'Overdue', DRAFT: 'Draft' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

export default function RenterPaymentHistory() {
  const navigate = useNavigate()

  const { data: billList, isLoading: loadingBills } = useQuery({
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

  const sortedBills = [...(billList ?? [])].sort(
    (a, b) => new Date(b.billingPeriodStart ?? b.createdAt) - new Date(a.billingPeriodStart ?? a.createdAt)
  )

  // Try to get tenancy info from first bill
  const tenancyLabel = billList?.[0]?.tenancy
    ? `${billList[0].tenancy.unit?.property?.name ?? ''} · ${billList[0].tenancy.unit?.name ?? ''}`
    : ''

  return (
    <RenterLayout>
      <div className="max-w-sm mx-auto w-full px-4 pt-6">
        {/* Back header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/renter')}
            className="p-2 -ml-2 rounded-lg hover:bg-surface-muted transition-colors text-text-muted"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1" />
        </div>

        {/* Title block */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Your records</p>
          <h1 className="text-2xl font-bold text-text">Payment history</h1>
          {tenancyLabel && (
            <p className="text-sm text-text-muted mt-1">All payments for {tenancyLabel}</p>
          )}
        </div>

        {/* Bill list */}
        {loadingBills && (
          <div className="text-center py-16 text-text-muted text-sm animate-pulse">Loading…</div>
        )}

        {!loadingBills && sortedBills.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center">
            <p className="text-text-muted text-sm">No bills yet.</p>
          </div>
        )}

        {!loadingBills && sortedBills.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {sortedBills.map((bill, idx) => {
              const isPaid = ['PAID', 'VERIFIED'].includes(bill.status)
              const isPending = ['SENT', 'PENDING'].includes(bill.status)
              const isOverdue = bill.status === 'OVERDUE'

              const paidPayment = paymentList?.find(p => p.billId === bill.id && ['VERIFIED', 'PAID'].includes(p.status))
              const pendingPayment = paymentList?.find(p => p.billId === bill.id && p.status === 'PENDING')

              const subLabel = isPaid && paidPayment
                ? `Paid ${fmtDate(paidPayment.updatedAt ?? paidPayment.createdAt)}`
                : isPending && pendingPayment
                  ? 'Waiting for verification'
                  : isPending
                    ? 'Due soon'
                    : isOverdue
                      ? 'Overdue'
                      : ''

              const total = bill.charges?.reduce((s, c) => s + Number(c.amount), 0) ?? Number(bill.totalAmount ?? 0)

              const handleClick = () => {
                if (isPaid && paidPayment) navigate(`/renter/receipts/${paidPayment.id}`)
              }

              return (
                <div key={bill.id}>
                  {idx > 0 && <div className="border-t border-border" />}
                  <button
                    onClick={handleClick}
                    className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors ${
                      isPaid && paidPayment ? 'hover:bg-surface-muted cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{fmtMonth(bill.billingPeriodStart)}</p>
                      {subLabel && <p className="text-xs text-text-muted mt-0.5">{subLabel}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium text-text">{fmtNPR(total)}</p>
                        <StatusBadge status={bill.status} />
                      </div>
                      {isPaid && paidPayment && <ChevronRight size={16} className="text-text-muted" />}
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </RenterLayout>
  )
}
