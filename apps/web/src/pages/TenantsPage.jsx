import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserPlus,
  AlertCircle,
  ChevronRight,
  X,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { tenancies, bills, invitations, properties } from '../lib/api.js'

function formatNPR(amount) {
  if (amount == null || amount === '') return '—'
  const num = Number(amount)
  if (isNaN(num)) return '—'
  return 'NPR ' + num.toLocaleString('en-IN')
}

function formatBillingMonth(billingMonth) {
  if (!billingMonth) return '—'
  // billingMonth may be "2026-10" or a date string
  const date = new Date(billingMonth + (billingMonth.length === 7 ? '-01' : ''))
  if (isNaN(date.getTime())) return billingMonth
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatShortDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name) {
  if (!name) return 'TN'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function StatusBadge({ status }) {
  if (!status) return null
  if (status === 'PENDING') {
    return (
      <span className="text-xs font-semibold text-warning border border-warning/40 rounded-full px-3 py-0.5">
        Pending
      </span>
    )
  }
  if (status === 'PAID') {
    return (
      <span className="text-xs font-semibold text-success border border-success/30 rounded-full px-3 py-0.5">
        Paid
      </span>
    )
  }
  if (status === 'OVERDUE') {
    return (
      <span className="text-xs font-semibold text-danger border border-danger/30 rounded-full px-3 py-0.5">
        Overdue
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold text-text-muted border border-border rounded-full px-3 py-0.5">
      {status}
    </span>
  )
}

export default function TenantsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialUnitId = searchParams.get('unitId') || ''
  const queryClient = useQueryClient()

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(!!initialUnitId)
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteResult, setInviteResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [formError, setFormError] = useState(null)

  // Fetch properties (for invite modal)
  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await properties.list()
      return Array.isArray(res) ? res : res?.properties || []
    },
  })
  const propertyList = propertiesData || []

  // Fetch tenancies
  const {
    data: tenanciesData,
    isLoading: tenanciesLoading,
    error: tenanciesError,
  } = useQuery({
    queryKey: ['tenancies'],
    queryFn: async () => {
      const res = await tenancies.list()
      return Array.isArray(res) ? res : res?.tenancies || []
    },
  })
  const tenancyList = tenanciesData || []

  // Fetch bills (all)
  const { data: billsData } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const res = await bills.list()
      return Array.isArray(res) ? res : res?.bills || []
    },
  })
  const billList = billsData || []

  // Property detail for unit selection in invite modal
  const { data: propertyDetailData } = useQuery({
    queryKey: ['property', selectedPropertyId],
    queryFn: async () => {
      if (!selectedPropertyId) return null
      const res = await properties.get(selectedPropertyId)
      return res?.property || res
    },
    enabled: !!selectedPropertyId,
  })

  const vacantUnits = useMemo(() => {
    if (!propertyDetailData?.units) return []
    return propertyDetailData.units.filter((u) => u.status === 'VACANT')
  }, [propertyDetailData])

  // Group bills by tenancyId, sorted by billingMonth desc
  const billsByTenancy = useMemo(() => {
    const map = {}
    for (const bill of billList) {
      const tid = bill.tenancyId
      if (!tid) continue
      if (!map[tid]) map[tid] = []
      map[tid].push(bill)
    }
    // Sort each group descending by billingMonth
    for (const tid of Object.keys(map)) {
      map[tid].sort((a, b) => {
        const aStr = a.billingMonth || ''
        const bStr = b.billingMonth || ''
        return bStr.localeCompare(aStr)
      })
    }
    return map
  }, [billList])

  // Invite mutations
  const sendInviteMutation = useMutation({
    mutationFn: (body) => invitations.send(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      setInviteResult(data)
      setFormError(null)
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to send invitation')
    },
  })

  const openInviteModal = () => {
    setInviteResult(null)
    setInviteEmail('')
    setFormError(null)
    setSelectedPropertyId('')
    setSelectedUnitId('')
    setInviteModalOpen(true)
  }

  const closeInviteModal = () => {
    setInviteModalOpen(false)
    setInviteResult(null)
    setInviteEmail('')
    setFormError(null)
  }

  const handleSendInvite = (e) => {
    e.preventDefault()
    setFormError(null)
    if (!selectedUnitId) {
      setFormError('Please select a unit to lease')
      return
    }
    if (!inviteEmail.trim()) {
      setFormError('Please enter a valid email address')
      return
    }
    sendInviteMutation.mutate({
      unitId: selectedUnitId,
      email: inviteEmail.trim(),
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBillRowClick = (bill) => {
    if (bill.status === 'PAID' && bill.receiptId) {
      navigate(`/dashboard/receipts/${bill.receiptId}`)
    } else {
      navigate('/dashboard/payments')
    }
  }

  return (
    <DashboardLayout activeKey="tenants">

      <div className="flex flex-col gap-6 max-w-3xl p-4 md:p-8">
        {/* Header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">People</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">Tenants</h1>
              <p className="text-sm text-text-secondary mt-1">
                Rental details, balances, and payment history.
              </p>
            </div>
            <button
              onClick={openInviteModal}
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm shrink-0"
            >
              <UserPlus size={15} strokeWidth={2.5} />
              Add tenant
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {tenanciesError && (
          <div className="flex items-center gap-2 p-4 bg-danger-bg border border-danger/20 rounded-xl text-danger text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{tenanciesError?.message || 'Failed to load tenants'}</span>
          </div>
        )}

        {/* Loading skeletons */}
        {tenanciesLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-2xl p-6 animate-pulse">
                <div className="h-5 w-48 bg-surface-muted rounded mb-4" />
                <div className="h-14 bg-surface-muted rounded-xl mb-4" />
                <div className="h-32 bg-surface-muted rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!tenanciesLoading && tenancyList.length === 0 && (
          <div className="bg-surface border border-dashed border-border rounded-2xl p-14 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus size={22} />
            </div>
            <h3 className="text-base font-semibold text-text">No tenants yet</h3>
            <p className="text-sm text-text-muted max-w-xs">
              Invite a renter to a vacant unit to get started. Once they accept, their tenancy and
              bills will appear here.
            </p>
            <button
              onClick={openInviteModal}
              className="mt-2 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <UserPlus size={15} strokeWidth={2.5} />
              Add tenant
            </button>
          </div>
        )}

        {/* Tenant cards */}
        {!tenanciesLoading &&
          tenancyList.map((tenancy) => {
            const tenantBills = billsByTenancy[tenancy.id] || []
            const mostRecentBill = tenantBills[0] || null

            // Current balance: sum of PENDING + OVERDUE bills
            const currentBalance = tenantBills
              .filter((b) => b.status === 'PENDING' || b.status === 'OVERDUE')
              .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0)

            // Utility amounts from most recent bill's items
            let electricityLabel = '—'
            let waterLabel = '—'
            let internetLabel = '—'

            if (mostRecentBill?.items && Array.isArray(mostRecentBill.items)) {
              for (const item of mostRecentBill.items) {
                const name = (item.name || item.description || '').toLowerCase()
                if (name.includes('electric')) {
                  electricityLabel =
                    item.type === 'VARIABLE' || item.amount == null
                      ? 'Variable'
                      : formatNPR(item.amount)
                } else if (name.includes('water')) {
                  waterLabel = formatNPR(item.amount)
                } else if (name.includes('internet')) {
                  internetLabel = formatNPR(item.amount)
                }
              }
            }

            const latestBillStatus = mostRecentBill?.status || null

            return (
              <div
                key={tenancy.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden"
              >
                {/* Card header: avatar, name, unit, status badge */}
                <div className="p-6 pb-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center text-base font-bold shrink-0">
                      {getInitials(tenancy.renter?.name)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-text">
                        {tenancy.renter?.name || 'Unnamed Renter'}
                      </h2>
                      <p className="text-sm text-text-muted mt-0.5">
                        {tenancy.unit?.name}
                        {tenancy.unit?.property?.name
                          ? ` · ${tenancy.unit.property.name}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    <StatusBadge status={latestBillStatus} />
                  </div>
                </div>

                {/* Metrics row */}
                <div className="mx-6 mb-5 border border-border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-5 divide-x divide-border">
                    <MetricCell label="Monthly rent" value={formatNPR(tenancy.unit?.monthlyRent)} />
                    <MetricCell label="Electricity" value={electricityLabel} />
                    <MetricCell label="Water" value={waterLabel} />
                    <MetricCell label="Internet" value={internetLabel} />
                    <MetricCell
                      label="Current balance"
                      value={currentBalance > 0 ? formatNPR(currentBalance) : '—'}
                      valueClassName={currentBalance > 0 ? 'text-danger font-bold' : ''}
                    />
                  </div>
                </div>

                {/* Payment history */}
                <div className="border-t border-border">
                  <div className="px-6 pt-5 pb-2">
                    <h3 className="text-sm font-bold text-text">Payment history</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Verified and outstanding payments for this tenancy.
                    </p>
                  </div>

                  {tenantBills.length === 0 ? (
                    <div className="px-6 pb-6 pt-2 text-xs text-text-muted">
                      No bills found for this tenancy yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {tenantBills.map((bill) => {
                        const isPaid = bill.status === 'PAID'
                        const isPending = bill.status === 'PENDING'
                        const isOverdue = bill.status === 'OVERDUE'

                        // Sub-label: "Due Oct 1" or "Paid Sep 4"
                        let subLabel = ''
                        if (isPaid && bill.paidAt) {
                          subLabel = `Paid ${formatShortDate(bill.paidAt)}`
                        } else if ((isPending || isOverdue) && bill.dueDate) {
                          subLabel = `Due ${formatShortDate(bill.dueDate)}`
                        }

                        return (
                          <button
                            key={bill.id}
                            onClick={() => handleBillRowClick(bill)}
                            className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-surface-muted/60 transition-colors text-left"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-text">
                                {formatBillingMonth(bill.billingMonth)}
                              </span>
                              {subLabel && (
                                <span className="text-xs text-text-muted mt-0.5">{subLabel}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-semibold text-text">
                                {formatNPR(bill.totalAmount)}
                              </span>
                              <StatusBadge status={bill.status} />
                              <ChevronRight size={16} className="text-text-muted" />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-lg font-bold text-text">Invite a Tenant</h2>
              <button
                onClick={closeInviteModal}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {inviteResult ? (
              <div className="mt-4 flex flex-col gap-4">
                <div className="p-4 bg-success-bg border border-success/20 rounded-xl flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-success shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-success text-sm">Invitation Sent!</p>
                    <p className="text-text-secondary mt-1">
                      An invitation has been created for{' '}
                      <b>{inviteResult.invitation?.email}</b>.
                    </p>
                  </div>
                </div>

                {inviteResult.devToken && (
                  <div className="bg-surface-muted border border-border rounded-xl p-3 flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                      Development Direct Link
                    </span>
                    <p className="text-[11px] text-text-secondary">
                      Because email sending is in test mode, you can share or test this token
                      directly:
                    </p>
                    <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-2">
                      <code className="text-xs text-text font-mono truncate flex-1">
                        {inviteResult.devToken}
                      </code>
                      <button
                        onClick={() => copyToClipboard(inviteResult.devToken)}
                        className="px-2 py-1 rounded-md text-xs font-semibold bg-primary text-white hover:bg-primary-hover flex items-center gap-1 shrink-0"
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={closeInviteModal}
                  className="w-full mt-2 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="mt-4 flex flex-col gap-4">
                {formError && (
                  <div className="p-3 bg-danger-bg border border-danger/20 rounded-lg text-danger text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Select Property */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    1. Select Property
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => {
                      setSelectedPropertyId(e.target.value)
                      setSelectedUnitId('')
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    required
                  >
                    <option value="">-- Choose a property --</option>
                    {propertyList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Unit */}
                {selectedPropertyId && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-secondary">
                      2. Select Vacant Unit
                    </label>
                    {vacantUnits.length === 0 ? (
                      <p className="text-xs text-warning bg-warning-bg p-2.5 rounded-lg border border-warning/20">
                        All units in this property are currently occupied or none have been added
                        yet.
                      </p>
                    ) : (
                      <select
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-xs text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        required
                      >
                        <option value="">-- Choose a vacant unit --</option>
                        {vacantUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.type} · {formatNPR(u.monthlyRent)}/mo)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Renter Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    3. Renter's Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="renter@example.com"
                    className="w-full px-3.5 py-2 border border-border rounded-lg text-xs text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-muted"
                    required
                  />
                  <span className="text-[11px] text-text-muted">
                    They will receive an invitation token valid for 7 days to join GharPay.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text hover:bg-surface-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendInviteMutation.isPending || !selectedUnitId}
                    className="px-5 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sendInviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function MetricCell({ label, value, valueClassName = '' }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span className={`text-sm font-semibold text-text ${valueClassName}`}>{value}</span>
    </div>
  )
}
