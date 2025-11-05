'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { load } from '@cashfreepayments/cashfree-js'

interface CashfreePayButtonProps {
  courseId: string;
  courseTitle: string;
  amount: string; // in rupees as string (e.g. "15400")
  className?: string;
  children: React.ReactNode;
}

export default function CashfreePayButton({ 
  courseId, 
  courseTitle, 
  amount, 
  className = "",
  children 
}: CashfreePayButtonProps) {
  const [loading, setLoading] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const handlePayment = async () => {
    if (loading) return
    
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/pricing')
      return
    }
    
    if (status === 'loading') {
      return // Still loading session
    }
    
    setLoading(true)
    try {
      const orderAmount = parseFloat(amount)

      const res = await fetch('/api/payments/cashfree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseTitle,
          orderAmount
        })
      })

      const data = await res.json()
      console.log('📦 [CASHFREE PAY BUTTON] API response:', {
        ok: res.ok,
        status: res.status,
        data: JSON.stringify(data, null, 2)
      })
      
      if (!res.ok) {
        console.error('❌ [CASHFREE PAY BUTTON] API error:', data)
        return
      }

      const paymentSessionId = data?.data?.payment_session_id || data?.data?.paymentSessionId || data?.payment_session_id || data?.paymentSessionId
      console.log('🔑 [CASHFREE PAY BUTTON] Payment session ID:', paymentSessionId)
      
      if (!paymentSessionId) {
        console.error('❌ [CASHFREE PAY BUTTON] No payment_session_id in response:', data)
        return
      }

      const cf = await load({ mode: process.env.NEXT_PUBLIC_CASHFREE_MODE === 'PROD' ? 'production' : 'sandbox' })
      await cf.checkout({
        paymentSessionId,
        redirectTarget: '_self'
      })
    } catch (err) {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handlePayment} 
      className={className} 
      disabled={loading || status === 'loading'}
    >
      {loading ? 'Processing…' : status === 'loading' ? 'Loading…' : children}
    </button>
  )
}
