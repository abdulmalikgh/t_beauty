"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "../../../components/dashboard-layout"
import { Search, ShoppingCart, X, Package, User, Trash2, ArrowLeft, AlertTriangle } from "lucide-react"
import api from "../../../lib/api"
import handleApiError from "../../../lib/handleApiError"

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
}

const customersAPI = {
  getCustomers: async (params) => {
    try {
      const response = await api.get("/customers", { params })
      return response.data
    } catch (error) {
      throw error
    }
  },
}

const ordersAPI = {
  createOrder: async (orderData) => {
    try {
      const response = await api.post("/orders", orderData)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default function CreateOrderPage() {
  const [step, setStep] = useState(1) // 1: Select Products, 2: Order Details, 3: Review
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Search states
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [customerSearchTerm, setCustomerSearchTerm] = useState("")
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)

  // Order form data
  const [orderData, setOrderData] = useState({
    customer_id: "",
    customer: null,
    delivery_method: "standard",
    order_source: "manual",
    customer_notes: "",
    special_instructions: "",
  })

  // Fetch products
  const fetchProducts = async (search = "") => {
    setLoading(true)
    try {
      const params = { size: 50 }
      if (search) params.search = search

      const data = await productsAPI.getProducts(params)
      setProducts(data.products || [])
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch customers
  const fetchCustomers = async (search = "") => {
    setLoading(true)
    try {
      const params = { size: 50 }
      if (search) params.search = search

      const data = await customersAPI.getCustomers(params)
      setCustomers(data.customers || [])
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle product selection
  const handleProductSelect = (product) => {
    const existingIndex = selectedProducts.findIndex((p) => p.id === product.id)
    if (existingIndex >= 0) {
      // Update quantity if already selected
      const updated = [...selectedProducts]
      updated[existingIndex].quantity += 1
      setSelectedProducts(updated)
    } else {
      // Add new product
      setSelectedProducts([
        ...selectedProducts,
        {
          ...product,
          quantity: 1,
          unit_price: product.base_price,
          requested_color: "",
          notes: "",
        },
      ])
    }
    setShowProductSearch(false)
  }

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setOrderData({
      ...orderData,
      customer_id: customer.id,
      customer: customer,
    })
    setShowCustomerSearch(false)
  }

  // Update selected product
  const updateSelectedProduct = (index, field, value) => {
    const updated = [...selectedProducts]
    updated[index][field] = value
    setSelectedProducts(updated)
  }

  // Remove selected product
  const removeSelectedProduct = (index) => {
    const updated = selectedProducts.filter((_, i) => i !== index)
    setSelectedProducts(updated)
  }

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = selectedProducts.reduce((total, product) => {
      return total + product.quantity * product.unit_price
    }, 0)
    return {
      subtotal,
      total: subtotal, // For now, no tax or shipping
    }
  }

  // Handle order creation
  const handleCreateOrder = async () => {
    if (!orderData.customer_id || selectedProducts.length === 0) {
      setError("Please select a customer and at least one product")
      return
    }

    setIsSubmitting(true)
    try {
      const orderPayload = {
        customer_id: orderData.customer_id,
        items: selectedProducts.map((product) => ({
          product_id: product.id,
          quantity: product.quantity,
          unit_price: product.unit_price,
          requested_color: product.requested_color,
          notes: product.notes,
        })),
      }

      await ordersAPI.createOrder(orderPayload)
      // Redirect to orders page
      window.location.href = "/orders"
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showProductSearch) {
        fetchProducts(productSearchTerm)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [productSearchTerm, showProductSearch])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showCustomerSearch) {
        fetchCustomers(customerSearchTerm)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [customerSearchTerm, showCustomerSearch])

  // Initial load
  useEffect(() => {
    fetchProducts()
    fetchCustomers()
  }, [])

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const totals = calculateTotals()

  return (
    <DashboardLayout title="Create Order" subtitle="Create a new customer order" currentPath="/orders/create">
      <div className="max-w-6xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center justify-between">
            <p>{error}</p>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-800">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => (window.location.href = "/orders")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            <ArrowLeft size={20} />
            <span>Back to Orders</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? "text-white" : "bg-gray-200 text-gray-600"
                }`}
                style={step >= 1 ? { backgroundColor: "#E213A7" } : {}}
              >
                1
              </div>
              <span className={`text-sm ${step >= 1 ? "text-gray-800" : "text-gray-500"}`}>Products</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? "text-white" : "bg-gray-200 text-gray-600"
                }`}
                style={step >= 2 ? { backgroundColor: "#E213A7" } : {}}
              >
                2
              </div>
              <span className={`text-sm ${step >= 2 ? "text-gray-800" : "text-gray-500"}`}>Details</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3 ? "text-white" : "bg-gray-200 text-gray-600"
                }`}
                style={step >= 3 ? { backgroundColor: "#E213A7" } : {}}
              >
                3
              </div>
              <span className={`text-sm ${step >= 3 ? "text-gray-800" : "text-gray-500"}`}>Review</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Select Products */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Select Products</h3>
                  <p className="text-sm text-gray-600">Search and add products to the order</p>
                </div>

                <div className="p-6">
                  {/* Product Search */}
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      onFocus={() => setShowProductSearch(true)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    />

                    {/* Product Search Results */}
                    {showProductSearch && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                        {loading ? (
                          <div className="p-4 text-center">
                            <div
                              className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto"
                              style={{ borderColor: "#E213A7" }}
                            ></div>
                          </div>
                        ) : products.length > 0 ? (
                          products.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => handleProductSelect(product)}
                              className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-800">{product.name}</div>
                                  <div className="text-sm text-gray-600">{product.description}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-gray-800">{formatPrice(product.base_price)}</div>
                                  <div className="text-sm text-gray-600">Stock: {product.quantity}</div>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">No products found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Products */}
                  <div className="space-y-4">
                    {selectedProducts.map((product, index) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{product.name}</h4>
                            <p className="text-sm text-gray-600">{product.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={product.quantity}
                                  onChange={(e) =>
                                    updateSelectedProduct(index, "quantity", Number.parseInt(e.target.value) || 1)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={product.unit_price}
                                  onChange={(e) =>
                                    updateSelectedProduct(index, "unit_price", Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Color</label>
                                <input
                                  type="text"
                                  value={product.requested_color}
                                  onChange={(e) => updateSelectedProduct(index, "requested_color", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                  placeholder="e.g., red, blue"
                                />
                              </div>
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                value={product.notes}
                                onChange={(e) => updateSelectedProduct(index, "notes", e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                                placeholder="Special instructions or notes"
                              />
                            </div>
                          </div>

                          <div className="ml-4 flex flex-col items-end">
                            <button
                              onClick={() => removeSelectedProduct(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="mt-2 text-right">
                              <div className="text-lg font-semibold text-gray-800">
                                {formatPrice(product.quantity * product.unit_price)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedProducts.length === 0 && (
                      <div className="text-center py-8">
                        <Package size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No products selected</h3>
                        <p className="text-gray-600">Search and select products to add to the order</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Order Details */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Order Details</h3>
                  <p className="text-sm text-gray-600">Select customer and configure order settings</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Customer Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      {orderData.customer ? (
                        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <User size={16} className="text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">
                                {orderData.customer.first_name} {orderData.customer.last_name}
                              </div>
                              <div className="text-sm text-gray-600">{orderData.customer.email}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setOrderData({ ...orderData, customer_id: "", customer: null })}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={20}
                          />
                          <input
                            type="text"
                            placeholder="Search customers..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            onFocus={() => setShowCustomerSearch(true)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                          />

                          {/* Customer Search Results */}
                          {showCustomerSearch && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                              {loading ? (
                                <div className="p-4 text-center">
                                  <div
                                    className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto"
                                    style={{ borderColor: "#E213A7" }}
                                  ></div>
                                </div>
                              ) : customers.length > 0 ? (
                                customers.map((customer) => (
                                  <button
                                    key={customer.id}
                                    onClick={() => handleCustomerSelect(customer)}
                                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                        <User size={16} className="text-gray-600" />
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-800">
                                          {customer.first_name} {customer.last_name}
                                        </div>
                                        <div className="text-sm text-gray-600">{customer.email}</div>
                                        {customer.instagram_handle && (
                                          <div className="text-sm text-gray-500">@{customer.instagram_handle}</div>
                                        )}
                                      </div>
                                      {customer.is_vip && (
                                        <span className="ml-auto inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                          VIP
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-center text-gray-500">No customers found</div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Order Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Method</label>
                      <select
                        value={orderData.delivery_method}
                        onChange={(e) => setOrderData({ ...orderData, delivery_method: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      >
                        <option value="standard">Standard Delivery</option>
                        <option value="express">Express Delivery</option>
                        <option value="pickup">Pickup</option>
                        <option value="same_day">Same Day Delivery</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order Source</label>
                      <select
                        value={orderData.order_source}
                        onChange={(e) => setOrderData({ ...orderData, order_source: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      >
                        <option value="manual">Manual Entry</option>
                        <option value="instagram">Instagram</option>
                        <option value="website">Website</option>
                        <option value="phone">Phone</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Notes</label>
                    <textarea
                      value={orderData.customer_notes}
                      onChange={(e) => setOrderData({ ...orderData, customer_notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Any notes from the customer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                    <textarea
                      value={orderData.special_instructions}
                      onChange={(e) => setOrderData({ ...orderData, special_instructions: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Internal notes and special instructions"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Review Order</h3>
                  <p className="text-sm text-gray-600">Review all order details before creating</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Customer Information</h4>
                    {orderData.customer && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <User size={20} className="text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {orderData.customer.first_name} {orderData.customer.last_name}
                            </div>
                            <div className="text-sm text-gray-600">{orderData.customer.email}</div>
                            {orderData.customer.instagram_handle && (
                              <div className="text-sm text-gray-500">@{orderData.customer.instagram_handle}</div>
                            )}
                          </div>
                          {orderData.customer.is_vip && (
                            <span className="ml-auto inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              VIP Customer
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Order Items</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Unit Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedProducts.map((product, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3">
                                <div>
                                  <div className="font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-500">{product.description}</div>
                                  {product.requested_color && (
                                    <div className="text-xs text-gray-500">Color: {product.requested_color}</div>
                                  )}
                                  {product.notes && <div className="text-xs text-gray-500">Notes: {product.notes}</div>}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{product.quantity}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(product.unit_price)}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {formatPrice(product.quantity * product.unit_price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Order Settings */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Order Settings</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Method:</span>
                        <span className="font-medium capitalize">{orderData.delivery_method.replace("_", " ")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Order Source:</span>
                        <span className="font-medium capitalize">{orderData.order_source}</span>
                      </div>
                      {orderData.customer_notes && (
                        <div className="pt-2 border-t">
                          <div className="text-sm text-gray-600">Customer Notes:</div>
                          <div className="text-sm text-gray-800">{orderData.customer_notes}</div>
                        </div>
                      )}
                      {orderData.special_instructions && (
                        <div className="pt-2 border-t">
                          <div className="text-sm text-gray-600">Special Instructions:</div>
                          <div className="text-sm text-gray-800">{orderData.special_instructions}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <ShoppingCart size={20} className="mr-2" />
                  Order Summary
                </h3>
              </div>

              <div className="p-6">
                {/* Selected Products Count */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{selectedProducts.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Quantity:</span>
                    <span className="font-medium">
                      {selectedProducts.reduce((total, product) => total + product.quantity, 0)}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                {orderData.customer && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Customer:</div>
                    <div className="font-medium text-gray-800">
                      {orderData.customer.first_name} {orderData.customer.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{orderData.customer.email}</div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatPrice(0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">{formatPrice(0)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-800">Total:</span>
                      <span className="text-lg font-semibold text-gray-800">{formatPrice(totals.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {step === 1 && (
                    <button
                      onClick={() => setStep(2)}
                      disabled={selectedProducts.length === 0}
                      className="w-full py-2 px-4 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#E213A7" }}
                    >
                      Continue to Details
                    </button>
                  )}

                  {step === 2 && (
                    <>
                      <button
                        onClick={() => setStep(3)}
                        disabled={!orderData.customer_id}
                        className="w-full py-2 px-4 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#E213A7" }}
                      >
                        Review Order
                      </button>
                      <button
                        onClick={() => setStep(1)}
                        className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back to Products
                      </button>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <button
                        onClick={handleCreateOrder}
                        disabled={isSubmitting || !orderData.customer_id || selectedProducts.length === 0}
                        className="w-full py-2 px-4 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#E213A7" }}
                      >
                        {isSubmitting ? "Creating Order..." : "Create Order"}
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back to Details
                      </button>
                    </>
                  )}
                </div>

                {/* Validation Messages */}
                {step === 1 && selectedProducts.length === 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle size={16} className="text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">Please select at least one product</span>
                    </div>
                  </div>
                )}

                {step === 2 && !orderData.customer_id && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle size={16} className="text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">Please select a customer</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Click outside to close dropdowns */}
        {(showProductSearch || showCustomerSearch) && (
          <div
            className="fixed inset-0 z-5"
            onClick={() => {
              setShowProductSearch(false)
              setShowCustomerSearch(false)
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
