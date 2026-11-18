import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { tenancies, bills } from '../lib/api.js'

function formatNPR(amount) {
  if (!amount && amount !== 0) return 'NPR 0'
  return 'NPR ' + Number(amount).toLocaleString('en-IN')
}

function formatBillingMonth(year, month) {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

function formatBillStatus(status) {
  const map = {
    DRAFT: { label: 'Draft', cls: 'bg-surface-muted text-text-muted border-border' },
    SENT: { label: 'Sent', cls: 'bg-primary-light text-primary border-primary/20' },
    PAID: { label: 'Paid', cls: 'bg-success-bg text-success border-success/20' },
    OVERDUE: { label: 'Overdue', cls: 'bg-danger-bg text-danger border-danger/20' },
  }
  return map[status] || { label: status, cls: 'bg-surface-muted text-text-muted border-border' }
}

const DEFAULT_CHARGES = [
  { id: 1, description: 'Rent', type: 'RENT', amount: '', canRemove: false },
  { id: 2, description: 'Electricity', type: 'ELECTRICITY', amount: '', canRemove: true },
  { id: 3, description: 'Water', type: 'WATER', amount: '', canRemove: true },
  { id: 4, description: 'Internet', type: 'INTERNET', amount: '', canRemove: true },
  { id: 5, description: 'Other', type: 'OTHER', amount: '0', canRemove: true },
]

function getBillingMonthOptions() {
  const now = new Date()
  const options = []
  for (let i = -3; i <= 1; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    options.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    })
  }
  return options
}

