import { Suspense } from 'react'
import Payment from '../../components/payment'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading payment details...</div>}>
      <Payment />
    </Suspense>
  )
}