import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useDashboardStats } from '../hooks/useDashboardStats.js'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatNPR(amount) {
  if (!amount) return 'NPR 0'
  return 'NPR ' + Number(amount).toLocaleString('en-IN')
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase()
}

function currentMonthLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long' })
}

/* ─── Skeleton block ──────────────────────────────────────────────────────── */

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-border ${className}`} />
}

/* ─── Stat cards ──────────────────────────────────────────────────────────── */

function StatCards({ stats, pendingPayments, overdueBills, isLoading }) {
  const cards = [
    {
      label: 'Total collected',
      dot: '#2D6A4F',
      value: formatNPR(stats.totalCollected),
      sub: currentMonthLabel(),
      subColor: 'text-accent',
    },
    {
      label: 'Pending',
      dot: '#B45309',
      value: formatNPR(stats.pending),
      sub: `${pendingPayments.length} payment${pendingPayments.length === 1 ? '' : 's'} to verify`,
      subColor: 'text-text-muted',
    },
    {
      label: 'Overdue',
      dot: '#C53030',
      value: formatNPR(stats.overdue),
      sub: `${overdueBills.length} bill${overdueBills.length === 1 ? '' : 's'} past due`,
      subColor: 'text-text-muted',
    },
    {
      label: 'Properties',
      dot: '#4A5568',
      value: String(stats.propertiesCount),
      sub: `${stats.unitsCount} units · ${stats.occupiedCount} occupied`,
      subColor: 'text-text-muted',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((s) => (
        <div key={s.label} className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{s.label}</span>
            <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
          </div>
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-3/4 mt-1" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold tracking-tight leading-none">{s.value}</p>
              <p className={`text-xs ${s.subColor}`}>{s.sub}</p>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Bar chart (pure CSS) ────────────────────────────────────────────────── */

function CollectionChart({ collectionTrend, isLoading }) {
  const maxAmount = Math.max(...collectionTrend.map((d) => d.amount), 1)
  const allZero = collectionTrend.every((d) => d.amount === 0)

  // Y-axis labels derived from maxAmount
  const topLabel = maxAmount >= 1000
    ? `${Math.round(maxAmount / 1000)}k`
    : String(maxAmount)
  const midLabel = maxAmount >= 1000
    ? `${Math.round(maxAmount / 2000)}k`
    : String(Math.round(maxAmount / 2))

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">Collection trend</p>
          <p className="text-xs text-text-muted mt-0.5">Paid rent over the last 6 months</p>
        </div>
        <select className="text-xs text-text-secondary border border-border rounded-md px-2.5 py-1.5 bg-surface outline-none cursor-pointer">
          <option>Last 6 months</option>
          <option>Last 3 months</option>
          <option>This year</option>
        </select>
      </div>

      {isLoading ? (
        <div className="h-[200px] flex items-end gap-3 pt-4">
          {[55, 70, 45, 80, 65, 90].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full animate-pulse">
              <div className="flex-1 w-full flex items-end">
                <div className="w-full rounded-t-md bg-border" style={{ height: `${h}%` }} />
              </div>
              <div className="h-3 w-6 rounded bg-border" />
            </div>
          ))}
        </div>
      ) : allZero ? (
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-text-muted">No payment data yet</p>
        </div>
      ) : (
        <div className="flex gap-3 h-[200px]">
          <div className="flex flex-col justify-between pb-5">
            <span className="text-[11px] text-text-muted text-right">{topLabel}</span>
            <span className="text-[11px] text-text-muted text-right">{midLabel}</span>
            <span className="text-[11px] text-text-muted text-right">0</span>
          </div>
          <div className="flex-1 flex items-end gap-3 border-l border-border pl-3">
            {collectionTrend.map((d, i) => {
              const pct = Math.round((d.amount / maxAmount) * 100)
              const isLast = i === collectionTrend.length - 1
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full group">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-colors ${
                        isLast ? 'bg-primary' : 'bg-[#A8C5B5] group-hover:bg-primary'
                      }`}
                      style={{ height: pct > 0 ? `${pct}%` : '2px' }}
                    />
                  </div>
                  <span className="text-[11px] text-text-muted">{d.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Needs attention ─────────────────────────────────────────────────────── */

function NeedsAttention({ pendingPayments, overdueBills, isLoading }) {
  const hasItems = pendingPayments.length > 0 || overdueBills.length > 0

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold">Needs attention</p>
        <p className="text-xs text-text-muted mt-0.5">Items requiring an action</p>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </>
        ) : !hasItems ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-success-bg border border-success/20 rounded-lg">
            <span className="text-success text-base">✓</span>
            <span className="text-[13px] font-medium text-success">All caught up</span>
          </div>
        ) : (
          <>
            {pendingPayments.length > 0 && (
              <Link
                to="/dashboard/payments"
                className="flex items-center gap-3 px-4 py-3 bg-surface-muted border border-border rounded-lg hover:bg-border transition-colors text-left w-full group"
              >
                <span className="w-7 h-7 rounded-md text-[13px] font-bold flex items-center justify-center shrink-0 bg-warning-bg text-warning">
                  {pendingPayments.length}
                </span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-text">Payments to verify</span>
                  <span className="text-[11px] text-text-muted">Submitted by tenants</span>
                </div>
                <span className="text-base text-text-muted group-hover:text-text transition-colors">›</span>
              </Link>
            )}

            {overdueBills.length > 0 && (
              <Link
                to="/dashboard/bills"
                className="flex items-center gap-3 px-4 py-3 bg-surface-muted border border-border rounded-lg hover:bg-border transition-colors text-left w-full group"
              >
                <span className="w-7 h-7 rounded-md text-[13px] font-bold flex items-center justify-center shrink-0 bg-danger-bg text-danger">
                  {overdueBills.length}
                </span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-text">
                    Overdue bill{overdueBills.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-[11px] text-text-muted">Past due date</span>
                </div>
                <span className="text-base text-text-muted group-hover:text-text transition-colors">›</span>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Payment Activity ────────────────────────────────────────────────────── */

function formatBillingMonth(billingMonth) {
  if (!billingMonth) return '—'
  // billingMonth may be an ISO date string like "2024-10-01" or just a label
  const d = new Date(billingMonth)
  if (isNaN(d.getTime())) return billingMonth
  return d.toLocaleDateString('en-US', { month: 'long' }) + ' rent'
}

function formatPaymentDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STATUS_MAP = {
  VERIFIED: { label: 'Paid', className: 'bg-success-bg text-success' },
  PENDING:  { label: 'Pending', className: 'bg-warning-bg text-warning' },
  REJECTED: { label: 'Rejected', className: 'bg-danger-bg text-danger' },
}

function PaymentActivity({ recentPayments, isLoading }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4">
        <div>
          <p className="text-sm font-semibold">Payment activity</p>
          <p className="text-xs text-text-muted mt-0.5">Recent rent and utility payment updates</p>
        </div>
        <Link
          to="/dashboard/payments"
          className="text-xs text-accent font-medium hover:underline whitespace-nowrap flex items-center gap-1 mt-0.5"
        >
          View all →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-muted">
              {['Tenant', 'Property', 'Bill', 'Amount', 'Status', 'Date', ''].map((col) => (
                <th
                  key={col}
                  className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted px-5 py-3 first:pl-6 last:pr-6"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <tr key={i} className="border-t border-border animate-pulse">
                  {[0, 1, 2, 3, 4, 5, 6].map((j) => (
                    <td key={j} className="px-5 py-4 first:pl-6 last:pr-6">
                      <div className="h-3 rounded bg-border w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : recentPayments.length === 0 ? (
              <tr className="border-t border-border">
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-text-muted">
                  No payment activity yet
                </td>
              </tr>
            ) : (
              recentPayments.map((pmt) => {
                const tenantName  = pmt.bill?.tenancy?.renter?.name ?? '—'
                const propName    = pmt.bill?.tenancy?.unit?.property?.name ?? ''
                const unitName    = pmt.bill?.tenancy?.unit?.name ?? ''
                const property    = propName && unitName ? `${propName} · ${unitName}` : propName || unitName || '—'
                const bill        = formatBillingMonth(pmt.bill?.billingMonth)
                const amount      = formatNPR(pmt.amount)
                const statusInfo  = STATUS_MAP[pmt.status] ?? { label: pmt.status, className: 'bg-border text-text-muted' }
                const date        = formatPaymentDate(pmt.submittedAt || pmt.bill?.dueDate)

                return (
                  <tr key={pmt.id} className="border-t border-border hover:bg-surface-muted/40 transition-colors">
                    <td className="px-5 py-3.5 pl-6 font-medium text-text">{tenantName}</td>
                    <td className="px-5 py-3.5 text-text-secondary">{property}</td>
                    <td className="px-5 py-3.5 text-text-secondary">{bill}</td>
                    <td className="px-5 py-3.5 font-medium text-text">{amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-text-muted">{date}</td>
                    <td className="px-5 py-3.5 pr-6">
                      <button
                        className="text-text-muted hover:text-text transition-colors px-1 rounded"
                        aria-label="More options"
                      >
                        ···
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { user } = useAuth()
  const { isLoading, error, stats, pendingPayments, overdueBills, collectionTrend, recentPayments } = useDashboardStats()

  return (
    <DashboardLayout activeKey="overview">
      <div className="flex flex-col gap-5 p-4 md:p-8">

        {/* Error banner */}
        {error && (
          <div className="bg-danger-bg border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent mb-2">
              {formatDate()}
            </p>
            <h1 className="text-2xl md:text-[28px] font-bold tracking-tight leading-tight">
              {getGreeting()}, {user?.name ?? 'there'}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Here's how your properties are doing this month.
            </p>
          </div>
          <Link
            to="/dashboard/bills"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors self-start shrink-0"
          >
            <Plus size={14} strokeWidth={2.5} />
            Create bill
          </Link>
        </div>

        {/* Stat cards */}
        <StatCards
          stats={stats}
          pendingPayments={pendingPayments}
          overdueBills={overdueBills}
          isLoading={isLoading}
        />

        {/* Chart + Attention panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          <CollectionChart collectionTrend={collectionTrend} isLoading={isLoading} />
          <NeedsAttention
            pendingPayments={pendingPayments}
            overdueBills={overdueBills}
            isLoading={isLoading}
          />
        </div>

        {/* Payment activity */}
        <PaymentActivity recentPayments={recentPayments} isLoading={isLoading} />

      </div>
    </DashboardLayout>
  )
}
