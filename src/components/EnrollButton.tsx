"use client"

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import PaymentButton from '@/components/PaymentButton'

export default function EnrollButton() {
  const router = useRouter()
  const { status } = useSession()
  const [showPayment, setShowPayment] = useState(false)

  const onClick = async () => {
    if (status !== 'authenticated') {
      router.push('/login?callbackUrl=/course')
      return
    }
    setShowPayment(true)
  }

  return (
    <>
      <button onClick={onClick} className="rounded bg-emerald-600 px-4 py-2 text-white">
        Enroll Now
      </button>
      {showPayment && (
        <div className="mt-4">
          <PaymentButton 
            courseId="default-course"
            amount={15000}
          >
            Pay Now
          </PaymentButton>
        </div>
      )}
    </>
  )
}
