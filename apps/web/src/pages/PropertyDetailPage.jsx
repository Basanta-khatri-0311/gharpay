import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Plus,
  DoorOpen,
  Edit3,
  X,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Receipt,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { properties, units } from '../lib/api.js'

function formatNPR(amount) {
  if (!amount) return 'NPR 0'
  return 'NPR ' + Number(amount).toLocaleString('en-IN')
}

const UNIT_TYPES = [
  { value: 'ROOM', label: 'Room' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'FLAT', label: 'Flat' },
  { value: 'SHOP', label: 'Shop / Shutter' },
  { value: 'OTHER', label: 'Other' },
]

export default function PropertyDetailPage() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'ROOM',
    monthlyRent: '',
  })
  const [formError, setFormError] = useState(null)

  // Fetch property details with nested units
  const { data, isLoading, error } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const res = await properties.get(propertyId)
      return res?.property || res
    },
    enabled: !!propertyId,
  })

  const property = data
  const unitList = property?.units || []

  // Create Unit mutation
  const createUnitMutation = useMutation({
    mutationFn: (body) => units.create(propertyId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      closeModal()
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to create unit')
    },
  })

  // Update Unit mutation
  const updateUnitMutation = useMutation({
    mutationFn: ({ unitId, body }) => units.update(propertyId, unitId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      closeModal()
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to update unit')
    },
  })

  const openCreateModal = () => {
    setEditingUnit(null)
    setFormData({ name: '', type: 'ROOM', monthlyRent: '' })
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (unit) => {
    setEditingUnit(unit)
    setFormData({
      name: unit.name,
      type: unit.type,
      monthlyRent: String(unit.monthlyRent),
    })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingUnit(null)
    setFormData({ name: '', type: 'ROOM', monthlyRent: '' })
    setFormError(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError(null)

    const rentNum = parseFloat(formData.monthlyRent)
    if (!formData.name.trim()) {
      setFormError('Unit name is required')
      return
    }
    if (isNaN(rentNum) || rentNum <= 0) {
      setFormError('Please enter a valid monthly rent amount')
      return
    }

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      monthlyRent: rentNum,
    }

    if (editingUnit) {
      updateUnitMutation.mutate({ unitId: editingUnit.id, body: payload })
    } else {
      createUnitMutation.mutate(payload)
    }
  }

  const filteredUnits = useMemo(() => {
    if (statusFilter === 'ALL') return unitList
    return unitList.filter((u) => u.status === statusFilter)
  }, [unitList, statusFilter])

  // Aggregate stats
  const totalRentRoll = unitList.reduce((acc, u) => acc + (Number(u.monthlyRent) || 0), 0)
  const vacantCount = unitList.filter((u) => u.status === 'VACANT').length
  const occupiedCount = unitList.filter((u) => u.status === 'OCCUPIED').length

  return (
    <DashboardLayout activeKey="properties">
      <div className="flex flex-col gap-6 max-w-6xl">
        {/* Back Link */}
        <div>
          <Link
            to="/dashboard/properties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Properties
          </Link>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-danger-bg border border-danger/20 rounded-xl text-danger text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error.message || 'Failed to load property details'}</span>
          </div>
        )}

        {/* Property Header Card */}
        {isLoading ? (
          <div className="bg-surface border border-border rounded-2xl p-6 animate-pulse flex flex-col gap-4">
            <div className="h-7 w-1/3 bg-border rounded" />
            <div className="h-4 w-1/4 bg-border rounded" />
            <div className="grid grid-cols-4 gap-4 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-surface-muted rounded-xl" />
              ))}
            </div>
          </div>
        ) : property ? (
          <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                  <Building2 size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-text">
                    {property.name}
                  </h1>
                  <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-1">
                    <MapPin size={13} className="text-text-muted shrink-0" />
                    <span>{property.address}, {property.city}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm self-start sm:self-auto"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add Unit
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-surface-muted border border-border rounded-xl p-3.5 flex flex-col gap-1">
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
                  Total Units
                </span>
                <span className="text-xl font-bold text-text">{unitList.length}</span>
              </div>
              <div className="bg-surface-muted border border-border rounded-xl p-3.5 flex flex-col gap-1">
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
                  Occupied
                </span>
                <span className="text-xl font-bold text-accent">{occupiedCount}</span>
              </div>
              <div className="bg-surface-muted border border-border rounded-xl p-3.5 flex flex-col gap-1">
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
                  Vacant
                </span>
                <span className="text-xl font-bold text-text-secondary">{vacantCount}</span>
              </div>
              <div className="bg-surface-muted border border-border rounded-xl p-3.5 flex flex-col gap-1">
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider">
                  Rent Potential
                </span>
                <span className="text-xl font-bold text-text truncate">
                  {formatNPR(totalRentRoll)}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Units Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-text">Units in this Property</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Each unit can be leased to an individual tenant or household.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-lg border border-border self-start sm:self-auto">
              {['ALL', 'OCCUPIED', 'VACANT'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                    statusFilter === f
                      ? 'bg-surface text-text shadow-xs'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {f.toLowerCase()} {f === 'ALL' ? `(${unitList.length})` : f === 'OCCUPIED' ? `(${occupiedCount})` : `(${vacantCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Units Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 animate-pulse"
                >
                  <div className="h-5 w-1/2 bg-border rounded" />
                  <div className="h-4 w-1/3 bg-border rounded" />
                  <div className="h-8 w-full bg-border rounded mt-2" />
                </div>
              ))}
            </div>
          ) : unitList.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-muted text-text-muted flex items-center justify-center">
                <DoorOpen size={20} />
              </div>
              <h3 className="text-sm font-semibold text-text">No units in this property yet</h3>
              <p className="text-xs text-text-muted max-w-xs">
                Add rooms, flats, or apartments to start generating leases and bills.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-1 inline-flex items-center gap-2 bg-primary text-white px-3.5 py-2 rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors"
              >
                <Plus size={15} strokeWidth={2.5} />
                Add First Unit
              </button>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center text-xs text-text-muted">
              No units found with status "{statusFilter.toLowerCase()}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnits.map((unit) => {
                const isVacant = unit.status === 'VACANT'
                return (
                  <div
                    key={unit.id}
                    className="bg-surface border border-border rounded-2xl p-5 flex flex-col justify-between hover:border-border-dark transition-all shadow-xs"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-text">
                              {unit.name}
                            </h3>
                            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-border">
                              {unit.type}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-accent mt-1">
                            {formatNPR(unit.monthlyRent)}
                            <span className="text-[11px] font-normal text-text-muted"> / month</span>
                          </p>
                        </div>

                        <button
                          onClick={() => openEditModal(unit)}
                          className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
                          title="Edit Unit"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          isVacant
                            ? 'bg-success-bg text-success'
                            : 'bg-primary-light text-primary'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isVacant ? 'bg-success' : 'bg-primary'
                          }`}
                        />
                        {isVacant ? 'Vacant' : 'Occupied'}
                      </span>

                      {/* Quick action button depending on occupancy */}
                      {isVacant ? (
                        <button
                          onClick={() => navigate(`/dashboard/tenants?unitId=${unit.id}`)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover hover:underline"
                        >
                          <UserPlus size={13} />
                          Assign Tenant
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/dashboard/bills?unitId=${unit.id}`)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:text-text hover:underline"
                        >
                          <Receipt size={13} />
                          View Bills
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal: Add / Edit Unit */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-lg font-bold text-text">
                  {editingUnit ? `Edit ${editingUnit.name}` : 'Add New Unit'}
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
                  <label className="text-xs font-semibold text-text-secondary">
                    Unit Identifier / Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Room 101, Flat 3B, Ground Floor Shop"
                    className="w-full px-3.5 py-2 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-muted"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Unit Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  >
                    {UNIT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Standard Monthly Rent (NPR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    placeholder="e.g. 15000"
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
                    disabled={createUnitMutation.isPending || updateUnitMutation.isPending}
                    className="px-5 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {createUnitMutation.isPending || updateUnitMutation.isPending
                      ? 'Saving...'
                      : editingUnit
                      ? 'Save Changes'
                      : 'Add Unit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
