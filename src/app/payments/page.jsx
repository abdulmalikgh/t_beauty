"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  DollarSign,
  CreditCard,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Banknote,
  Smartphone,
  Building,
  Coins,
  Receipt,
  Zap,
  FileText,
  TrendingUp,
  Users,
  Package,
} from "lucide-react"
import api from "../../lib/api"
import handleApiError from "../../lib/handleApiError"
import DashboardLayout from "../../components/dashboard-layout"

// API functions
const paymentsAPI = {
  getPayments: async (params) => {
    try {
      const response = await api.get("/payments", { params })
      return response.data
    } catch (error) {
      throw error
    }
  },
  getPaymentStats: async () => {
    try {
      const response = await api.get("/payments/stats")
      return response.data
    } catch (error) {
      throw error
    }
  },
  verifyPayment: async (paymentId) => {
    try {
      const response = await api.post(`/payments/${paymentId}/verify`)
      return response.data
    } catch (error) {
      throw error
    }
  },
  getPayment: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

const invoicesAPI = {
  createInvoice: async (invoiceData) => {
    try {
      const response = await api.post("/invoices", invoiceData)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [paymentToView, setPaymentToView] = useState(null)

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPayments, setTotalPayments] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("")
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("")
  const [dateRangeFilter, setDateRangeFilter] = useState("")

  // Payment methods configuration
  const paymentMethods = [
    { value: "cash", label: "Cash", icon: <Banknote size={16} /> },
    { value: "bank_transfer", label: "Bank Transfer", icon: <Building size={16} /> },
    { value: "pos", label: "POS Terminal", icon: <CreditCard size={16} /> },
    { value: "mobile_money", label: "Mobile Money", icon: <Smartphone size={16} /> },
    { value: "instagram_payment", label: "Instagram Payment", icon: <Receipt size={16} /> },
    { value: "crypto", label: "Cryptocurrency", icon: <Coins size={16} /> },
    { value: "other", label: "Other", icon: <MoreHorizontal size={16} /> },
  ]

  // Calculate pagination
  const totalPages = Math.ceil(totalPayments / pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalPayments)

  // Fetch payments
  const fetchPayments = async () => {
    setLoading(true)
    setError("")
    try {
      const params = {
        page: currentPage,
        size: pageSize,
      }
      if (searchTerm) params.search = searchTerm
      if (paymentMethodFilter) params.payment_method = paymentMethodFilter
      if (verificationStatusFilter) params.is_verified = verificationStatusFilter === "verified"
      if (dateRangeFilter) params.date_range = dateRangeFilter

      const data = await paymentsAPI.getPayments(params)
      // Handle direct array response or paginated response
      if (Array.isArray(data)) {
        setPayments(data)
        setTotalPayments(data.length)
      } else {
        setPayments(data.payments || [])
        setTotalPayments(data.total || 0)
      }
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch payment stats
  const fetchPaymentStats = async () => {
    try {
      const data = await paymentsAPI.getPaymentStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch payment stats:", error)
    }
  }

  // Handle view payment
  const handleViewPayment = async (payment) => {
    try {
      const fullPaymentData = await paymentsAPI.getPayment(payment.id)
      setPaymentToView(fullPaymentData)
      setShowViewModal(true)
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    }
  }

  // Handle payment verification
  const handleVerifyPayment = async (paymentId) => {
    setIsSubmitting(true)
    try {
      const result = await paymentsAPI.verifyPayment(paymentId)

      // Update the payment in the list
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === paymentId
            ? { ...payment, is_verified: true, verification_date: result.verification_date }
            : payment,
        ),
      )

      // Update the viewed payment if it's open
      if (paymentToView && paymentToView.id === paymentId) {
        setPaymentToView((prev) => ({
          ...prev,
          is_verified: true,
          verification_date: result.verification_date,
        }))
      }

      fetchPaymentStats() // Refresh stats
      alert(`Payment verified successfully! Amount: ${formatPrice(result.amount)}`)
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle generate invoice
  const handleGenerateInvoice = async (payment) => {
    if (!payment.order && !payment.customer_id) return

    setIsSubmitting(true)
    try {
      // Build invoice items from order data if available
      let invoiceItems = []

      if (payment.order && payment.order.order_items) {
        // Use actual order items
        invoiceItems = payment.order.order_items.map((item) => ({
          description: item.product_name || item.description || "Product",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          discount_amount: item.discount_amount || 0,
        }))
      } else {
        // Fallback to payment amount as single item
        invoiceItems = [
          {
            description: `Payment - ${payment.payment_reference}`,
            quantity: 1,
            unit_price: payment.amount,
            discount_amount: 0,
          },
        ]
      }

      const invoiceData = {
        customer_id: payment.customer_id,
        order_id: payment.order_id || null,
        description: `Invoice for Order ${payment.order?.order_number || payment.order_id} - Payment ${payment.payment_reference}`,
        notes: payment.notes || `Generated from payment ${payment.payment_reference}`,
        terms_and_conditions: "Payment due within 30 days. Late fees may apply.",
        payment_terms: "Net 30",
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: invoiceItems, // API expects 'items' not 'invoice_items'
      }

      const result = await invoicesAPI.createInvoice(invoiceData)

      router.push(`/invoice/${result.id}`)
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle search and filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchPayments()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, paymentMethodFilter, verificationStatusFilter, dateRangeFilter])

  // Fetch payments on page/size change
  useEffect(() => {
    fetchPayments()
  }, [currentPage, pageSize])

  // Initial load
  useEffect(() => {
    fetchPayments()
    fetchPaymentStats()
  }, [])

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const getPaymentMethodIcon = (method) => {
    const methodConfig = paymentMethods.find((m) => m.value === method)
    return methodConfig ? methodConfig.icon : <CreditCard size={16} />
  }

  const getPaymentMethodLabel = (method) => {
    const methodConfig = paymentMethods.find((m) => m.value === method)
    return methodConfig ? methodConfig.label : method?.replace("_", " ") || "Unknown"
  }

  const clearFilters = () => {
    setSearchTerm("")
    setPaymentMethodFilter("")
    setVerificationStatusFilter("")
    setDateRangeFilter("")
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
      <DashboardLayout title="Payments" subtitle="Manage customer payments" currentPath="/payments">
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
                  <p className="text-gray-600 mt-1">Manage and track all payment transactions</p>
                </div>
                <button
                  onClick={() => router.push("/orders")}
                  className="flex items-center space-x-2 text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#E213A7" }}
                >
                  <Package size={20} />
                  <span>View Orders</span>
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle size={20} className="mr-3" />
                  <p>{error}</p>
                </div>
                <button onClick={() => setError("")} className="text-red-600 hover:text-red-800">
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_payments || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatPrice(stats.total_amount || 0)} total value</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                    <CreditCard size={24} style={{ color: "#E213A7" }} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Verified Payments</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.verified_payments || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatPrice(stats.verified_amount || 0)} verified</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                    <CheckCircle size={24} style={{ color: "#E213A7" }} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.unverified_payments || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatPrice(stats.unverified_amount || 0)} pending</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                    <Clock size={24} style={{ color: "#E213A7" }} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Payment</p>
                    <p className="text-2xl font-bold text-gray-800">{formatPrice(stats.average_payment_amount || 0)}</p>
                    <p className="text-sm text-gray-500 mt-1">Per transaction</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: "#FFE3EC" }}>
                    <TrendingUp size={24} style={{ color: "#E213A7" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            {stats.payment_methods && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {Object.entries(stats.payment_methods).map(([method, data]) => (
                    <div key={method} className="text-center">
                      <div className="flex items-center justify-center mb-2">{getPaymentMethodIcon(method)}</div>
                      <p className="text-sm font-medium text-gray-800">{getPaymentMethodLabel(method)}</p>
                      <p className="text-xs text-gray-600">{data.count} payments</p>
                      <p className="text-xs text-gray-500">{formatPrice(data.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by payment reference, customer, or order..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  >
                    <option value="">All Methods</option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={verificationStatusFilter}
                    onChange={(e) => setVerificationStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending Verification</option>
                  </select>

                  <select
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                  </select>

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

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Payments ({startIndex}-{endIndex} of {totalPayments})
                  </h3>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                    style={{ borderColor: "#E213A7" }}
                  ></div>
                  <p className="text-gray-600">Loading payments...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
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
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center mr-3">
                                  <DollarSign size={20} style={{ color: "#E213A7" }} />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 font-mono">
                                    {payment.payment_reference}
                                  </div>
                                  <div className="text-sm text-gray-500">ID: #{payment.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                  <Users size={16} className="text-gray-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {payment.customer?.first_name} {payment.customer?.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">{payment.customer?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {payment.order ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{payment.order.order_number}</div>
                                  <div className="text-sm text-gray-500">Order #{payment.order_id}</div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">Order #{payment.order_id}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{formatPrice(payment.amount)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {getPaymentMethodIcon(payment.payment_method)}
                                <span className="text-sm text-gray-800">
                                  {getPaymentMethodLabel(payment.payment_method)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  payment.is_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {payment.is_verified ? (
                                  <>
                                    <CheckCircle size={12} className="mr-1" />
                                    Verified
                                  </>
                                ) : (
                                  <>
                                    <Clock size={12} className="mr-1" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">{timeAgo(payment.payment_date)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleViewPayment(payment)}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                {!payment.is_verified && (
                                  <button
                                    onClick={() => handleVerifyPayment(payment.id)}
                                    disabled={isSubmitting}
                                    className="text-gray-400 hover:text-green-600 p-1"
                                    title="Verify Payment"
                                  >
                                    <Zap size={16} />
                                  </button>
                                )}
                                {payment.is_verified && (
                                  <button
                                    onClick={() => handleGenerateInvoice(payment)}
                                    disabled={isSubmitting}
                                    className="text-gray-400 hover:text-blue-600 p-1"
                                    title="Generate Invoice"
                                  >
                                    <FileText size={16} />
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
                          Showing {startIndex} to {endIndex} of {totalPayments} payments
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

                  {payments.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <CreditCard size={48} className="mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No payments found</h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || paymentMethodFilter || verificationStatusFilter || dateRangeFilter
                          ? "Try adjusting your search criteria"
                          : "Payments will appear here once orders are paid"}
                      </p>
                      <button
                        onClick={() => router.push("/orders")}
                        className="text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#E213A7" }}
                      >
                        View Orders
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* View Payment Modal */}
            {showViewModal && paymentToView && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">Payment Details</h3>
                      <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Payment Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-800 font-mono">{paymentToView.payment_reference}</h4>
                        <p className="text-sm text-gray-600">Payment ID: #{paymentToView.id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">{formatPrice(paymentToView.amount)}</div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            paymentToView.is_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {paymentToView.is_verified ? (
                            <>
                              <CheckCircle size={16} className="mr-1" />
                              Verified
                            </>
                          ) : (
                            <>
                              <Clock size={16} className="mr-1" />
                              Pending Verification
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-md font-medium text-gray-800 mb-3">Payment Information</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Payment Method</label>
                            <div className="flex items-center space-x-2 mt-1">
                              {getPaymentMethodIcon(paymentToView.payment_method)}
                              <span className="text-gray-800">{getPaymentMethodLabel(paymentToView.payment_method)}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Payment Date</label>
                            <p className="text-gray-800 mt-1">{new Date(paymentToView.payment_date).toLocaleString()}</p>
                          </div>
                          {paymentToView.verification_date && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600">Verification Date</label>
                              <p className="text-gray-800 mt-1">
                                {new Date(paymentToView.verification_date).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-md font-medium text-gray-800 mb-3">Customer & Order</h5>
                        <div className="space-y-3">
                          {paymentToView.customer && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600">Customer</label>
                              <p className="text-gray-800 mt-1">
                                {paymentToView.customer.first_name} {paymentToView.customer.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{paymentToView.customer.email}</p>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Order</label>
                            <p className="text-gray-800 mt-1">
                              {paymentToView.order?.order_number || `Order #${paymentToView.order_id}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Method-specific Details */}
                    {(paymentToView.bank_name ||
                      paymentToView.account_number ||
                      paymentToView.transaction_reference ||
                      paymentToView.pos_terminal_id ||
                      paymentToView.mobile_money_number) && (
                      <div>
                        <h5 className="text-md font-medium text-gray-800 mb-3">Transaction Details</h5>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          {paymentToView.bank_name && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bank Name:</span>
                              <span className="font-medium text-gray-800">{paymentToView.bank_name}</span>
                            </div>
                          )}
                          {paymentToView.account_number && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Account Number:</span>
                              <span className="font-medium text-gray-800">{paymentToView.account_number}</span>
                            </div>
                          )}
                          {paymentToView.pos_terminal_id && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">POS Terminal ID:</span>
                              <span className="font-medium text-gray-800">{paymentToView.pos_terminal_id}</span>
                            </div>
                          )}
                          {paymentToView.mobile_money_number && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mobile Money Number:</span>
                              <span className="font-medium text-gray-800">{paymentToView.mobile_money_number}</span>
                            </div>
                          )}
                          {paymentToView.transaction_reference && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Transaction Reference:</span>
                              <span className="font-medium text-gray-800">{paymentToView.transaction_reference}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {paymentToView.notes && (
                      <div>
                        <h5 className="text-md font-medium text-gray-800 mb-3">Notes</h5>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-800">{paymentToView.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                      {!paymentToView.is_verified && (
                        <button
                          onClick={() => {
                            handleVerifyPayment(paymentToView.id)
                          }}
                          disabled={isSubmitting}
                          className="px-6 py-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-2"
                          style={{ backgroundColor: "#E213A7" }}
                        >
                          {isSubmitting && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          <Zap size={16} />
                          <span>{isSubmitting ? "Verifying..." : "Verify Payment"}</span>
                        </button>
                      )}

                      {paymentToView.is_verified && (
                        <button
                          onClick={() => handleGenerateInvoice(paymentToView)}
                          disabled={isSubmitting}
                          className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          {isSubmitting && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          <FileText size={16} />
                          <span>{isSubmitting ? "Generating..." : "Generate Invoice"}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setShowViewModal(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
   
  )
}
