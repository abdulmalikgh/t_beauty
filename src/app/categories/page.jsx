"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "../../components/dashboard-layout"
import {
  Plus,
  Search,
  FolderTree,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Folder,
  CheckCircle,
  XCircle,
  ArrowRight,
  Hash,
} from "lucide-react"
import api from "../../lib/api"
import handleApiError from "../../lib/handleApiError"

// API functions
const categoriesAPI = {
  getCategories: async (params) => {
    try {
      const response = await api.get("/categories", { params })
      return response.data
    } catch (error) {
      throw error
    }
  },
  addCategory: async (categoryData) => {
    try {
      const response = await api.post("/categories", categoryData)
      return response.data
    } catch (error) {
      throw error
    }
  },
  updateCategory: async (categoryId, categoryData) => {
    try {
      const response = await api.put(`/categories/${categoryId}`, categoryData)
      return response.data
    } catch (error) {
      throw error
    }
  },
  deleteCategory: async (categoryId) => {
    try {
      const response = await api.delete(`/categories/${categoryId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("add") // 'add' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [categoryToView, setCategoryToView] = useState(null)

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCategories, setTotalCategories] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  // Form data
  const initialFormData = {
    name: "",
    description: "",
    slug: "",
    parent_id: "",
  }
  const [formData, setFormData] = useState(initialFormData)

  // Calculate pagination
  const totalPages = Math.ceil(totalCategories / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalCategories)

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true)
    setError("")
    try {
      const params = {
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
      }
      if (searchTerm) params.search = searchTerm

      const data = await categoriesAPI.getCategories(params)
      setCategories(data.categories || [])
      setTotalCategories(data.total || 0)
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

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  // Handle name change and auto-generate slug
  const handleNameChange = (value) => {
    handleInputChange("name", value)
    if (modalMode === "add" || !formData.slug) {
      handleInputChange("slug", generateSlug(value))
    }
  }

  // Open add modal
  const openAddModal = () => {
    setModalMode("add")
    setFormData(initialFormData)
    setSelectedCategory(null)
    setShowModal(true)
  }

  // Open edit modal
  const openEditModal = (category) => {
    setModalMode("edit")
    setSelectedCategory(category)
    setFormData({
      name: category.name || "",
      description: category.description || "",
      slug: category.slug || "",
      parent_id: category.parent_id?.toString() || "",
    })
    setShowModal(true)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const categoryData = {
        name: formData.name,
        description: formData.description,
        slug: formData.slug,
        parent_id: formData.parent_id ? Number.parseInt(formData.parent_id) : null,
      }

      if (modalMode === "add") {
        await categoriesAPI.addCategory(categoryData)
      } else {
        await categoriesAPI.updateCategory(selectedCategory.id, categoryData)
      }

      setShowModal(false)
      setFormData(initialFormData)
      setSelectedCategory(null)
      fetchCategories() // Refresh the list
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    setIsSubmitting(true)
    try {
      await categoriesAPI.deleteCategory(categoryToDelete.id)
      setShowDeleteModal(false)
      setCategoryToDelete(null)
      fetchCategories() // Refresh the list
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle view category
  const handleViewCategory = (category) => {
    setCategoryToView(category)
    setShowViewModal(true)
  }

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
      fetchCategories()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Fetch categories on page/size change
  useEffect(() => {
    fetchCategories()
  }, [currentPage, pageSize])

  // Initial load
  useEffect(() => {
    fetchCategories()
  }, [])

  const getStatusColor = (isActive) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle size={16} /> : <XCircle size={16} />
  }

  // Get parent category name
  const getParentCategoryName = (parentId) => {
    if (!parentId) return null
    const parent = categories.find((cat) => cat.id === parentId)
    return parent ? parent.name : "Unknown"
  }

  // Get available parent categories (excluding current category and its children)
  const getAvailableParentCategories = () => {
    if (modalMode === "add") {
      return categories.filter((cat) => cat.is_active)
    }
    // For edit mode, exclude the current category to prevent circular reference
    return categories.filter((cat) => cat.is_active && cat.id !== selectedCategory?.id)
  }

  return (
    <DashboardLayout title="Categories" subtitle="Organize your product categories" currentPath="/dashboard/categories">
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
            <span>Add Category</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-800">{totalCategories}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <FolderTree size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Categories</p>
                <p className="text-2xl font-bold text-gray-800">{categories.filter((c) => c.is_active).length}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <CheckCircle size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Parent Categories</p>
                <p className="text-2xl font-bold text-gray-800">{categories.filter((c) => !c.parent_id).length}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Folder size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sub Categories</p>
                <p className="text-2xl font-bold text-gray-800">{categories.filter((c) => c.parent_id).length}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <ArrowRight size={24} style={{ color: "#E213A7" }} />
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
                placeholder="Search categories by name or description..."
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

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Categories ({startIndex}-{endIndex} of {totalCategories})
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                style={{ borderColor: "#E213A7" }}
              ></div>
              <p className="text-gray-600">Loading categories...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parent
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
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center mr-3">
                              {category.parent_id ? (
                                <ArrowRight size={20} style={{ color: "#E213A7" }} />
                              ) : (
                                <Folder size={20} style={{ color: "#E213A7" }} />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{category.name}</div>
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {category.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Hash size={12} className="mr-1" />
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">{category.slug}</code>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {category.parent_id ? (
                            <span className="text-sm text-gray-600">{getParentCategoryName(category.parent_id)}</span>
                          ) : (
                            <span className="text-sm text-gray-400">Root Category</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(category.is_active)}`}
                          >
                            {getStatusIcon(category.is_active)}
                            <span className="ml-1">{category.is_active ? "Active" : "Inactive"}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category.created_at ? new Date(category.created_at).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewCategory(category)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(category)}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Edit Category"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setCategoryToDelete(category)
                                setShowDeleteModal(true)
                              }}
                              className="text-gray-400 hover:text-red-600 p-1"
                              title="Delete Category"
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
                      Showing {startIndex} to {endIndex} of {totalCategories} categories
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

              {categories.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <FolderTree size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No categories found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "Try adjusting your search criteria" : "Get started by adding your first category"}
                  </p>
                  <button
                    onClick={openAddModal}
                    className="text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#E213A7" }}
                  >
                    Add Category
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add/Edit Category Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add" ? "Add New Category" : "Edit Category"}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Enter category name"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="category-slug"
                  />
                  <p className="text-xs text-gray-500 mt-1">URL-friendly version of the name (auto-generated)</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Enter category description"
                  />
                </div>

                {/* Parent Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => handleInputChange("parent_id", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  >
                    <option value="">None (Root Category)</option>
                    {getAvailableParentCategories().map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Select a parent category to create a subcategory</p>
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
                        ? "Add Category"
                        : "Update Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && categoryToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-red-100 mr-4">
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Delete Category</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete <span className="font-medium">"{categoryToDelete.name}"</span>? This
                  will permanently remove the category and may affect related products.
                </p>

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setCategoryToDelete(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCategory}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Deleting..." : "Delete Category"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Category Modal */}
        {showViewModal && categoryToView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Category Details</h3>
                  <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Category Header */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center">
                    {categoryToView.parent_id ? (
                      <ArrowRight size={32} style={{ color: "#E213A7" }} />
                    ) : (
                      <Folder size={32} style={{ color: "#E213A7" }} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800">{categoryToView.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(categoryToView.is_active)}`}
                      >
                        {getStatusIcon(categoryToView.is_active)}
                        <span className="ml-1">{categoryToView.is_active ? "Active" : "Inactive"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Information */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 mb-3">Category Information</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Slug:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{categoryToView.slug}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-800">
                        {categoryToView.parent_id ? "Sub Category" : "Root Category"}
                      </span>
                    </div>
                    {categoryToView.parent_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parent:</span>
                        <span className="text-gray-800">{getParentCategoryName(categoryToView.parent_id)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-800">
                        {categoryToView.created_at ? new Date(categoryToView.created_at).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    {categoryToView.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="text-gray-800">
                          {new Date(categoryToView.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {categoryToView.description && (
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Description</h5>
                    <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">{categoryToView.description}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      openEditModal(categoryToView)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Category
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
