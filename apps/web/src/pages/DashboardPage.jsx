import DashboardLayout from '../layouts/DashboardLayout.jsx'

/* ─── Stat cards ──────────────────────────────────────────────────────────── */
const stats = [
  { label: 'Total collected', dot: '#2D6A4F', value: 'NPR 86,500', sub: '12% more than September', subColor: 'text-accent' },
  { label: 'Pending',         dot: '#B45309', value: 'NPR 24,750', sub: '2 payments to verify',    subColor: 'text-text-muted' },
  { label: 'Overdue',         dot: '#C53030', value: 'NPR 8,500',  sub: '1 payment past due',      subColor: 'text-text-muted' },
  { label: 'Properties',      dot: '#4A5568', value: '3',          sub: '18 units · 15 occupied',   subColor: 'text-text-muted' },
]

function StatCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{s.label}</span>
            <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
          </div>
          <p className="text-2xl font-bold tracking-tight leading-none">{s.value}</p>
          <p className={`text-xs ${s.subColor}`}>{s.sub}</p>
        </div>
      ))}
    </div>
  )
}

/* ─── Bar chart (pure CSS) ────────────────────────────────────────────────── */
const chartData = [
  { month: 'May', pct: 57 },
  { month: 'Jun', pct: 72 },
  { month: 'Jul', pct: 63 },
  { month: 'Aug', pct: 68 },
  { month: 'Sep', pct: 80 },
  { month: 'Oct', pct: 95 },
]

function CollectionChart() {
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
      <div className="flex gap-3 h-[200px]">
        <div className="flex flex-col justify-between pb-5">
          <span className="text-[11px] text-text-muted text-right">100k</span>
          <span className="text-[11px] text-text-muted text-right">50k</span>
          <span className="text-[11px] text-text-muted text-right">0</span>
        </div>
        <div className="flex-1 flex items-end gap-3 border-l border-border pl-3">
          {chartData.map((d, i) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full group">
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full rounded-t-md transition-colors ${i === chartData.length - 1 ? 'bg-primary' : 'bg-[#A8C5B5] group-hover:bg-primary'}`}
                  style={{ height: `${d.pct}%` }}
                />
              </div>
              <span className="text-[11px] text-text-muted">{d.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Needs attention ─────────────────────────────────────────────────────── */
const attentionItems = [
  { count: 2, label: 'Payments to verify', sub: 'Submitted today',     bgColor: 'bg-warning-bg', textColor: 'text-warning' },
  { count: 1, label: 'Overdue payment',    sub: '8 days overdue',      bgColor: 'bg-danger-bg',  textColor: 'text-danger' },
  { count: 3, label: 'Draft bills',        sub: 'Not sent to tenants', bgColor: 'bg-border',     textColor: 'text-text-secondary' },
]

function NeedsAttention() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold">Needs attention</p>
        <p className="text-xs text-text-muted mt-0.5">Items requiring an action</p>
      </div>
      <div className="flex flex-col gap-2">
        {attentionItems.map((item) => (
          <button key={item.label} className="flex items-center gap-3 px-4 py-3 bg-surface-muted border border-border rounded-lg cursor-pointer hover:bg-border transition-colors text-left w-full group">
            <span className={`w-7 h-7 rounded-md text-[13px] font-bold flex items-center justify-center shrink-0 ${item.bgColor} ${item.textColor}`}>
              {item.count}
            </span>
            <div className="flex-1 flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-text">{item.label}</span>
              <span className="text-[11px] text-text-muted">{item.sub}</span>
            </div>
            <span className="text-base text-text-muted group-hover:text-text transition-colors">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const now = new Date()
  const day = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()

  return (
    <DashboardLayout activeKey="overview">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-accent mb-2">{day}</p>
            <h1 className="text-[28px] font-bold tracking-tight leading-tight">Good afternoon, Basant</h1>
            <p className="text-sm text-text-secondary mt-1">Here's how your properties are doing this month.</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create bill
          </button>
        </div>

        <StatCards />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          <CollectionChart />
          <NeedsAttention />
        </div>
      </div>
    </DashboardLayout>
  )
}
