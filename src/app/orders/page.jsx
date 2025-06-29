"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "../../components/dashboard-layout"
import {
  Plus,
  Search,
  ShoppingCart,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  User,
  Filter,
  MoreHorizontal,
} from "lucide-react"
import api from "../../lib/api"
import handleApiError from "../../lib/handleApiError"

// API functions
const ordersAPI = {
  getOrders: async (params) => {
    try {
      const response = await api.get("/orders", { params })
      return response.data
    } catch (error) {
      throw error
    }
  },
  confirmOrder: async (orderId) => {
    try {
      const response = await api.post(`/orders/${orderId}/confirm`)
      return response.data
    } catch (error) {
      throw error
    }
  },
  cancelOrder: async (orderId, reason) => {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, null, {
        params: { reason },
      })
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showViewModal, setShowViewModal] = useState(false)
  const [orderToView, setOrderToView] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalOrders, setTotalOrders] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("")

  // Calculate pagination
  const totalPages = Math.ceil(totalOrders / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalOrders)

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true)
    setError("")
    try {
      const params = {
        page: currentPage,
        size: pageSize,
      }
      if (searchTerm) params.search = searchTerm
      if (statusFilter) params.status = statusFilter
      if (paymentStatusFilter) params.payment_status = paymentStatusFilter

      const data = await ordersAPI.getOrders(params)
      // Handle direct array response
      if (Array.isArray(data)) {
        setOrders(data)
        setTotalOrders(data.length)
      } else {
        setOrders(data.orders || [])
        setTotalOrders(data.total || 0)
      }
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle confirm order
  const handleConfirmOrder = async (orderId) => {
    setIsSubmitting(true)
    try {
      await ordersAPI.confirmOrder(orderId)
      fetchOrders() // Refresh the list
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!orderToCancel || !cancelReason.trim()) return

    setIsSubmitting(true)
    try {
      await ordersAPI.cancelOrder(orderToCancel.id, cancelReason)
      setShowCancelModal(false)
      setOrderToCancel(null)
      setCancelReason("")
      fetchOrders() // Refresh the list
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle view order
  const handleViewOrder = (order) => {
    setOrderToView(order)
    setShowViewModal(true)
  }

  // Handle search and filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchOrders()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, paymentStatusFilter])

  // Fetch orders on page/size change
  useEffect(() => {
    fetchOrders()
  }, [currentPage, pageSize])

  // Initial load
  useEffect(() => {
    fetchOrders()
  }, [])

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-green-100 text-green-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      partial: "bg-orange-100 text-orange-800",
      refunded: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={12} />,
      confirmed: <CheckCircle size={12} />,
      processing: <Package size={12} />,
      shipped: <Truck size={12} />,
      delivered: <CheckCircle size={12} />,
      cancelled: <XCircle size={12} />,
    }
    return icons[status] || <Clock size={12} />
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setPaymentStatusFilter("")
  }

  const timeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  return (
    <DashboardLayout title="Orders" subtitle="Manage customer orders" currentPath="/orders">
      <div className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center justify-between">
            <p>{error}</p>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-800 cursor-pointer">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="w-full flex items-center justify-end mb-6">
          <button
            onClick={() => (window.location.href = "/orders/create")}
            className="flex items-center space-x-2 text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: "#E213A7" }}
          >
            <Plus size={20} />
            <span>Create Order</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <ShoppingCart size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-800">
                  {orders.filter((order) => order.status === "pending").length}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Clock size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-800">
                  {orders.filter((order) => ["confirmed", "processing"].includes(order.status)).length}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Package size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-gray-800">
                  {orders.filter((order) => order.status === "shipped").length}
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                <Truck size={24} style={{ color: "#E213A7" }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatPrice(orders.reduce((total, order) => total + (order.total_amount || 0), 0))}
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
                placeholder="Search orders by number, customer, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                <option value="">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="refunded">Refunded</option>
              </select>

              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2 cursor-pointer"
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

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Orders ({startIndex}-{endIndex} of {totalOrders})
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                style={{ borderColor: "#E213A7" }}
              ></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center mr-3">
                              <ShoppingCart size={20} style={{ color: "#E213A7" }} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                              <div className="text-sm text-gray-500">#{order.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <User size={16} className="text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.customer?.first_name} {order.customer?.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{order.customer?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? "s" : ""}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.order_items?.reduce((total, item) => total + item.quantity, 0) || 0} units
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatPrice(order.total_amount)}</div>
                          {order.outstanding_amount > 0 && (
                            <div className="text-sm text-red-600">
                              Outstanding: {formatPrice(order.outstanding_amount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                          >
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}
                          >
                            <span className="capitalize">{order.payment_status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">{timeAgo(order.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {order.status === "pending" && (
                              <button
                                onClick={() => handleConfirmOrder(order.id)}
                                disabled={isSubmitting}
                                className="text-gray-400 hover:text-green-600 p-1"
                                title="Confirm Order"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {["pending", "confirmed"].includes(order.status) && (
                              <button
                                onClick={() => {
                                  setOrderToCancel(order)
                                  setShowCancelModal(true)
                                }}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Cancel Order"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                            <button className="text-gray-400 hover:text-gray-600 p-1" title="More Actions">
                              <MoreHorizontal size={16} />
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
                      Showing {startIndex} to {endIndex} of {totalOrders} orders
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

              {orders.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <ShoppingCart size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No orders found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter || paymentStatusFilter
                      ? "Try adjusting your search criteria"
                      : "Get started by creating your first order"}
                  </p>
                  <button
                    onClick={() => (window.location.href = "/orders/create")}
                    className="text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#E213A7" }}
                  >
                    Create Order
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Cancel Order Modal */}
        {showCancelModal && orderToCancel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-red-100 mr-4">
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Cancel Order</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">
                  Are you sure you want to cancel order{" "}
                  <span className="font-medium">"{orderToCancel.order_number}"</span>?
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    placeholder="Enter reason for cancellation"
                  />
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowCancelModal(false)
                      setOrderToCancel(null)
                      setCancelReason("")
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={isSubmitting || !cancelReason.trim()}
                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Cancelling..." : "Cancel Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Order Modal */}
        {showViewModal && orderToView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Order Details</h3>
                  <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800">{orderToView.order_number}</h4>
                    <p className="text-sm text-gray-600">Order ID: #{orderToView.id}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderToView.status)}`}
                    >
                      {getStatusIcon(orderToView.status)}
                      <span className="ml-1 capitalize">{orderToView.status}</span>
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(orderToView.payment_status)}`}
                    >
                      <span className="capitalize">{orderToView.payment_status}</span>
                    </span>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Customer Information</h5>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-gray-600">Name:</span>{" "}
                        <span className="font-medium">
                          {orderToView.customer?.first_name} {orderToView.customer?.last_name}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-600">Email:</span>{" "}
                        <span className="font-medium">{orderToView.customer?.email}</span>
                      </p>
                      {orderToView.customer?.instagram_handle && (
                        <p className="text-sm">
                          <span className="text-gray-600">Instagram:</span>{" "}
                          <span className="font-medium">@{orderToView.customer?.instagram_handle}</span>
                        </p>
                      )}
                      {orderToView.customer?.is_vip && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          VIP Customer
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Order Information</h5>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-gray-600">Source:</span>{" "}
                        <span className="font-medium capitalize">{orderToView.order_source || "N/A"}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-600">Delivery Method:</span>{" "}
                        <span className="font-medium capitalize">{orderToView.delivery_method || "N/A"}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-600">Created:</span>{" "}
                        <span className="font-medium">
                          {orderToView.created_at ? new Date(orderToView.created_at).toLocaleString() : "N/A"}
                        </span>
                      </p>
                      {orderToView.confirmed_at && (
                        <p className="text-sm">
                          <span className="text-gray-600">Confirmed:</span>{" "}
                          <span className="font-medium">{new Date(orderToView.confirmed_at).toLocaleString()}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h5 className="text-md font-medium text-gray-800 mb-3">Order Items</h5>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orderToView.order_items?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                <div className="text-sm text-gray-500">{item.product_description}</div>
                                {item.requested_color && (
                                  <div className="text-xs text-gray-500">Color: {item.requested_color}</div>
                                )}
                                {item.notes && <div className="text-xs text-gray-500">Notes: {item.notes}</div>}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs">{item.product_sku}</code>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">{item.quantity}</div>
                              <div className="text-xs text-gray-500">
                                Allocated: {item.allocated_quantity} | Fulfilled: {item.fulfilled_quantity}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">{formatPrice(item.unit_price)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{formatPrice(item.total_price)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {item.is_fully_allocated ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Allocated
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending: {item.pending_allocation}
                                  </span>
                                )}
                                {item.is_fully_fulfilled && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Fulfilled
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Shipping Address</h5>
                    <div className="text-sm text-gray-600">
                      {orderToView.shipping_address_line1 ? (
                        <div className="space-y-1">
                          <p>{orderToView.shipping_address_line1}</p>
                          {orderToView.shipping_address_line2 && <p>{orderToView.shipping_address_line2}</p>}
                          <p>
                            {orderToView.shipping_city}, {orderToView.shipping_state} {orderToView.shipping_postal_code}
                          </p>
                          <p>{orderToView.shipping_country}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No shipping address provided</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">Order Summary</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatPrice(orderToView.subtotal)}</span>
                      </div>
                      {orderToView.discount_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-green-600">
                            -{formatPrice(orderToView.discount_amount)}
                          </span>
                        </div>
                      )}
                      {orderToView.tax_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax:</span>
                          <span className="font-medium">{formatPrice(orderToView.tax_amount)}</span>
                        </div>
                      )}
                      {orderToView.shipping_cost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping:</span>
                          <span className="font-medium">{formatPrice(orderToView.shipping_cost)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-base font-semibold">
                          <span>Total:</span>
                          <span>{formatPrice(orderToView.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="font-medium">{formatPrice(orderToView.amount_paid)}</span>
                        </div>
                        {orderToView.outstanding_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Outstanding:</span>
                            <span className="font-medium text-red-600">
                              {formatPrice(orderToView.outstanding_amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  {orderToView.status === "pending" && (
                    <button
                      onClick={() => {
                        setShowViewModal(false)
                        handleConfirmOrder(orderToView.id)
                      }}
                      className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      Confirm Order
                    </button>
                  )}
                  {["pending", "confirmed"].includes(orderToView.status) && (
                    <button
                      onClick={() => {
                        setShowViewModal(false)
                        setOrderToCancel(orderToView)
                        setShowCancelModal(true)
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Close
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
