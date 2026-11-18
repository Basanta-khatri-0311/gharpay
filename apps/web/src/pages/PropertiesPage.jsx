import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2, MapPin, Layers, Search, Edit3, X, AlertCircle } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import { properties } from '../lib/api.js'

export default function PropertiesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [formData, setFormData] = useState({ name: '', address: '', city: '' })
  const [formError, setFormError] = useState(null)

  // Fetch properties
  const { data, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await properties.list()
      return Array.isArray(res) ? res : res?.properties || []
    },
  })

  const propertyList = data || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (body) => properties.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      closeModal()
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to create property')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => properties.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      closeModal()
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to update property')
    },
  })

  const openCreateModal = () => {
    setEditingProperty(null)
    setFormData({ name: '', address: '', city: '' })
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (prop, e) => {
    e.stopPropagation()
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

  const filteredProperties = useMemo(() => {
    if (!search.trim()) return propertyList
    const q = search.toLowerCase()
    return propertyList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    )
  }, [propertyList, search])

  const totalUnits = propertyList.reduce((acc, p) => acc + (p._count?.units || 0), 0)

  return (
    <DashboardLayout activeKey="properties">
      <div className="flex flex-col gap-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
            <p className="text-sm text-text-secondary mt-1">
              Manage your residential and commercial properties.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Property
          </button>
        </div>

        {/* Global error banner */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-danger-bg border border-danger/20 rounded-xl text-danger text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error.message || 'Failed to load properties'}</span>
          </div>
        )}

        {/* Summary Mini Cards */}
        {!isLoading && propertyList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1">
              <span className="text-xs text-text-muted font-medium">Total Properties</span>
              <span className="text-2xl font-bold text-text">{propertyList.length}</span>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1">
              <span className="text-xs text-text-muted font-medium">Total Units</span>
              <span className="text-2xl font-bold text-text">{totalUnits}</span>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-xs text-text-muted font-medium">Avg Units / Property</span>
              <span className="text-2xl font-bold text-text">
                {propertyList.length > 0 ? (totalUnits / propertyList.length).toFixed(1) : 0}
              </span>
            </div>
          </div>
        )}

        {/* Search bar */}
        {propertyList.length > 0 && (
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, address, or city..."
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        )}

        {/* Properties List / Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 animate-pulse"
              >
                <div className="h-6 w-3/4 bg-border rounded" />
                <div className="h-4 w-1/2 bg-border rounded" />
                <div className="h-10 w-full bg-border rounded mt-4" />
              </div>
            ))}
          </div>
        ) : propertyList.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <h3 className="text-base font-semibold text-text">No properties found</h3>
            <p className="text-sm text-text-muted max-w-sm">
              You haven't added any properties yet. Add your first house or building to begin adding units and tenants.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add Your First Property
            </button>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center text-sm text-text-muted">
            No properties match your search "{search}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((prop) => {
              const unitCount = prop._count?.units ?? 0
              return (
                <div
                  key={prop.id}
                  onClick={() => navigate(`/dashboard/properties/${prop.id}`)}
                  className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group relative"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                      </div>
                      <button
                        onClick={(e) => openEditModal(prop, e)}
                        className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-muted transition-colors opacity-80 hover:opacity-100"
                        title="Edit property"
                      >
                        <Edit3 size={15} />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-text group-hover:text-primary transition-colors">
                        {prop.name}
                      </h3>
                      <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-1">
                        <MapPin size={13} className="text-text-muted shrink-0" />
                        <span className="truncate">{prop.address}, {prop.city}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-surface-muted px-2.5 py-1 rounded-md">
                      <Layers size={13} className="text-text-muted" />
                      {unitCount} {unitCount === 1 ? 'Unit' : 'Units'}
                    </span>
                    <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                      Manage Units &rarr;
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal: Add / Edit Property */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
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
                  <label className="text-xs font-semibold text-text-secondary">
                    Property Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Kathmandu Residency or Building A"
                    className="w-full px-3.5 py-2 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-muted"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-secondary">
                    Street Address
                  </label>
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
                  <label className="text-xs font-semibold text-text-secondary">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Kathmandu, Lalitpur, Pokhara"
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
      </div>
    </DashboardLayout>
  )
}
