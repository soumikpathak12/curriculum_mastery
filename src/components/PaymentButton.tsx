"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface PaymentButtonProps {
  courseId: string
  amount: number
  className?: string
  children: React.ReactNode
}


export default function PaymentButton({ courseId, className, children }: PaymentButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    if (!session) {
      router.push('/register?enroll=1')
      return
    }

    setLoading(true)
    try {
      // Create payment order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment order')
      }

      const { orderId, mockPayment } = await response.json()

      // Handle mock payment for development
      if (mockPayment) {
        // Simulate payment processing
        setTimeout(() => {
          // Create enrollment directly for mock payment
          createMockEnrollment(orderId)
        }, 1000)
        return
      }

      // Redirect to success page
      router.push(`/payment/success?order_id=${orderId}`)

    } catch (error) {
      console.error('Payment error:', error)
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.')
      setLoading(false)
    }
  }

  const createMockEnrollment = async (orderId: string) => {
    try {
      // Update payment status and create enrollment
      const response = await fetch('/api/payments/mock-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, courseId })
      })

      if (response.ok) {
        router.push(`/payment/success?order_id=${orderId}`)
      } else {
        throw new Error('Failed to process enrollment')
      }
    } catch (error) {
      console.error('Mock enrollment error:', error)
      alert('Enrollment failed. Please try again.')
      setLoading(false)
    }
  }


  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Processing...
        </div>
      ) : (
        children
      )}
    </button>
  )
}
