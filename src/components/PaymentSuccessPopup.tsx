'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface PaymentSuccessPopupProps {
  courseTitle?: string
  orderId?: string
  amount?: number
}

export default function PaymentSuccessPopup({ courseTitle, orderId, amount }: PaymentSuccessPopupProps) {
  const router = useRouter()
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Auto redirect after 3 seconds
    const timer = setTimeout(() => {
      setShow(false)
      router.push('/dashboard')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-brand-primary mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-4">
          {courseTitle ? (
            <>Congratulations! You have successfully enrolled in <strong>{courseTitle}</strong>.</>
          ) : (
            <>Congratulations! Your payment was successful.</>
          )}
        </p>

        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
            Order ID: {orderId}
          </p>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setShow(false)
              router.push('/dashboard')
            }}
            className="rounded-xl bg-brand-primary px-6 py-3 text-white font-semibold hover:shadow-lg transition-all"
          >
            Go to Dashboard
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Redirecting automatically in a few seconds...
        </p>
      </div>
    </div>
  )
}

