import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Building2,
  MapPin,
  X,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  Edit3,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { properties } from '../lib/api.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtNPR(amount) {
  if (!amount && amount !== 0) return '—'
  return `NPR ${Number(amount).toLocaleString('en-IN')}`
}

function UnitBadge({ status }) {
  if (status === 'VACANT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border border-success text-success bg-success-bg">
        Available
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-surface-muted text-text-secondary border border-border">
      Occupied
    </span>
  )
}

// ── Property Detail Panel ─────────────────────────────────────────────────────

function PropertyDetail({ property, onEdit }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['property-detail', property.id],
    queryFn: async () => {
      const res = await properties.get(property.id)
      return res?.property ?? res
    },
    enabled: !!property.id,
  })

  const detail = data || {}
  const unitList = detail.units || []
  const occupiedCount = unitList.filter((u) => u.status === 'OCCUPIED').length
  const totalUnits = unitList.length || property._count?.units || 0
  const monthlyIncome = unitList.reduce((sum, u) => sum + (u.monthlyRent || 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="text-xl font-bold text-text truncate">{property.name}</h2>
          <p className="text-sm text-text-secondary flex items-center gap-1.5">
            <MapPin size={13} className="text-text-muted shrink-0" />
            <span className="truncate">{property.address}, {property.city}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(property)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
            title="Edit property"
          >
            <Edit3 size={16} />
          </button>
          <button className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium">Occupancy</span>
          {isLoading ? (
            <div className="h-6 w-16 bg-border rounded animate-pulse" />
          ) : (
            <span className="text-lg font-bold text-text">
              {occupiedCount}/{totalUnits} <span className="text-sm font-normal text-text-secondary">units</span>
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium">Monthly income</span>
          {isLoading ? (
            <div className="h-6 w-24 bg-border rounded animate-pulse" />
          ) : (
            <span className="text-base font-bold text-text">{fmtNPR(monthlyIncome)}</span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium">Outstanding</span>
          <span className="text-base font-bold text-danger">NPR 0</span>
        </div>
      </div>

      {/* Units Section */}
      <div className="mt-5 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text">Units and tenants</h3>
          <button className="text-xs text-primary font-medium hover:underline">View all</button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-danger-bg border border-danger/20 rounded-lg text-danger text-xs">
            <AlertCircle size={14} className="shrink-0" />
            <span>Failed to load unit details</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-border/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : unitList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
            No units found for this property.
          </div>
        ) : (
          <div className="flex flex-col gap-1 overflow-y-auto">
            {unitList.map((unit) => (
              <div
                key={unit.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-muted transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-text truncate">{unit.name}</span>
                  {unit.tenant && (
                    <span className="text-sm text-text-secondary truncate">{unit.tenant.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium text-text">
                    {unit.monthlyRent ? fmtNPR(unit.monthlyRent) : '—'}
                  </span>
                  <UnitBadge status={unit.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const queryClient = useQueryClient()

  const [selectedId, setSelectedId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [formData, setFormData] = useState({ name: '', address: '', city: '' })
  const [formError, setFormError] = useState(null)

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await properties.list()
      return Array.isArray(res) ? res : res?.properties || []
    },
  })

  const propertyList = data || []
  const selectedProperty = propertyList.find((p) => p.id === selectedId) || null

  // Stats derived from list (no per-unit rent here, so income shown in detail panel only)
  const totalUnits = propertyList.reduce((acc, p) => acc + (p._count?.units || 0), 0)
  const occupiedTotal = propertyList.reduce((acc, p) => acc + (p._count?.occupiedUnits || 0), 0)

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (body) => properties.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      closeModal()
    },
    onError: (err) => setFormError(err.message || 'Failed to create property'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => properties.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['property-detail', editingProperty?.id] })
      closeModal()
    },
    onError: (err) => setFormError(err.message || 'Failed to update property'),
  })

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setEditingProperty(null)
    setFormData({ name: '', address: '', city: '' })
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (prop) => {
    setEditingProperty(prop)
    setFormData({ name: prop.name, address: prop.address, city: prop.city })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingProperty(null)
    setFormData({ name: '', address: '', city: '' })
    setFormError(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError(null)
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim()) {
      setFormError('All fields are required')
      return
    }
    if (editingProperty) {
      updateMutation.mutate({
        id: editingProperty.id,
        body: {
          name: formData.name.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
        },
      })
    } else {
      createMutation.mutate({
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
      })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout activeKey="properties">
      <div className="flex flex-col gap-5 h-full">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Portfolio
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-text mt-0.5">Properties</h1>
            <p className="text-sm text-text-secondary mt-1">
              Manage units, tenants, and monthly income.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm self-start sm:self-auto shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add property
          </button>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-danger-bg border border-danger/20 rounded-xl text-danger text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error.message || 'Failed to load properties'}</span>
          </div>
        )}

        {/* ── Stats bar ── */}
        {!isLoading && propertyList.length > 0 && (
          <div className="flex items-center gap-0 border border-border rounded-xl bg-surface overflow-hidden text-sm">
            <StatChip label={`${propertyList.length} ${propertyList.length === 1 ? 'property' : 'properties'}`} />
            <Divider />
            <StatChip label={`${totalUnits} total units`} />
            <Divider />
            <StatChip label={`${occupiedTotal} occupied`} />
            <Divider />
            <StatChip label="NPR — expected/monthly" muted />
          </div>
        )}

        {/* ── Split panel ── */}
        <div className="flex gap-0 flex-1 min-h-0 border border-border rounded-2xl bg-surface overflow-hidden">

          {/* LEFT: Property list */}
          <div
            className={`flex flex-col shrink-0 overflow-y-auto border-r border-border ${
              selectedProperty ? 'w-80 hidden md:flex' : 'w-full md:w-80 md:flex flex'
            }`}
          >
            {isLoading ? (
              <div className="flex flex-col gap-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-4 border-b border-border animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-border shrink-0" />
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <div className="h-4 w-3/4 bg-border rounded" />
                      <div className="h-3 w-1/2 bg-border rounded" />
                      <div className="h-3 w-1/3 bg-border rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : propertyList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center">
                  <Building2 size={22} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">No properties yet</p>
                  <p className="text-xs text-text-muted mt-1">Add your first property to get started.</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="mt-1 inline-flex items-center gap-1.5 bg-primary text-white px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Add Property
                </button>
              </div>
            ) : (
              propertyList.map((prop) => {
                const unitCount = prop._count?.units ?? 0
                const occupiedCount = prop._count?.occupiedUnits ?? 0
                const isSelected = prop.id === selectedId
                return (
                  <button
                    key={prop.id}
                    onClick={() => setSelectedId(prop.id)}
                    className={`w-full text-left flex items-start gap-3 p-4 border-b border-border transition-colors hover:bg-surface-muted relative ${
                      isSelected
                        ? 'bg-surface-muted border-l-4 border-l-primary'
                        : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Building icon */}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 size={18} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text truncate leading-tight">{prop.name}</p>
                          <p className="text-xs text-text-muted mt-0.5 truncate">{prop.address}, {prop.city}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <ChevronRight size={15} className="text-text-muted mt-0.5" />
                        </div>
                      </div>
                      <p className={`text-xs mt-1.5 font-medium ${occupiedCount > 0 ? 'text-success' : 'text-text-muted'}`}>
                        {occupiedCount} of {unitCount} units occupied
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* RIGHT: Detail panel */}
          <div className="flex-1 min-w-0 overflow-y-auto p-6">
            {!selectedProperty ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center">
                  <Building2 size={26} className="text-text-muted" />
                </div>
                <div>
                  <p className="text-base font-semibold text-text">Select a property</p>
                  <p className="text-sm text-text-muted mt-1">
                    Choose a property from the list to see its units and details.
                  </p>
                </div>
              </div>
            ) : (
              <PropertyDetail
                key={selectedProperty.id}
                property={selectedProperty}
                onEdit={openEditModal}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Modal: Add / Edit Property ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-lg font-bold text-text">
                {editingProperty ? 'Edit Property' : 'Add New Property'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-danger-bg border border-danger/20 rounded-lg text-danger text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Property Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Siddhartha Nagar Residence"
                  className="w-full px-3.5 py-2 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-muted"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Ward 4, Maitidevi Marg"
                  className="w-full px-3.5 py-2 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-muted"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Butwal, Pokhara, Kathmandu"
                  className="w-full px-3.5 py-2 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-muted"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text hover:bg-surface-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingProperty
                    ? 'Save Changes'
                    : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function StatChip({ label, muted }) {
  return (
    <span className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap ${muted ? 'text-text-muted' : 'text-text'}`}>
      {label}
    </span>
  )
}

function Divider() {
  return <span className="text-border-dark select-none text-base font-light">|</span>
}
