"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "../../components/dashboard-layout"
import {
  Plus,
  Search,
  Globe,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Building2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react"
import api from "../../lib/api"
import handleApiError from "../../lib/handleApiError"

// API functions
const brandsAPI = {
  getBrands: async (params) => {
    try {
      const response = await api.get("/brands", { params })
      return response.data
    } catch (error) {
      throw error
    }
  },
  addBrand: async (brandData) => {
    try {
      const response = await api.post("/brands", brandData)
      return response.data
    } catch (error) {
      throw error
    }
  },
  updateBrand: async (brandId, brandData) => {
    try {
      const response = await api.put(`/brands/${brandId}`, brandData)
      return response.data
    } catch (error) {
      throw error
    }
  },
  deleteBrand: async (brandId) => {
    try {
      const response = await api.delete(`/brands/${brandId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("add") // 'add' or 'edit'
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [brandToDelete, setBrandToDelete] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [brandToView, setBrandToView] = useState(null)

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalBrands, setTotalBrands] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  // Form data
  const initialFormData = {
    name: "",
    description: "",
    logo_url: "",
    website_url: "",
  }
  const [formData, setFormData] = useState(initialFormData)

  // Calculate pagination
  const totalPages = Math.ceil(totalBrands / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalBrands)

  // Fetch brands
  const fetchBrands = async () => {
    setLoading(true)
    setError("")
    try {
      const params = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
      }
      if (searchTerm) params.search = searchTerm

      const data = await brandsAPI.getBrands(params)
      setBrands(data.brands || [])
      setTotalBrands(data.total || 0)
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Open add modal
  const openAddModal = () => {
    setModalMode("add")
    setFormData(initialFormData)
    setSelectedBrand(null)
    setShowModal(true)
  }

  // Open edit modal
  const openEditModal = (brand) => {
    setModalMode("edit")
    setSelectedBrand(brand)
    setFormData({
      name: brand.name || "",
      description: brand.description || "",
      logo_url: brand.logo_url || "",
      website_url: brand.website_url || "",
    })
    setShowModal(true)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const brandData = {
        name: formData.name,
        description: formData.description,
        logo_url: formData.logo_url,
        website_url: formData.website_url,
      }

      if (modalMode === "add") {
        await brandsAPI.addBrand(brandData)
      } else {
        await brandsAPI.updateBrand(selectedBrand.id, brandData)
      }

      setShowModal(false)
      setFormData(initialFormData)
      setSelectedBrand(null)
      fetchBrands() // Refresh the list
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete brand
  const handleDeleteBrand = async () => {
    if (!brandToDelete) return

    setIsSubmitting(true)
    try {
      await brandsAPI.deleteBrand(brandToDelete.id)
      setShowDeleteModal(false)
      setBrandToDelete(null)
      fetchBrands() // Refresh the list
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle view brand
  const handleViewBrand = (brand) => {
    setBrandToView(brand)
    setShowViewModal(true)
  }

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
      fetchBrands()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Fetch brands on page/size change
  useEffect(() => {
    fetchBrands()
  }, [currentPage, pageSize])

  // Initial load
  useEffect(() => {
    fetchBrands()
  }, [])

  const getStatusColor = (isActive) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle size={16} /> : <XCircle size={16} />
  }

  const renderLogo = (logoUrl, brandName, size = "w-8 h-8") => {
    if (logoUrl) {
      return (
        <img
          src={logoUrl || "/placeholder.svg"}
          alt={`${brandName} logo`}
          className={`${size} rounded-lg object-cover`}
          onError={(e) => {
            e.target.style.display = "none"
            e.target.nextSibling.style.display = "flex"
          }}
        />
      )
    }
    return (
      <div className={`${size} rounded-lg bg-pink-100 flex items-center justify-center`}>
        <Building2 size={size === "w-8 h-8" ? 16 : 20} style={{ color: "#E213A7" }} />
      </div>
    )
  }

  return (
    <DashboardLayout title="Brands" subtitle="Manage your brand portfolio" currentPath="/dashboard/brands">
      <div className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center justify-between">
            <p>{error}</p>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-800">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="w-full flex items-center justify-end mb-6">
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#E213A7" }}
          >
            <Plus size={20} />
            <span>Add Brand</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Brands</p>
                <p className="text-2xl font-bold text-gray-800">{totalBrands}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Building2 size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Brands</p>
                <p className="text-2xl font-bold text-gray-800">{brands.filter((b) => b.is_active).length}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <CheckCircle size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Websites</p>
                <p className="text-2xl font-bold text-gray-800">{brands.filter((b) => b.website_url).length}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Globe size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Logos</p>
                <p className="text-2xl font-bold text-gray-800">{brands.filter((b) => b.logo_url).length}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Eye size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search brands by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>

            {/* Page Size */}
            <div className="flex gap-4">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Brands Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Brands ({startIndex}-{endIndex} of {totalBrands})
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                style={{ borderColor: "#E213A7" }}
              ></div>
              <p className="text-gray-600">Loading brands...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Website
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {brands.map((brand) => (
                      <tr key={brand.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="mr-3">
                              {renderLogo(brand.logo_url, brand.name)}
                              <div
                                className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center"
                                style={{ display: "none" }}
                              >
                                <Building2 size={16} style={{ color: "#E213A7" }} />
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {brand.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {brand.website_url ? (
                            <a
                              href={brand.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <Globe size={12} className="mr-1" />
                              Visit Website
                              <ExternalLink size={12} className="ml-1" />
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">No website</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(brand.is_active)}`}
                          >
                            {getStatusIcon(brand.is_active)}
                            <span className="ml-1">{brand.is_active ? "Active" : "Inactive"}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {brand.created_at ? new Date(brand.created_at).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewBrand(brand)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(brand)}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Edit Brand"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setBrandToDelete(brand)
                                setShowDeleteModal(true)
                              }}
                              className="text-gray-400 hover:text-red-600 p-1"
                              title="Delete Brand"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex} to {endIndex} of {totalBrands} brands
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {/* Page numbers */}
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                currentPage === pageNum
                                  ? "text-white"
                                  : "text-gray-700 hover:bg-gray-100 border border-gray-300"
                              }`}
                              style={currentPage === pageNum ? { backgroundColor: "#E213A7" } : {}}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {brands.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Building2 size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No brands found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "Try adjusting your search criteria" : "Get started by adding your first brand"}
                  </p>
                  <button
                    onClick={openAddModal}
                    className="text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#E213A7" }}
                  >
                    Add Brand
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add/Edit Brand Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add" ? "Add New Brand" : "Edit Brand"}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Brand Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Enter brand name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Enter brand description"
                  />
                </div>

                {/* Logo URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => handleInputChange("logo_url", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="https://example.com/logo.png"
                  />
                  {formData.logo_url && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">Logo Preview:</p>
                      <div className="flex items-center">
                        {renderLogo(formData.logo_url, formData.name, "w-12 h-12")}
                      </div>
                    </div>
                  )}
                </div>

                {/* Website URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => handleInputChange("website_url", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: "#E213A7" }}
                  >
                    {isSubmitting
                      ? modalMode === "add"
                        ? "Adding..."
                        : "Updating..."
                      : modalMode === "add"
                        ? "Add Brand"
                        : "Update Brand"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && brandToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-red-100 mr-4">
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Delete Brand</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete <span className="font-medium">"{brandToDelete.name}"</span>? This will
                  permanently remove the brand from your system.
                </p>

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setBrandToDelete(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteBrand}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Deleting..." : "Delete Brand"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Brand Modal */}
        {showViewModal && brandToView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Brand Details</h3>
                  <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Brand Header */}
                <div className="flex items-center space-x-4">
                  <div>{renderLogo(brandToView.logo_url, brandToView.name, "w-16 h-16")}</div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800">{brandToView.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(brandToView.is_active)}`}
                      >
                        {getStatusIcon(brandToView.is_active)}
                        <span className="ml-1">{brandToView.is_active ? "Active" : "Inactive"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Brand Information */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 mb-3">Brand Information</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Website:</span>
                      {brandToView.website_url ? (
                        <a
                          href={brandToView.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          Visit Website
                          <ExternalLink size={12} className="ml-1" />
                        </a>
                      ) : (
                        <span className="text-gray-400">No website</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-800">
                        {brandToView.created_at ? new Date(brandToView.created_at).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    {brandToView.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="text-gray-800">{new Date(brandToView.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {brandToView.description && (
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Description</h5>
                    <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">{brandToView.description}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      openEditModal(brandToView)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Brand
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
