"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "../../components/dashboard-layout"
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  DollarSign,
  Archive,
  CheckCircle,
  Hash,
  Weight,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import api from "../../lib/api"
import handleApiError from "../../lib/handleApiError"

// API functions
const productsAPI = {
  getProducts: async (params) => {
    try {
      const response = await api.get("/products", { params })
      return response.data
    } catch (error) {
      throw error
    }
  },
  getProductStats: async () => {
    try {
      const response = await api.get("/products/stats")
      return response.data
    } catch (error) {
      throw error
    }
  },
  addProduct: async (productData) => {
    try {
      const response = await api.post("/products", productData)
      return response.data
    } catch (error) {
      throw error
    }
  },
  updateProduct: async (productId, productData) => {
    try {
      const response = await api.put(`/products/${productId}`, productData)
      return response.data
    } catch (error) {
      throw error
    }
  },
  deleteProduct: async (productId) => {
    try {
      const response = await api.delete(`/products/${productId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

const brandsAPI = {
  getBrands: async () => {
    try {
      const response = await api.get("/brands")
      return response.data
    } catch (error) {
      throw error
    }
  },
}

const categoriesAPI = {
  getCategories: async () => {
    try {
      const response = await api.get("/categories")
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("add") // 'add' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [productToView, setProductToView] = useState(null)

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [activeOnly, setActiveOnly] = useState(false)

  // Form data - updated to match API structure
  const initialFormData = {
    name: "",
    description: "",
    sku: "",
    base_price: "", // Changed back to base_price
    brand_id: "",
    category_id: "",
    weight: "",
    is_active: true,
  }
  const [formData, setFormData] = useState(initialFormData)

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalItems)

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true)
    setError("")
    try {
      const params = {
        page: currentPage,
        size: pageSize,
      }
      if (searchTerm) params.search = searchTerm
      if (selectedBrand) params.brand_id = selectedBrand
      if (selectedCategory) params.category_id = selectedCategory
      if (activeOnly) params.is_active = true

      const data = await productsAPI.getProducts(params)
      setProducts(data.products || [])
      setTotalItems(data.total || 0)
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await productsAPI.getProductStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const fetchBrands = async () => {
    try {
      const data = await brandsAPI.getBrands()
      setBrands(data.brands || [])
    } catch (error) {
      console.error("Failed to fetch brands:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getCategories()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
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
    setSelectedProduct(null)
    setShowModal(true)
  }

  // Open edit modal
  const openEditModal = (product) => {
    setModalMode("edit")
    setSelectedProduct(product)
    setFormData({
      name: product.name || "",
      description: product.description || "",
      sku: product.sku || "",
      base_price: product.base_price?.toString() || "", // Changed to base_price
      brand_id: product.brand_id?.toString() || "",
      category_id: product.category_id?.toString() || "",
      weight: product.weight?.toString() || "",
      is_active: product.is_active !== undefined ? product.is_active : true,
    })
    setShowModal(true)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        base_price: Number.parseFloat(formData.base_price) || 0, // Changed to base_price
        brand_id: Number.parseInt(formData.brand_id) || null,
        category_id: Number.parseInt(formData.category_id) || null,
        weight: Number.parseFloat(formData.weight) || 0,
        is_active: formData.is_active,
      }

      if (modalMode === "add") {
        await productsAPI.addProduct(productData)
      } else {
        await productsAPI.updateProduct(selectedProduct.id, productData)
      }

      setShowModal(false)
      setFormData(initialFormData)
      setSelectedProduct(null)
      fetchProducts()
      fetchStats()
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    setIsSubmitting(true)
    try {
      await productsAPI.deleteProduct(productToDelete.id)
      setShowDeleteModal(false)
      setProductToDelete(null)
      fetchProducts()
      fetchStats()
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle view product
  const handleViewProduct = (product) => {
    setProductToView(product)
    setShowViewModal(true)
  }

  // Handle search and filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchProducts()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedBrand, selectedCategory, activeOnly])

  // Fetch products on page/size change
  useEffect(() => {
    fetchProducts()
  }, [currentPage, pageSize])

  // Initial load
  useEffect(() => {
    fetchProducts()
    fetchStats()
    fetchBrands()
    fetchCategories()
  }, [])

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const formatWeight = (weight) => {
    if (!weight) return "N/A"
    return `${weight} kg`
  }

  // Helper function to safely render brand name - handles both string and object cases
  const renderBrandName = (product) => {
    if (!product) return "No Brand"

    // If brand is an object with name property, extract it
    if (typeof product.brand === "object" && product.brand !== null) {
      return product.brand.name || "Unknown Brand"
    }

    // If brand_id exists, find brand in brands array
    if (product.brand_id) {
      const brand = brands.find((b) => b.id === product.brand_id)
      return brand ? brand.name : "Unknown Brand"
    }

    return "No Brand"
  }

  // Helper function to safely render category name - handles both string and object cases
  const renderCategoryName = (product) => {
    if (!product) return "No Category"

    // If category is an object with name property, extract it
    if (typeof product.category === "object" && product.category !== null) {
      return product.category.name || "Unknown Category"
    }

    // If category_id exists, find category in categories array
    if (product.category_id) {
      const category = categories.find((c) => c.id === product.category_id)
      return category ? category.name : "Unknown Category"
    }

    return "No Category"
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedBrand("")
    setSelectedCategory("")
    setActiveOnly(false)
  }

  return (
    <DashboardLayout title="Products" subtitle="Manage your product catalog" currentPath="/dashboard/products">
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
            <span>Add Product</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total_products || totalItems}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Package size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.active_products || products.filter((p) => p.is_active).length}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <CheckCircle size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Products</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.inactive_products || products.filter((p) => !p.is_active).length}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Archive size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatPrice(
                    stats.average_price ||
                      products.reduce((sum, p) => sum + (p.base_price || 0), 0) / (products.length || 1),
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <DollarSign size={24} style={{ color: "#E213A7" }} />
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
                placeholder="Search products by name, SKU, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Active Only</span>
              </label>

              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Filter size={16} />
                <span>Clear</span>
              </button>

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

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Products ({startIndex}-{endIndex} of {totalItems})
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                style={{ borderColor: "#E213A7" }}
              ></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product, index) => {
                      return (
                        <tr key={product.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center mr-3">
                                <Package size={20} style={{ color: "#E213A7" }} />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {product.description || "No description"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Hash size={12} className="mr-1" />
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{product.sku || "No SKU"}</code>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{renderBrandName(product)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{renderCategoryName(product)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              <DollarSign size={12} className="mr-1" />
                              {formatPrice(product.base_price || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 flex items-center">
                              <Weight size={12} className="mr-1" />
                              {formatWeight(product.weight)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                product.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewProduct(product)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => openEditModal(product)}
                                className="text-gray-400 hover:text-blue-600 p-1"
                                title="Edit Product"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setProductToDelete(product)
                                  setShowDeleteModal(true)
                                }}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Delete Product"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex} to {endIndex} of {totalItems} products
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

              {products.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Package size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedBrand || selectedCategory || activeOnly
                      ? "Try adjusting your search criteria"
                      : "Get started by adding your first product"}
                  </p>
                  <button
                    onClick={openAddModal}
                    className="text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#E213A7" }}
                  >
                    Add Product
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add" ? "Add New Product" : "Edit Product"}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Enter SKU"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Enter product description"
                  />
                </div>

                {/* Brand and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                    <select
                      value={formData.brand_id}
                      onChange={(e) => handleInputChange("brand_id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    >
                      <option value="">Select a brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => handleInputChange("category_id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price, Weight, and Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => handleInputChange("base_price", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange("is_active", e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active Product</span>
                  </label>
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
                        ? "Add Product"
                        : "Update Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && productToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-red-100 mr-4">
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Delete Product</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete <span className="font-medium">"{productToDelete.name}"</span>? This
                  will permanently remove the product from your catalog.
                </p>

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setProductToDelete(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProduct}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Deleting..." : "Delete Product"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Product Modal */}
        {showViewModal && productToView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Product Details</h3>
                  <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Product Header */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center">
                    <Package size={32} style={{ color: "#E213A7" }} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800">{productToView.name}</h4>
                    <p className="text-sm text-gray-600">{productToView.description}</p>
                  </div>
                </div>

                {/* Basic Information */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 mb-3">Basic Information</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">SKU:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{productToView.sku || "No SKU"}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium text-gray-800">{renderBrandName(productToView)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-800">{renderCategoryName(productToView)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          productToView.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {productToView.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Physical */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 mb-3">Pricing & Physical</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Price:</span>
                      <span className="font-medium text-gray-800">{formatPrice(productToView.base_price || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium text-gray-800">{formatWeight(productToView.weight)}</span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 mb-3">Timestamps</h5>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-800">
                        {productToView.created_at ? new Date(productToView.created_at).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    {productToView.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="text-gray-800">{new Date(productToView.updated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      openEditModal(productToView)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Product
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
