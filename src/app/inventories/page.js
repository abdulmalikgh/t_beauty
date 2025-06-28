"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "../../components/dashboard-layout"
import {
  Plus,
  Search,
  Package2,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  DollarSign,
  Archive,
  CheckCircle,
  XCircle,
  Hash,
  TrendingUp,
  RotateCcw,
  Filter,
} from "lucide-react"
import api from "../../lib/api"
import handleApiError from "../../lib/handleApiError"

// API functions
const inventoryAPI = {
  getInventory: async (params) => {
    try {
      const response = await api.get("/inventory", { params })
      return response.data
    } catch (error) {
      throw error
    }
  },
  getInventoryStats: async () => {
    try {
      const response = await api.get("/inventory/stats")
      return response.data
    } catch (error) {
      throw error
    }
  },
  addInventoryItem: async (itemData) => {
    try {
      const response = await api.post("/inventory", itemData)
      return response.data
    } catch (error) {
      throw error
    }
  },
  updateInventoryItem: async (itemId, itemData) => {
    try {
      const response = await api.put(`/inventory/${itemId}`, itemData)
      return response.data
    } catch (error) {
      throw error
    }
  },
  deleteInventoryItem: async (itemId) => {
    try {
      const response = await api.delete(`/inventory/${itemId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
  adjustStock: async (itemId, newQuantity, reason) => {
    try {
      const response = await api.post(`/inventory/${itemId}/adjust-stock`, null, {
        params: { new_quantity: newQuantity, reason },
      })
      return response.data
    } catch (error) {
      throw error
    }
  },
}

const productsAPI = {
  getProducts: async () => {
    try {
      const response = await api.get("/products")
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

export default function InventoryPage() {
  const [inventory, setInventory] = useState([])
  const [stats, setStats] = useState({})
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("add") // 'add' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [itemToView, setItemToView] = useState(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [itemToAdjust, setItemToAdjust] = useState(null)

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isActiveFilter, setIsActiveFilter] = useState("")
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [outOfStockOnly, setOutOfStockOnly] = useState(false)

  // Form data
  const initialFormData = {
    name: "",
    description: "",
    product_id: "",
    cost_price: "",
    selling_price: "",
    current_stock: "",
    minimum_stock: "5",
    maximum_stock: "100",
    reorder_point: "10",
    reorder_quantity: "20",
    weight: "",
    dimensions: "",
    color: "",
    shade: "",
    size: "",
    is_featured: false,
    supplier_name: "",
    supplier_contact: "",
  }
  const [formData, setFormData] = useState(initialFormData)

  // Stock adjustment form
  const [stockAdjustment, setStockAdjustment] = useState({
    new_quantity: "",
    reason: "",
  })

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalItems)

  // Fetch inventory
  const fetchInventory = async () => {
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
      if (isActiveFilter !== "") params.is_active = isActiveFilter === "true"
      if (lowStockOnly) params.low_stock_only = true
      if (outOfStockOnly) params.out_of_stock_only = true

      const data = await inventoryAPI.getInventory(params)
      setInventory(data.items || [])
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
      const data = await inventoryAPI.getInventoryStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const data = await productsAPI.getProducts()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
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
    setSelectedItem(null)
    setShowModal(true)
  }

  // Open edit modal
  const openEditModal = (item) => {
    setModalMode("edit")
    setSelectedItem(item)
    setFormData({
      name: item.name || "",
      description: item.description || "",
      product_id: item.product_id?.toString() || "",
      cost_price: item.cost_price?.toString() || "",
      selling_price: item.selling_price?.toString() || "",
      current_stock: item.current_stock?.toString() || "",
      minimum_stock: item.minimum_stock?.toString() || "5",
      maximum_stock: item.maximum_stock?.toString() || "100",
      reorder_point: item.reorder_point?.toString() || "10",
      reorder_quantity: item.reorder_quantity?.toString() || "20",
      weight: item.weight?.toString() || "",
      dimensions: item.dimensions || "",
      color: item.color || "",
      shade: item.shade || "",
      size: item.size || "",
      is_featured: item.is_featured || false,
      supplier_name: item.supplier_name || "",
      supplier_contact: item.supplier_contact || "",
    })
    setShowModal(true)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        product_id: formData.product_id ? Number.parseInt(formData.product_id) : null,
        cost_price: Number.parseFloat(formData.cost_price) || 0,
        selling_price: Number.parseFloat(formData.selling_price) || 0,
        current_stock: Number.parseInt(formData.current_stock) || 0,
        minimum_stock: Number.parseInt(formData.minimum_stock) || 5,
        maximum_stock: Number.parseInt(formData.maximum_stock) || 100,
        reorder_point: Number.parseInt(formData.reorder_point) || 10,
        reorder_quantity: Number.parseInt(formData.reorder_quantity) || 20,
        weight: Number.parseFloat(formData.weight) || 0,
        dimensions: formData.dimensions,
        color: formData.color,
        shade: formData.shade,
        size: formData.size,
        is_featured: formData.is_featured,
        supplier_name: formData.supplier_name,
        supplier_contact: formData.supplier_contact,
      }

      if (modalMode === "add") {
        await inventoryAPI.addInventoryItem(itemData)
      } else {
        await inventoryAPI.updateInventoryItem(selectedItem.id, itemData)
      }

      setShowModal(false)
      setFormData(initialFormData)
      setSelectedItem(null)
      fetchInventory()
      fetchStats()
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete item
  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    setIsSubmitting(true)
    try {
      await inventoryAPI.deleteInventoryItem(itemToDelete.id)
      setShowDeleteModal(false)
      setItemToDelete(null)
      fetchInventory()
      fetchStats()
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle view item
  const handleViewItem = (item) => {
    setItemToView(item)
    setShowViewModal(true)
  }

  // Handle stock adjustment
  const handleStockAdjustment = async (e) => {
    e.preventDefault()
    if (!itemToAdjust) return

    setIsSubmitting(true)
    try {
      await inventoryAPI.adjustStock(
        itemToAdjust.id,
        Number.parseInt(stockAdjustment.new_quantity),
        stockAdjustment.reason,
      )
      setShowStockModal(false)
      setItemToAdjust(null)
      setStockAdjustment({ new_quantity: "", reason: "" })
      fetchInventory()
      fetchStats()
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open stock adjustment modal
  const openStockModal = (item) => {
    setItemToAdjust(item)
    setStockAdjustment({
      new_quantity: item.current_stock?.toString() || "",
      reason: "",
    })
    setShowStockModal(true)
  }

  // Handle search and filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchInventory()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedBrand, selectedCategory, isActiveFilter, lowStockOnly, outOfStockOnly])

  // Fetch inventory on page/size change
  useEffect(() => {
    fetchInventory()
  }, [currentPage, pageSize])

  // Initial load
  useEffect(() => {
    fetchInventory()
    fetchStats()
    fetchProducts()
    fetchBrands()
    fetchCategories()
  }, [])

  const getStatusColor = (isActive) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle size={16} /> : <XCircle size={16} />
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const getStockStatus = (item) => {
    if (item.is_out_of_stock)
      return { text: "Out of Stock", color: "bg-red-100 text-red-800", icon: <Archive size={12} /> }
    if (item.is_low_stock)
      return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800", icon: <AlertTriangle size={12} /> }
    return { text: "In Stock", color: "bg-green-100 text-green-800", icon: <CheckCircle size={12} /> }
  }

  const getProductName = (productId) => {
    if (!productId) return "No Product"
    const product = products.find((p) => p.id === productId)
    return product ? product.name : "Unknown Product"
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedBrand("")
    setSelectedCategory("")
    setIsActiveFilter("")
    setLowStockOnly(false)
    setOutOfStockOnly(false)
  }

  return (
    <DashboardLayout title="Inventory" subtitle="Manage your inventory items" currentPath="/dashboard/inventory">
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
            <span>Add Inventory Item</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total_items || 0}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Package2 size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Items</p>
                <p className="text-2xl font-bold text-gray-800">{stats.active_items || 0}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <CheckCircle size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-800">{stats.low_stock_items || 0}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <AlertTriangle size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-800">{stats.out_of_stock_items || 0}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Archive size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Value</p>
                <p className="text-2xl font-bold text-gray-800">{formatPrice(stats.total_stock_value || 0)}</p>
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
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search inventory by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                />
              </div>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="">All Brands</option>
                {brands
                  .filter((brand) => brand.is_active)
                  .map((brand) => (
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
                {categories
                  .filter((category) => category.is_active)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>

              <select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Low Stock</span>
              </label>

              <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg">
                <input
                  type="checkbox"
                  checked={outOfStockOnly}
                  onChange={(e) => setOutOfStockOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Out of Stock</span>
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

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Inventory Items ({startIndex}-{endIndex} of {totalItems})
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                style={{ borderColor: "#E213A7" }}
              ></div>
              <p className="text-gray-600">Loading inventory...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
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
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
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
                    {inventory.map((item) => {
                      const stockStatus = getStockStatus(item)
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center mr-3">
                                <Package2 size={20} style={{ color: "#E213A7" }} />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {item.description || "No description"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600">
                              <Hash size={12} className="mr-1" />
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{item.sku || "No SKU"}</code>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{item.brand?.name || "No Brand"}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{item.category?.name || "No Category"}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              <DollarSign size={12} className="mr-1" />
                              {formatPrice(item.selling_price)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {item.current_stock} / {item.minimum_stock} min
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full mt-1 flex items-center ${stockStatus.color}`}
                              >
                                {stockStatus.icon}
                                <span className="ml-1">{stockStatus.text}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.is_active)}`}
                            >
                              {getStatusIcon(item.is_active)}
                              <span className="ml-1">{item.is_active ? "Active" : "Inactive"}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openStockModal(item)}
                                className="text-gray-400 hover:text-green-600 p-1"
                                title="Adjust Stock"
                              >
                                <RotateCcw size={16} />
                              </button>
                              <button
                                onClick={() => handleViewItem(item)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-gray-400 hover:text-blue-600 p-1"
                                title="Edit Item"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setItemToDelete(item)
                                  setShowDeleteModal(true)
                                }}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Delete Item"
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
                      Showing {startIndex} to {endIndex} of {totalItems} items
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

              {inventory.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Package2 size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No inventory items found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || selectedBrand || selectedCategory || lowStockOnly || outOfStockOnly
                      ? "Try adjusting your search criteria"
                      : "Get started by adding your first inventory item"}
                  </p>
                  <button
                    onClick={openAddModal}
                    className="text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#E213A7" }}
                  >
                    Add Inventory Item
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add/Edit Inventory Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add" ? "Add New Inventory Item" : "Edit Inventory Item"}
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
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Enter item name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                    <select
                      value={formData.product_id}
                      onChange={(e) => handleInputChange("product_id", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    >
                      <option value="">Select a product</option>
                      {products
                        .filter((product) => product.is_active)
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                    </select>
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
                    placeholder="Enter item description"
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => handleInputChange("cost_price", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => handleInputChange("selling_price", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Stock Information */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.current_stock}
                      onChange={(e) => handleInputChange("current_stock", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minimum_stock}
                      onChange={(e) => handleInputChange("minimum_stock", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maximum_stock}
                      onChange={(e) => handleInputChange("maximum_stock", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Point</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reorder_point}
                      onChange={(e) => handleInputChange("reorder_point", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reorder_quantity}
                      onChange={(e) => handleInputChange("reorder_quantity", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
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

                {/* Physical Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => handleInputChange("dimensions", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="L x W x H"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleInputChange("color", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Enter color"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shade</label>
                    <input
                      type="text"
                      value={formData.shade}
                      onChange={(e) => handleInputChange("shade", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Enter shade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => handleInputChange("size", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Enter size"
                    />
                  </div>
                </div>

                {/* Supplier Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
                    <input
                      type="text"
                      value={formData.supplier_name}
                      onChange={(e) => handleInputChange("supplier_name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Contact</label>
                    <input
                      type="text"
                      value={formData.supplier_contact}
                      onChange={(e) => handleInputChange("supplier_contact", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Enter supplier contact"
                    />
                  </div>
                </div>

                {/* Featured */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => handleInputChange("is_featured", e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured Item</span>
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
                        ? "Add Item"
                        : "Update Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {showStockModal && itemToAdjust && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Adjust Stock</h3>
                  <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleStockAdjustment} className="p-6 space-y-6">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-800">{itemToAdjust.name}</h4>
                  <p className="text-sm text-gray-600">Current Stock: {itemToAdjust.current_stock}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stockAdjustment.new_quantity}
                    onChange={(e) => setStockAdjustment((prev) => ({ ...prev, new_quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Enter new quantity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={stockAdjustment.reason}
                    onChange={(e) => setStockAdjustment((prev) => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="e.g., Restock, Damaged, Sold"
                  />
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
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
                    {isSubmitting ? "Adjusting..." : "Adjust Stock"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && itemToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-red-100 mr-4">
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Delete Inventory Item</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete <span className="font-medium">"{itemToDelete.name}"</span>? This will
                  permanently remove the item from your inventory.
                </p>

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setItemToDelete(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteItem}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Deleting..." : "Delete Item"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Item Modal */}
        {showViewModal && itemToView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Inventory Item Details</h3>
                  <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Item Header */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center">
                    <Package2 size={32} style={{ color: "#E213A7" }} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800">{itemToView.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(itemToView.is_active)}`}
                      >
                        {getStatusIcon(itemToView.is_active)}
                        <span className="ml-1">{itemToView.is_active ? "Active" : "Inactive"}</span>
                      </span>
                      {itemToView.is_featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <TrendingUp size={12} className="mr-1" />
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 mb-3">Basic Information</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">SKU:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{itemToView.sku || "No SKU"}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium text-gray-800">{getProductName(itemToView.product_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium text-gray-800">{itemToView.brand?.name || "No Brand"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-800">{itemToView.category?.name || "No Category"}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 mb-3">Pricing & Stock</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost Price:</span>
                      <span className="font-medium text-gray-800">{formatPrice(itemToView.cost_price || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selling Price:</span>
                      <span className="font-medium text-gray-800">{formatPrice(itemToView.selling_price || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Stock:</span>
                      <span className="font-medium text-gray-800">{itemToView.current_stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Minimum Stock:</span>
                      <span className="font-medium text-gray-800">{itemToView.minimum_stock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stock Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStockStatus(itemToView).color}`}>
                        {getStockStatus(itemToView).text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Physical Attributes */}
                {(itemToView.color ||
                  itemToView.shade ||
                  itemToView.size ||
                  itemToView.weight ||
                  itemToView.dimensions) && (
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Physical Attributes</h5>
                    <div className="grid grid-cols-2 gap-4">
                      {itemToView.color && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium text-gray-800">{itemToView.color}</span>
                        </div>
                      )}
                      {itemToView.shade && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shade:</span>
                          <span className="font-medium text-gray-800">{itemToView.shade}</span>
                        </div>
                      )}
                      {itemToView.size && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium text-gray-800">{itemToView.size}</span>
                        </div>
                      )}
                      {itemToView.weight && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Weight:</span>
                          <span className="font-medium text-gray-800">{itemToView.weight}</span>
                        </div>
                      )}
                      {itemToView.dimensions && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dimensions:</span>
                          <span className="font-medium text-gray-800">{itemToView.dimensions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Supplier Information */}
                {(itemToView.supplier_name || itemToView.supplier_contact) && (
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Supplier Information</h5>
                    <div className="grid grid-cols-1 gap-4">
                      {itemToView.supplier_name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supplier Name:</span>
                          <span className="font-medium text-gray-800">{itemToView.supplier_name}</span>
                        </div>
                      )}
                      {itemToView.supplier_contact && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supplier Contact:</span>
                          <span className="font-medium text-gray-800">{itemToView.supplier_contact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {itemToView.description && (
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Description</h5>
                    <div className="text-gray-700 bg-gray-50 p-3 rounded-lg">{itemToView.description}</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      openStockModal(itemToView)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <RotateCcw size={16} />
                    <span>Adjust Stock</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      openEditModal(itemToView)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Item
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
