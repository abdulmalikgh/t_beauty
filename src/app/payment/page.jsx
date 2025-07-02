"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Receipt,
  Download,
  Eye,
  Banknote,
  Smartphone,
  Building,
  Coins,
  MoreHorizontal,
  DollarSign,
  Calendar,
  User,
  Package,
  FileText,
} from "lucide-react"
import api from "../../lib/api"
import handleApiError from "../../lib/handleApiError"

// API functions
const paymentsAPI = {
  createPayment: async (paymentData) => {
    try {
      const response = await api.post("/payments", paymentData)
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
  getInvoice: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

const ordersAPI = {
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const paymentId = searchParams.get("payment_id")

  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState("payment") // payment, confirmation, invoice

  // Payment form data
  const initialPaymentFormData = {
    amount: "",
    payment_method: "cash",
    payment_date: new Date().toISOString().slice(0, 16),
    notes: "",
    bank_name: "",
    account_number: "",
    transaction_reference: "",
    pos_terminal_id: "",
    mobile_money_number: "",
  }

  const [paymentFormData, setPaymentFormData] = useState(initialPaymentFormData)

  // Payment methods configuration
  const paymentMethods = [
    { value: "cash", label: "Cash", icon: <Banknote size={20} /> },
    { value: "bank_transfer", label: "Bank Transfer", icon: <Building size={20} /> },
    { value: "pos", label: "POS Terminal", icon: <CreditCard size={20} /> },
    { value: "mobile_money", label: "Mobile Money", icon: <Smartphone size={20} /> },
    { value: "instagram_payment", label: "Instagram Payment", icon: <Receipt size={20} /> },
    { value: "crypto", label: "Cryptocurrency", icon: <Coins size={20} /> },
    { value: "other", label: "Other", icon: <MoreHorizontal size={20} /> },
  ]

  // Fetch order data
  const fetchOrder = async () => {
    if (!orderId) return
    try {
      const orderData = await ordersAPI.getOrder(orderId)
      setOrder(orderData)
      setPaymentFormData((prev) => ({
        ...prev,
        amount: orderData.outstanding_amount || orderData.total_amount || 0,
      }))
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    }
  }

  // Fetch payment data
  const fetchPayment = async () => {
    if (!paymentId) return
    try {
      const paymentData = await paymentsAPI.getPayment(paymentId)
      setPayment(paymentData)
      setCurrentStep("confirmation")
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    }
  }

  // Initialize page
  useEffect(() => {
    const initializePage = async () => {
      setLoading(true)
      try {
        if (paymentId) {
          await fetchPayment()
          if (orderId) await fetchOrder()
        } else if (orderId) {
          await fetchOrder()
          setCurrentStep("payment")
        } else {
          setError("Missing order ID or payment ID")
        }
      } catch (error) {
        console.error("Failed to initialize page:", error)
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [orderId, paymentId])

  // Handle payment form input changes
  const handlePaymentInputChange = (field, value) => {
    setPaymentFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle payment submission
  const handleSubmitPayment = async (e) => {
    e.preventDefault()
    if (!order) return

    setIsSubmitting(true)
    try {
      const paymentData = {
        customer_id: order.customer?.id,
        order_id: order.id,
        amount: Number.parseFloat(paymentFormData.amount),
        payment_method: paymentFormData.payment_method,
        payment_date: paymentFormData.payment_date,
        notes: paymentFormData.notes,
      }

      // Add method-specific fields
      if (paymentFormData.payment_method === "bank_transfer") {
        paymentData.bank_name = paymentFormData.bank_name
        paymentData.account_number = paymentFormData.account_number
        paymentData.transaction_reference = paymentFormData.transaction_reference
      } else if (paymentFormData.payment_method === "pos") {
        paymentData.pos_terminal_id = paymentFormData.pos_terminal_id
        paymentData.transaction_reference = paymentFormData.transaction_reference
      } else if (paymentFormData.payment_method === "mobile_money") {
        paymentData.mobile_money_number = paymentFormData.mobile_money_number
        paymentData.transaction_reference = paymentFormData.transaction_reference
      }

      const result = await paymentsAPI.createPayment(paymentData)
      setPayment(result)
      setCurrentStep("confirmation")

      // Update URL to include payment ID
      const newUrl = `/payment?order_id=${orderId}&payment_id=${result.id}`
      window.history.pushState({}, "", newUrl)
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle payment verification
  const handleVerifyPayment = async () => {
    if (!payment) return

    setIsSubmitting(true)
    try {
      const result = await paymentsAPI.verifyPayment(payment.id)
      setPayment((prev) => ({
        ...prev,
        is_verified: true,
        verification_date: result.verification_date,
      }))
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle invoice generation
  const handleGenerateInvoice = async () => {
    if (!order || !payment) return

    setIsSubmitting(true)
    try {
      const invoiceData = {
        customer_id: order.customer?.id,
        description: `Payment for Order ${order.order_number}`,
        payment_terms: "Net 30",
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items:
          order.order_items?.map((item) => ({
            description: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_amount: 0,
          })) || [],
      }

      const result = await invoicesAPI.createInvoice(invoiceData)
      setInvoice(result)
      setCurrentStep("invoice")
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const getPaymentMethodIcon = (method) => {
    const methodConfig = paymentMethods.find((m) => m.value === method)
    return methodConfig ? methodConfig.icon : <CreditCard size={20} />
  }

  const getPaymentMethodLabel = (method) => {
    const methodConfig = paymentMethods.find((m) => m.value === method)
    return methodConfig ? methodConfig.label : method
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#E213A7" }}
          ></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {currentStep === "payment" && "Make Payment"}
                  {currentStep === "confirmation" && "Payment Confirmation"}
                  {currentStep === "invoice" && "Invoice Generated"}
                </h1>
                {order && (
                  <p className="text-sm text-gray-600">
                    Order: {order.order_number} | Total: {formatPrice(order.total_amount)}
                  </p>
                )}
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "payment" ? "text-white" : "bg-green-100 text-green-800"
                  }`}
                  style={currentStep === "payment" ? { backgroundColor: "#E213A7" } : {}}
                >
                  {currentStep === "payment" ? "1" : <CheckCircle size={16} />}
                </div>
                <span className="text-sm text-gray-600">Payment</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "confirmation"
                      ? "text-white"
                      : currentStep === "invoice"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-400"
                  }`}
                  style={currentStep === "confirmation" ? { backgroundColor: "#E213A7" } : {}}
                >
                  {currentStep === "invoice" ? <CheckCircle size={16} /> : "2"}
                </div>
                <span className="text-sm text-gray-600">Confirm</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "invoice" ? "text-white" : "bg-gray-100 text-gray-400"
                  }`}
                  style={currentStep === "invoice" ? { backgroundColor: "#E213A7" } : {}}
                >
                  3
                </div>
                <span className="text-sm text-gray-600">Invoice</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg flex items-center">
            <AlertTriangle size={20} className="mr-3" />
            <p>{error}</p>
          </div>
        )}

        {/* Payment Form Step */}
        {currentStep === "payment" && order && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                      <Package size={20} style={{ color: "#E213A7" }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                      <div className="text-sm text-gray-500">{order.order_items?.length || 0} items</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <User size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer?.first_name} {order.customer?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{order.customer?.email}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPrice(order.subtotal || 0)}</span>
                  </div>
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">{formatPrice(order.tax_amount)}</span>
                    </div>
                  )}
                  {order.shipping_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">{formatPrice(order.shipping_cost)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total:</span>
                      <span>{formatPrice(order.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-medium">{formatPrice(order.amount_paid || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Outstanding:</span>
                      <span className="font-medium text-red-600">
                        {formatPrice(order.outstanding_amount || order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Payment Details</h3>

                <form onSubmit={handleSubmitPayment} className="space-y-6">
                  {/* Payment Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        max={order.outstanding_amount || order.total_amount}
                        value={paymentFormData.amount}
                        onChange={(e) => handlePaymentInputChange("amount", e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.value}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            paymentFormData.payment_method === method.value
                              ? "border-pink-300 bg-pink-50"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            value={method.value}
                            checked={paymentFormData.payment_method === method.value}
                            onChange={(e) => handlePaymentInputChange("payment_method", e.target.value)}
                            className="sr-only"
                          />
                          {method.icon}
                          <span className="text-sm font-medium">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="datetime-local"
                        required
                        value={paymentFormData.payment_date}
                        onChange={(e) => handlePaymentInputChange("payment_date", e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Method-specific fields */}
                  {paymentFormData.payment_method === "bank_transfer" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                        <input
                          type="text"
                          value={paymentFormData.bank_name}
                          onChange={(e) => handlePaymentInputChange("bank_name", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                          placeholder="Enter bank name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                        <input
                          type="text"
                          value={paymentFormData.account_number}
                          onChange={(e) => handlePaymentInputChange("account_number", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                          placeholder="Enter account number"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Reference</label>
                        <input
                          type="text"
                          value={paymentFormData.transaction_reference}
                          onChange={(e) => handlePaymentInputChange("transaction_reference", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                          placeholder="Enter transaction reference"
                        />
                      </div>
                    </div>
                  )}

                  {paymentFormData.payment_method === "pos" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">POS Terminal ID</label>
                        <input
                          type="text"
                          value={paymentFormData.pos_terminal_id}
                          onChange={(e) => handlePaymentInputChange("pos_terminal_id", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                          placeholder="Enter POS terminal ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Reference</label>
                        <input
                          type="text"
                          value={paymentFormData.transaction_reference}
                          onChange={(e) => handlePaymentInputChange("transaction_reference", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                          placeholder="Enter transaction reference"
                        />
                      </div>
                    </div>
                  )}

                  {paymentFormData.payment_method === "mobile_money" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Money Number</label>
                        <input
                          type="text"
                          value={paymentFormData.mobile_money_number}
                          onChange={(e) => handlePaymentInputChange("mobile_money_number", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                          placeholder="Enter mobile money number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Reference</label>
                        <input
                          type="text"
                          value={paymentFormData.transaction_reference}
                          onChange={(e) => handlePaymentInputChange("transaction_reference", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                          placeholder="Enter transaction reference"
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={paymentFormData.notes}
                      onChange={(e) => handlePaymentInputChange("notes", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                      placeholder="Enter payment notes (optional)"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-2"
                      style={{ backgroundColor: "#E213A7" }}
                    >
                      {isSubmitting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      <span>{isSubmitting ? "Processing..." : "Submit Payment"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Payment Confirmation Step */}
        {currentStep === "confirmation" && payment && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Submitted Successfully!</h2>
                <p className="text-gray-600">Your payment has been recorded and is pending verification.</p>
              </div>

              {/* Payment Details */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Payment Reference</label>
                      <p className="text-lg font-mono font-semibold text-gray-800">{payment.payment_reference}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Amount</label>
                      <p className="text-lg font-semibold text-gray-800">{formatPrice(payment.amount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Payment Method</label>
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(payment.payment_method)}
                        <span className="text-gray-800">{getPaymentMethodLabel(payment.payment_method)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Payment Date</label>
                      <p className="text-gray-800">{new Date(payment.payment_date).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Status</label>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          payment.is_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payment.is_verified ? "Verified" : "Pending Verification"}
                      </span>
                    </div>
                    {payment.notes && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600">Notes</label>
                        <p className="text-gray-800">{payment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-4">
                  {!payment.is_verified && (
                    <button
                      onClick={handleVerifyPayment}
                      disabled={isSubmitting}
                      className="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-2"
                      style={{ backgroundColor: "#E213A7" }}
                    >
                      {isSubmitting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      <CheckCircle size={20} />
                      <span>{isSubmitting ? "Verifying..." : "Verify Payment"}</span>
                    </button>
                  )}

                  {payment.is_verified && (
                    <button
                      onClick={handleGenerateInvoice}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isSubmitting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      <FileText size={20} />
                      <span>{isSubmitting ? "Generating..." : "Generate Invoice"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => router.push("/orders")}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back to Orders
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Generated Step */}
        {currentStep === "invoice" && invoice && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt size={32} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Generated!</h2>
                <p className="text-gray-600">Your invoice has been successfully created and is ready for download.</p>
              </div>

              {/* Invoice Details */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Invoice Number</label>
                      <p className="text-lg font-mono font-semibold text-gray-800">{invoice.invoice_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Total Amount</label>
                      <p className="text-lg font-semibold text-gray-800">{formatPrice(invoice.total_amount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Issue Date</label>
                      <p className="text-gray-800">{new Date(invoice.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Due Date</label>
                      <p className="text-gray-800">{new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => window.open(`/invoice/${invoice.id}/`, "_blank")}
                    className="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2"
                    style={{ backgroundColor: "#E213A7" }}
                  >
                    <Download size={20} />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => router.push(`/invoice/${invoice.id}`)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <Eye size={20} />
                    <span>View Invoice</span>
                  </button>

                  <button
                    onClick={() => router.push("/orders")}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back to Orders
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
