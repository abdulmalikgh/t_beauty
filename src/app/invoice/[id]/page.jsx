"use client"

import { Suspense } from "react"
import InvoicePage from "../../../components/invoice-page"

function InvoicePageWrapper({ params }) {
  return <InvoicePage invoiceId={params.id} />
}

export default function Page({ params }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: "#E213A7" }}
            ></div>
            <p className="text-gray-600">Loading invoice...</p>
          </div>
        </div>
      }
    >
      <InvoicePageWrapper params={params} />
    </Suspense>
  )
}
