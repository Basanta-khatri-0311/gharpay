import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Home,
  Calendar,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Copy,
  Check,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { tenancies, invitations, properties } from '../lib/api.js'

function formatNPR(amount) {
  if (!amount) return 'NPR 0'
  return 'NPR ' + Number(amount).toLocaleString('en-IN')
}

export default function TenantsPage() {
  const [searchParams] = useSearchParams()
  const initialUnitId = searchParams.get('unitId') || ''

  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('tenancies') // 'tenancies' | 'invitations'
  const [search, setSearch] = useState('')

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(!!initialUnitId)
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteResult, setInviteResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [formError, setFormError] = useState(null)

  // Fetch all properties to populate unit selectors
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

  // Fetch invitations
  const {
    data: invitationsData,
    isLoading: invitationsLoading,
    error: invitationsError,
  } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const res = await invitations.list()
      return Array.isArray(res) ? res : res?.invitations || []
    },
  })
  const invitationList = invitationsData || []

  // When property is selected in invite modal, find units
  const { data: propertyDetailData } = useQuery({
    queryKey: ['property', selectedPropertyId],
    queryFn: async () => {
      if (!selectedPropertyId) return null
      const res = await properties.get(selectedPropertyId)
      return res?.property || res
    },
    enabled: !!selectedPropertyId,
  })

  // Vacant units for selected property
  const vacantUnits = useMemo(() => {
    if (!propertyDetailData?.units) return []
    return propertyDetailData.units.filter((u) => u.status === 'VACANT')
  }, [propertyDetailData])

  // End tenancy mutation
  const endTenancyMutation = useMutation({
    mutationFn: (tenancyId) => tenancies.end(tenancyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancies'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['property'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  // Cancel invitation mutation
  const cancelInviteMutation = useMutation({
    mutationFn: (id) => invitations.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })

  // Send invitation mutation
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

  // Filter tenancies
  const filteredTenancies = useMemo(() => {
    if (!search.trim()) return tenancyList
    const q = search.toLowerCase()
    return tenancyList.filter(
      (t) =>
        t.renter?.name?.toLowerCase().includes(q) ||
        t.renter?.email?.toLowerCase().includes(q) ||
        t.unit?.name?.toLowerCase().includes(q) ||
        t.unit?.property?.name?.toLowerCase().includes(q)
    )
  }, [tenancyList, search])

  // Filter invitations
  const filteredInvitations = useMemo(() => {
    if (!search.trim()) return invitationList
    const q = search.toLowerCase()
    return invitationList.filter(
      (inv) =>
        inv.email?.toLowerCase().includes(q) ||
        inv.unit?.name?.toLowerCase().includes(q) ||
        inv.unit?.property?.name?.toLowerCase().includes(q)
    )
  }, [invitationList, search])

  const pendingInvitesCount = invitationList.filter((i) => i.status === 'PENDING').length

  return (
    <DashboardLayout activeKey="tenants">
      <div className="flex flex-col gap-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Tenants & Leases</h1>
            <p className="text-sm text-text-secondary mt-1">
              Onboard renters, monitor active tenancies, and issue leases.
            </p>
          </div>
          <button
            onClick={openInviteModal}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm self-start sm:self-auto"
          >
            <UserPlus size={16} strokeWidth={2.5} />
            Invite Tenant
          </button>
        </div>

        {/* Global Error Banner */}
        {(tenanciesError || invitationsError) && (
          <div className="flex items-center gap-2 p-4 bg-danger-bg border border-danger/20 rounded-xl text-danger text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{tenanciesError?.message || invitationsError?.message || 'Failed to load data'}</span>
          </div>
        )}

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-xl border border-border self-start">
            <button
              onClick={() => setActiveTab('tenancies')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tenancies'
                  ? 'bg-surface text-text shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Active Leases ({tenancyList.length})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'invitations'
                  ? 'bg-surface text-text shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Invitations ({invitationList.length})
              {pendingInvitesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-warning text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingInvitesCount}
                </span>
              )}
            </button>
          </div>

          <div className="relative max-w-sm w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tenant name, email, unit..."
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        {/* Tab 1: Tenancies */}
        {activeTab === 'tenancies' && (
          <div>
            {tenanciesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-surface border border-border rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : tenancyList.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center">
                  <Users size={24} />
                </div>
                <h3 className="text-base font-semibold text-text">No active tenancies</h3>
                <p className="text-sm text-text-muted max-w-sm">
                  Send an invitation to a renter to connect them to a unit. Once accepted, their lease will show here.
                </p>
                <button
                  onClick={openInviteModal}
                  className="mt-2 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  <UserPlus size={16} strokeWidth={2.5} />
                  Invite a Tenant
                </button>
              </div>
            ) : filteredTenancies.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center text-xs text-text-muted">
                No leases match your search "{search}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTenancies.map((tenancy) => {
                  const isActive = tenancy.active
                  const startDateStr = tenancy.startDate
                    ? new Date(tenancy.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'

                  return (
                    <div
                      key={tenancy.id}
                      className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-border-dark transition-all shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {tenancy.renter?.name ? tenancy.renter.name.slice(0, 2).toUpperCase() : 'TN'}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-text">
                              {tenancy.renter?.name || 'Unnamed Renter'}
                            </h3>
                            <div className="flex flex-col gap-0.5 mt-1 text-xs text-text-muted">
                              <span className="flex items-center gap-1.5">
                                <Mail size={12} className="shrink-0" />
                                {tenancy.renter?.email}
                              </span>
                              {tenancy.renter?.phone && (
                                <span className="flex items-center gap-1.5">
                                  <Phone size={12} className="shrink-0" />
                                  {tenancy.renter.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-success-bg text-success'
                              : 'bg-surface-muted text-text-muted'
                          }`}
                        >
                          {isActive ? 'Active Lease' : 'Ended'}
                        </span>
                      </div>

                      {/* Property & Rent info */}
                      <div className="bg-surface-muted rounded-xl p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Home size={14} className="text-text-muted" />
                          <div>
                            <span className="font-semibold text-text block">
                              {tenancy.unit?.name}
                            </span>
                            <span className="text-[11px] text-text-muted">
                              {tenancy.unit?.property?.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-accent block">
                            {formatNPR(tenancy.unit?.monthlyRent)}
                          </span>
                          <span className="text-[11px] text-text-muted">/ month</span>
                        </div>
                      </div>

                      {/* Dates and Actions */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-text-muted flex items-center gap-1">
                          <Calendar size={12} />
                          Since {startDateStr}
                        </span>

                        {isActive && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to end this tenancy? The unit will be marked as vacant.')) {
                                endTenancyMutation.mutate(tenancy.id)
                              }
                            }}
                            disabled={endTenancyMutation.isPending}
                            className="text-danger hover:underline font-semibold"
                          >
                            End Tenancy
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Invitations */}
        {activeTab === 'invitations' && (
          <div>
            {invitationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-surface border border-border rounded-xl animate-pulse" />
                ))}
              </div>
            ) : invitationList.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-muted text-text-muted flex items-center justify-center">
                  <Mail size={22} />
                </div>
                <h3 className="text-base font-semibold text-text">No invitations sent yet</h3>
                <p className="text-sm text-text-muted max-w-sm">
                  Send an email invite to onboard renters to vacant units.
                </p>
                <button
                  onClick={openInviteModal}
                  className="mt-2 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
                >
                  <UserPlus size={16} strokeWidth={2.5} />
                  Send Invitation
                </button>
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-8 text-center text-xs text-text-muted">
                No invitations match your search "{search}".
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface-muted text-text-muted font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Recipient Email</th>
                        <th className="py-3 px-4">Unit & Property</th>
                        <th className="py-3 px-4">Sent Date</th>
                        <th className="py-3 px-4">Expires</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInvitations.map((inv) => {
                        const statusColors = {
                          PENDING: 'bg-warning-bg text-warning',
                          ACCEPTED: 'bg-success-bg text-success',
                          EXPIRED: 'bg-danger-bg text-danger',
                          CANCELLED: 'bg-surface-muted text-text-muted',
                        }
                        return (
                          <tr key={inv.id} className="hover:bg-surface-muted/50 transition-colors">
                            <td className="py-3.5 px-4 font-medium text-text">
                              {inv.email}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-text block">
                                {inv.unit?.name}
                              </span>
                              <span className="text-[11px] text-text-muted">
                                {inv.unit?.property?.name}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-text-muted">
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-text-muted">
                              {new Date(inv.expiresAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  statusColors[inv.status] || 'bg-surface-muted text-text-muted'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {inv.status === 'PENDING' && (
                                <button
                                  onClick={() => cancelInviteMutation.mutate(inv.id)}
                                  disabled={cancelInviteMutation.isPending}
                                  className="text-danger hover:underline font-semibold text-[11px]"
                                >
                                  Cancel
                                </button>
                              )}
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
        )}

        {/* Modal: Invite Tenant */}
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
                        An invitation has been created for <b>{inviteResult.invitation?.email}</b>.
                      </p>
                    </div>
                  </div>

                  {/* Dev Token Notice */}
                  {inviteResult.devToken && (
                    <div className="bg-surface-muted border border-border rounded-xl p-3 flex flex-col gap-2">
                      <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                        Development Direct Link
                      </span>
                      <p className="text-[11px] text-text-secondary">
                        Because email sending is in test mode, you can share or test this token directly:
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
                          All units in this property are currently occupied or none have been added yet.
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
      </div>
    </DashboardLayout>
  )
}
