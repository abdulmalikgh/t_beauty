"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Printer, Send, FileText, CheckCircle, AlertTriangle, X } from "lucide-react"
import Image from 'next/image'
import api from "../lib/api"
import handleApiError from "../lib/handleApiError"
import Logo from '../assets/t_beauty.png'

// API functions
const invoicesAPI = {
  getInvoice: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
  updateInvoiceStatus: async (invoiceId, status) => {
    try {
      const response = await api.patch(`/invoices/${invoiceId}`, { status })
      return response.data
    } catch (error) {
      throw error
    }
  },
  sendInvoice: async (invoiceId, emailData) => {
    try {
      const response = await api.post(`/invoices/${invoiceId}/send`, emailData)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

const customersAPI = {
  getCustomer: async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

export default function InvoicePage({ invoiceId }) {
  const router = useRouter()
  const printRef = useRef()

  const [invoice, setInvoice] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal states
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendEmailData, setSendEmailData] = useState({
    to_email: "",
    subject: "",
    message: "",
  })

  // Company information (you can make this configurable)
  const companyInfo = {
    name: "Your Beauty Company",
    address: "123 Beauty Street",
    city: "New York, NY 10001",
    phone: "+1 (555) 123-4567",
    email: "hello@beautycompany.com",
    website: "www.beautycompany.com",
    logo: Logo
  }

  // Fetch invoice data
  const fetchInvoice = async () => {
    if (!invoiceId) {
      setError("No invoice ID provided")
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    let customerData = null

    try {
      console.log("Fetching invoice with ID:", invoiceId)
      const invoiceData = await invoicesAPI.getInvoice(invoiceId)
      console.log("Invoice data received:", invoiceData)
      setInvoice(invoiceData)

      // Fetch customer data if available
      if (invoiceData.customer_id) {
        try {
          customerData = await customersAPI.getCustomer(invoiceData.customer_id)
          setCustomer(customerData)
        } catch (error) {
          console.error("Failed to fetch customer:", error)
          // Don't fail the whole page if customer fetch fails
        }
      }

      // Set default email data
      setSendEmailData((prev) => ({
        ...prev,
        to_email: customerData?.email || "",
        subject: `Invoice ${invoiceData.invoice_number}`,
        message: `Dear ${customerData?.first_name || "Customer"},\n\nPlease find attached your invoice ${invoiceData.invoice_number}.\n\nThank you for your business!\n\nBest regards,\n${companyInfo.name}`,
      }))
    } catch (error) {
      console.error("Error fetching invoice:", error)
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  // Handle download as PDF
  const handleDownload = () => {
    // Create a new window with the invoice content
    const printWindow = window.open("", "_blank")
    const invoiceContent = printRef.current.innerHTML

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice?.invoice_number}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #374151;
              line-height: 1.5;
            }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .invoice-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; }
            .company-info h1 { margin: 0; font-size: 24px; color: #E213A7; }
            .company-info p { margin: 2px 0; color: #6B7280; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { margin: 0; font-size: 32px; color: #374151; }
            .invoice-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .bill-to h3, .invoice-details h3 { margin: 0 0 10px 0; font-size: 14px; color: #6B7280; text-transform: uppercase; }
            .customer-info p, .invoice-info p { margin: 2px 0; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .invoice-table th { background: #F9FAFB; padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-weight: 600; }
            .invoice-table td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
            .invoice-table .amount { text-align: right; }
            .invoice-summary { margin-left: auto; width: 300px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .summary-row.total { border-top: 2px solid #E5E7EB; font-weight: 600; font-size: 18px; }
            .invoice-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .status-draft { background: #FEF3C7; color: #92400E; }
            .status-sent { background: #DBEAFE; color: #1E40AF; }
            .status-paid { background: #D1FAE5; color: #065F46; }
            .status-overdue { background: #FEE2E2; color: #991B1B; }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${invoiceContent}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Handle send invoice
  const handleSendInvoice = async (e) => {
    e.preventDefault()
    if (!invoice) return

    setIsSubmitting(true)
    try {
      await invoicesAPI.sendInvoice(invoice.id, sendEmailData)
      setShowSendModal(false)
      alert("Invoice sent successfully!")

      // Update invoice status to sent
      const updatedInvoice = await invoicesAPI.updateInvoiceStatus(invoice.id, "sent")
      setInvoice(updatedInvoice)
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    if (!invoice) return

    setIsSubmitting(true)
    try {
      const updatedInvoice = await invoicesAPI.updateInvoiceStatus(invoice.id, newStatus)
      setInvoice(updatedInvoice)
      alert(`Invoice status updated to ${newStatus}`)
    } catch (error) {
      const apiError = handleApiError(error)
      setError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch invoice when component mounts or invoiceId changes
  useEffect(() => {
    console.log("useEffect triggered with invoiceId:", invoiceId)
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price || 0)
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: "status-draft",
      sent: "status-sent",
      paid: "status-paid",
      overdue: "status-overdue",
    }
    return colors[status] || "status-draft"
  }

  const getStatusIcon = (status) => {
    const icons = {
      draft: <FileText size={16} />,
      sent: <Send size={16} />,
      paid: <CheckCircle size={16} />,
      overdue: <AlertTriangle size={16} />,
    }
    return icons[status] || <FileText size={16} />
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#E213A7" }}
          ></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Invoice</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => fetchInvoice()}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#E213A7" }}
            >
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show not found state
  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText size={48} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-4">The requested invoice could not be found.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden in print */}
      <div className="bg-white shadow-sm border-b border-gray-200 no-print">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Invoice {invoice.invoice_number}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`status-badge ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    <span className="ml-1 capitalize">{invoice.status}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    Created {new Date(invoice.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* <button
                onClick={() => setShowSendModal(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Send size={16} />
                <span>Send</span>
              </button> */}
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Printer size={16} />
                <span>Print</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#E213A7" }}
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              {/* {invoice.status === "draft" && (
                <button
                  onClick={() => handleStatusUpdate("sent")}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                  <span>Mark as Sent</span>
                </button>
              )}
              {invoice.status === "sent" && (
                <button
                  onClick={() => handleStatusUpdate("paid")}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  <span>Mark as Paid</span>
                </button>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div ref={printRef} className="invoice-container p-8">
            {/* Invoice Header */}
            <div className="invoice-header">
              <div className="company-info">
                <Image src={Logo} alt={companyInfo.name} width={200}
                  height={200} className="mb-4" />
                <h1>{companyInfo.name}</h1>
                <p>{companyInfo.address}</p>
                <p>{companyInfo.city}</p>
                <p>{companyInfo.phone}</p>
                <p>{companyInfo.email}</p>
                <p>{companyInfo.website}</p>
              </div>
              <div className="invoice-title">
                <h2>INVOICE</h2>
                <p className="text-gray-600 mt-2">#{invoice.invoice_number}</p>
              </div>
            </div>

            {/* Invoice Meta Information */}
            <div className="invoice-meta">
              <div className="bill-to">
                <h3>Bill To</h3>
                <div className="customer-info">
                  {customer ? (
                    <>
                      <p className="font-semibold">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p>{customer.email}</p>
                      {customer.phone && <p>{customer.phone}</p>}
                      {customer.address_line1 && (
                        <>
                          <p>{customer.address_line1}</p>
                          {customer.address_line2 && <p>{customer.address_line2}</p>}
                          <p>
                            {customer.city}, {customer.state} {customer.postal_code}
                          </p>
                          <p>{customer.country}</p>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">Customer information not available</p>
                  )}
                </div>
              </div>

              <div className="invoice-details">
                <h3>Invoice Details</h3>
                <div className="invoice-info">
                  <p>
                    <span className="text-gray-600">Invoice Date:</span>{" "}
                    <span className="font-medium">{new Date(invoice.created_at).toLocaleDateString()}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Due Date:</span>{" "}
                    <span className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Payment Terms:</span>{" "}
                    <span className="font-medium">{invoice.payment_terms}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Status:</span>{" "}
                    <span className={`status-badge ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Description */}
            {invoice.description && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-600 uppercase mb-2">Description</h3>
                <p className="text-gray-800">{invoice.description}</p>
              </div>
            )}

            {/* Invoice Items Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="amount">Qty</th>
                  <th className="amount">Unit Price</th>
                  <th className="amount">Discount</th>
                  <th className="amount">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.invoice_items && invoice.invoice_items.length > 0 ? (
                  invoice.invoice_items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="font-medium">{item.description}</div>
                        {item.notes && <div className="text-sm text-gray-500 mt-1">{item.notes}</div>}
                      </td>
                      <td className="amount">{item.quantity}</td>
                      <td className="amount">{formatPrice(item.unit_price)}</td>
                      <td className="amount">{formatPrice(item.discount_amount)}</td>
                      <td className="amount font-medium">
                        {formatPrice(item.quantity * item.unit_price - item.discount_amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 py-8">
                      No items found for this invoice
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Invoice Summary */}
            <div className="invoice-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatPrice(invoice.subtotal)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="summary-row">
                  <span>Discount:</span>
                  <span className="text-green-600">-{formatPrice(invoice.discount_amount)}</span>
                </div>
              )}
              {invoice.tax_amount > 0 && (
                <div className="summary-row">
                  <span>Tax:</span>
                  <span>{formatPrice(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total:</span>
                <span>{formatPrice(invoice.total_amount)}</span>
              </div>
              {invoice.amount_paid > 0 && (
                <>
                  <div className="summary-row">
                    <span>Amount Paid:</span>
                    <span className="text-green-600">{formatPrice(invoice.amount_paid)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Balance Due:</span>
                    <span className="text-red-600">{formatPrice(invoice.total_amount - invoice.amount_paid)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Invoice Footer */}
            <div className="invoice-footer">
              {invoice.notes && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">Notes</h4>
                  <p className="text-gray-600">{invoice.notes}</p>
                </div>
              )}

              {invoice.terms_and_conditions && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">Terms & Conditions</h4>
                  <p className="text-gray-600 text-sm">{invoice.terms_and_conditions}</p>
                </div>
              )}

              <div className="text-center text-gray-500 text-sm mt-8">
                <p>Thank you for your business!</p>
                <p>
                  For questions about this invoice, please contact us at {companyInfo.email} or {companyInfo.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Invoice Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Send Invoice</h3>
                <button onClick={() => setShowSendModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSendInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={sendEmailData.to_email}
                  onChange={(e) => setSendEmailData((prev) => ({ ...prev, to_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sendEmailData.subject}
                  onChange={(e) => setSendEmailData((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  placeholder="Invoice #INV-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={sendEmailData.message}
                  onChange={(e) => setSendEmailData((prev) => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  placeholder="Enter your message..."
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center space-x-2"
                  style={{ backgroundColor: "#E213A7" }}
                >
                  {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <Send size={16} />
                  <span>{isSubmitting ? "Sending..." : "Send Invoice"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .invoice-container {
            box-shadow: none;
            border: none;
          }
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-draft {
          background: #fef3c7;
          color: #92400e;
        }

        .status-sent {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-paid {
          background: #d1fae5;
          color: #065f46;
        }

        .status-overdue {
          background: #fee2e2;
          color: #991b1b;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
        }

        .invoice-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }

        .invoice-table th {
          background: #f9fafb;
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
        }

        .invoice-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .invoice-table .amount {
          text-align: right;
        }

        .invoice-summary {
          margin-left: auto;
          width: 300px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }

        .summary-row.total {
          border-top: 2px solid #e5e7eb;
          font-weight: 600;
          font-size: 18px;
          margin-top: 8px;
          padding-top: 16px;
        }

        .invoice-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  )
}
