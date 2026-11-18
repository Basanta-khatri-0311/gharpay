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

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { user } = useAuth()
  const { isLoading, error, stats, pendingPayments, overdueBills, collectionTrend } = useDashboardStats()

  return (
    <DashboardLayout activeKey="overview">
      <div className="flex flex-col gap-6">

        {/* Error banner */}
        {error && (
          <div className="bg-danger-bg border border-danger/20 text-danger text-[13px] px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent mb-2">
              {formatDate()}
            </p>
            <h1 className="text-[28px] font-bold tracking-tight leading-tight">
              {getGreeting()}, {user?.name ?? 'there'}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Here's how your properties are doing this month.
            </p>
          </div>
          <button
            disabled
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus size={14} strokeWidth={2.5} />
            Create bill
          </button>
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

      </div>
    </DashboardLayout>
  )
}