export default function BillsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('create') // 'create' | 'all'

  // ── Form state ──────────────────────────────────────────────────────────────
  const billingMonthOptions = useMemo(getBillingMonthOptions, [])
  const currentMonthValue = billingMonthOptions[3].value // index 3 = current

  const [tenancyId, setTenancyId] = useState('')
  const [billingMonthVal, setBillingMonthVal] = useState(currentMonthValue)
  const [dueDate, setDueDate] = useState(() => {
    const [y, m] = currentMonthValue.split('-')
    return `${y}-${m}-01`
  })
  const [charges, setCharges] = useState(DEFAULT_CHARGES.map((c) => ({ ...c })))
  const [nextChargeId, setNextChargeId] = useState(100)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  // ── API data ────────────────────────────────────────────────────────────────
  const { data: tenanciesData, isLoading: tenanciesLoading } = useQuery({
    queryKey: ['tenancies'],
    queryFn: async () => {
      const res = await tenancies.list()
      return Array.isArray(res) ? res : res?.tenancies || []
    },
  })
  const tenancyList = tenanciesData || []

  const { data: billsData, isLoading: billsLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const res = await bills.list()
      return Array.isArray(res) ? res : res?.bills || []
    },
    enabled: activeTab === 'all',
  })
  const billList = billsData || []

  // ── Selected tenancy ────────────────────────────────────────────────────────
  const selectedTenancy = useMemo(
    () => tenancyList.find((t) => t.id === tenancyId) || null,
    [tenancyList, tenancyId]
  )

  // When tenant changes, pre-fill rent
  function handleTenancyChange(id) {
    setTenancyId(id)
    const t = tenancyList.find((t) => t.id === id)
    if (t?.unit?.monthlyRent) {
      setCharges((prev) =>
        prev.map((c) => (c.description === 'Rent' ? { ...c, amount: String(t.unit.monthlyRent) } : c))
      )
    }
  }

  // When billing month changes, update due date to 1st of that month
  function handleBillingMonthChange(val) {
    setBillingMonthVal(val)
    const [y, m] = val.split('-')
    setDueDate(`${y}-${m}-01`)
  }

  // ── Charges helpers ─────────────────────────────────────────────────────────
  function updateCharge(id, field, value) {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  function removeCharge(id) {
    setCharges((prev) => prev.filter((c) => c.id !== id))
  }

  function addCharge() {
    setCharges((prev) => [
      ...prev,
      { id: nextChargeId, description: '', type: 'OTHER', amount: '', canRemove: true },
    ])
    setNextChargeId((n) => n + 1)
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const total = useMemo(
    () => charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
    [charges]
  )

  const selectedMonthOption = billingMonthOptions.find((o) => o.value === billingMonthVal) || billingMonthOptions[3]

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createBillMutation = useMutation({
    mutationFn: (body) => bills.create(body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setSuccessMsg(variables._draft ? 'Bill saved as draft.' : 'Bill created successfully!')
      setErrorMsg(null)
      resetForm()
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to create bill.')
      setSuccessMsg(null)
    },
  })

  function resetForm() {
    setTenancyId('')
    setBillingMonthVal(currentMonthValue)
    const [y, m] = currentMonthValue.split('-')
    setDueDate(`${y}-${m}-01`)
    setCharges(DEFAULT_CHARGES.map((c) => ({ ...c })))
  }

  function buildPayload(isDraft = false) {
    const [y, m] = billingMonthVal.split('-')

    // Map UI display type to schema enum
    const typeToEnum = {
      'Rent': 'RENT',
      'Electricity': 'ELECTRICITY',
      'Water': 'WATER',
      'Internet': 'INTERNET',
    }

    return {
      tenancyId,
      billingMonth: `${y}-${String(m).padStart(2, '0')}-01T00:00:00Z`,
      dueDate: `${dueDate}T00:00:00Z`,
      items: charges
        .filter((c) => c.description && parseFloat(c.amount) > 0)
        .map((c) => ({
          type: typeToEnum[c.description] ?? 'OTHER',
          description: c.description,
          amount: String(parseFloat(c.amount).toFixed(2)),
        })),
      _draft: isDraft,
    }
  }

  function handleCreate(e) {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)
    if (!tenancyId) { setErrorMsg('Please select a tenant.'); return }
    createBillMutation.mutate(buildPayload(false))
  }

  function handleDraft(e) {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)
    if (!tenancyId) { setErrorMsg('Please select a tenant.'); return }
    createBillMutation.mutate(buildPayload(true))
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout activeKey="bills">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-1">Billing</p>
          <h1 className="text-2xl font-bold text-text">Bills</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-surface-muted rounded-xl border border-border w-fit">
          {[
            { key: 'create', label: 'Create bill' },
            { key: 'all', label: 'All bills' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-surface text-text shadow-sm border border-border'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CREATE TAB ── */}
        {activeTab === 'create' && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left — form */}
            <div className="flex-1 min-w-0">
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-text mb-1">Create monthly bill</h2>
                <p className="text-sm text-text-muted mb-6">
                  Add variable charges and review recurring charges before sending.
                </p>

                {/* Feedback */}
                {successMsg && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-success-bg text-success rounded-xl border border-success/20 mb-5 text-sm">
                    <CheckCircle2 size={16} />
                    {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-danger-bg text-danger rounded-xl border border-danger/20 mb-5 text-sm">
                    <AlertCircle size={16} />
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleCreate}>
                  {/* Bill details */}
                  <div className="mb-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-3">Bill details</p>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Tenant */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text-secondary">Tenant</label>
                        <select
                          value={tenancyId}
                          onChange={(e) => handleTenancyChange(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        >
                          <option value="">Select tenant…</option>
                          {tenanciesLoading && <option disabled>Loading…</option>}
                          {tenancyList.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.renter?.name || t.renter?.email || 'Unknown'} — {t.unit?.name || 'Unknown unit'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Billing period */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text-secondary">Billing period</label>
                        <select
                          value={billingMonthVal}
                          onChange={(e) => handleBillingMonthChange(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        >
                          {billingMonthOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Due date */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text-secondary">Due date</label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Charges */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Charges</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          Recurring charges are added automatically each month.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addCharge}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary-light hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Plus size={13} />
                        Add charge
                      </button>
                    </div>

                    {/* Table header */}
                    <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 pb-2 border-b border-border">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Description</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Type</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Amount</span>
                      <span className="w-6"></span>
                    </div>

                    {/* Charge rows */}
                    <div className="divide-y divide-border">
                      {charges.map((charge) => (
                        <div
                          key={charge.id}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-3 items-center py-2.5 px-3"
                        >
                          <input
                            type="text"
                            value={charge.description}
                            onChange={(e) => updateCharge(charge.id, 'description', e.target.value)}
                            placeholder="Description"
                            className="text-sm text-text bg-transparent outline-none focus:bg-surface-muted rounded px-1.5 py-0.5 transition-colors placeholder:text-text-muted"
                          />
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                charge.type === 'RECURRING'
                                  ? 'bg-primary-light text-primary'
                                  : 'bg-warning-bg text-warning'
                              }`}
                            >
                              {charge.type === 'RECURRING' ? 'Recurring' : 'Variable'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateCharge(
                                  charge.id,
                                  'type',
                                  charge.type === 'RECURRING' ? 'VARIABLE' : 'RECURRING'
                                )
                              }
                              className="text-[10px] text-text-muted hover:text-text transition-colors"
                              title="Toggle type"
                            >
                              ↕
                            </button>
                          </div>
                          <div className="flex items-center gap-1 border border-border rounded-lg px-2 py-1 bg-surface-muted focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                            <span className="text-xs text-text-muted font-medium">NPR</span>
                            <input
                              type="number"
                              min="0"
                              value={charge.amount}
                              onChange={(e) => updateCharge(charge.id, 'amount', e.target.value)}
                              className="w-24 text-sm text-text bg-transparent outline-none text-right"
                              placeholder="0"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCharge(charge.id)}
                            disabled={!charge.canRemove}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:text-danger hover:bg-danger-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Remove charge"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={handleDraft}
                      disabled={createBillMutation.isPending}
                      className="px-5 py-2.5 text-sm font-semibold text-text-secondary bg-surface-muted hover:bg-border border border-border rounded-xl transition-colors disabled:opacity-60"
                    >
                      Save as draft
                    </button>
                    <button
                      type="submit"
                      disabled={createBillMutation.isPending}
                      className="px-6 py-2.5 text-sm font-semibold bg-primary text-white hover:bg-primary-hover rounded-xl transition-colors disabled:opacity-60"
                    >
                      {createBillMutation.isPending ? 'Creating…' : 'Create bill'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right — Bill Summary */}
            <div className="w-72 shrink-0">
              <div className="bg-surface border border-border rounded-2xl p-5 sticky top-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-4">Bill Summary</p>

                <p className="text-base font-semibold text-text">{selectedMonthOption.label}</p>
                {selectedTenancy ? (
                  <p className="text-sm text-text-secondary mt-0.5 mb-5">
                    {selectedTenancy.renter?.name || selectedTenancy.renter?.email} — {selectedTenancy.unit?.name}
                  </p>
                ) : (
                  <p className="text-sm text-text-muted mt-0.5 mb-5 italic">No tenant selected</p>
                )}

                {/* Line items */}
                <div className="space-y-2.5 mb-4">
                  {charges
                    .filter((c) => c.description && (parseFloat(c.amount) || 0) > 0)
                    .map((c) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">{c.description}</span>
                        <span className="text-sm text-text font-medium">{formatNPR(c.amount)}</span>
                      </div>
                    ))}
                  {charges.filter((c) => c.description && (parseFloat(c.amount) || 0) > 0).length === 0 && (
                    <p className="text-xs text-text-muted italic">No charges added yet</p>
                  )}
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-text">Total due</span>
                    <span className="text-base font-bold text-text">{formatNPR(total)}</span>
                  </div>
                  {dueDate && (
                    <p className="text-xs text-text-muted text-right">
                      Due{' '}
                      {new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ALL BILLS TAB ── */}
        {activeTab === 'all' && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-text">All bills</h2>
            </div>

            {billsLoading ? (
              <div className="p-8">
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-surface-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ) : billList.length === 0 ? (
              <div className="p-12 text-center text-text-muted text-sm">No bills found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted">
                      <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Tenant
                      </th>
                      <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Property
                      </th>
                      <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Billing month
                      </th>
                      <th className="text-right px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Amount
                      </th>
                      <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Status
                      </th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {billList.map((bill) => {
                      const status = formatBillStatus(bill.status)
                      const billingMonth = bill.billingMonth
                        ? new Date(bill.billingMonth).toLocaleString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : '—'
                      return (
                        <tr key={bill.id} className="hover:bg-surface-muted transition-colors">
                          <td className="px-6 py-3.5 text-text font-medium">
                            {bill.tenancy?.renter?.name || bill.tenancy?.renter?.email || '—'}
                          </td>
                          <td className="px-6 py-3.5 text-text-secondary">
                            {bill.tenancy?.unit?.property?.name || '—'}
                            {bill.tenancy?.unit?.name ? ` · ${bill.tenancy.unit.name}` : ''}
                          </td>
                          <td className="px-6 py-3.5 text-text-secondary">{billingMonth}</td>
                          <td className="px-6 py-3.5 text-text font-medium text-right">
                            {formatNPR(bill.totalAmount)}
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${status.cls}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {bill.status === 'DRAFT' && (
                              <button
                                onClick={() => bills.send(bill.id).then(() => queryClient.invalidateQueries({ queryKey: ['bills'] }))}
                                className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                              >
                                Send
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
