'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentStatusChecker() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Check if we have order_id in URL params (from Cashfree redirect)
    const urlParams = new URLSearchParams(window.location.search)
    const orderId = urlParams.get('order_id')

    if (orderId && !checked) {
      setChecked(true)
      console.log('🔍 [PAYMENT STATUS CHECKER] Found order_id in URL:', orderId)
      
      // Call API to verify payment and create enrollment
      fetch(`/api/payments/verify?order_id=${orderId}`, {
        method: 'GET',
      })
        .then(res => res.json())
        .then(data => {
          console.log('📊 [PAYMENT STATUS CHECKER] Verification response:', data)
          if (data.success) {
            // Refresh the page to show updated enrollments
            router.refresh()
          }
        })
        .catch(err => {
          console.error('❌ [PAYMENT STATUS CHECKER] Error verifying payment:', err)
        })
    }
  }, [router, checked])

  return null // This component doesn't render anything
}

