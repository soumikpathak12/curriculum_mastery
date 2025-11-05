import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PaymentSuccessPopup from '@/components/PaymentSuccessPopup'

interface PaymentSuccessPageProps {
  searchParams: {
    order_id?: string
  }
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  console.log('🔵 [PAYMENT SUCCESS PAGE] Starting payment success page handler')
  
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    console.log('❌ [PAYMENT SUCCESS PAGE] No session found, redirecting to login')
    redirect('/login?callbackUrl=/payment/success')
  }

  console.log('✅ [PAYMENT SUCCESS PAGE] Session found:', { email: session.user.email, role: session.user.role })

  const { order_id } = searchParams
  console.log('📋 [PAYMENT SUCCESS PAGE] Order ID from query params:', order_id)

  if (!order_id) {
    console.log('❌ [PAYMENT SUCCESS PAGE] No order_id provided, redirecting to dashboard')
    redirect('/dashboard')
  }

  // Get payment record
  console.log('🔍 [PAYMENT SUCCESS PAGE] Fetching payment from database for orderId:', order_id)
  let payment = await prisma.payment.findUnique({
    where: { orderId: order_id },
    include: {
      user: true,
      enrollment: {
        include: {
          course: true
        }
      }
    }
  })

  if (!payment) {
    console.error('❌ [PAYMENT SUCCESS PAGE] Payment not found in database for orderId:', order_id)
    redirect('/dashboard')
  }

  if (payment.user.email !== session.user.email) {
    console.error('❌ [PAYMENT SUCCESS PAGE] Payment user mismatch:', {
      paymentUser: payment.user.email,
      sessionUser: session.user.email
    })
    redirect('/dashboard')
  }

  console.log('✅ [PAYMENT SUCCESS PAGE] Payment found:', {
    orderId: payment.orderId,
    status: payment.status,
    amount: payment.amount,
    userId: payment.userId,
    existingEnrollments: payment.enrollment?.length || 0
  })

  // Verify payment status with Cashfree API
  console.log('🔍 [PAYMENT SUCCESS PAGE] Fetching order status from Cashfree API...')
  let cashfreeOrderStatus = payment.status
  let orderNote: string | null = null
  let orderAmount: number | null = null

  try {
    const clientId = process.env.CASHFREE_CLIENT_ID
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET

    console.log('🔑 [PAYMENT SUCCESS PAGE] Cashfree config:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      env: process.env.CASHFREE_ENV || 'SANDBOX'
    })

    if (clientId && clientSecret) {
      // Dynamic import to avoid Turbopack parsing issues
      const { Cashfree, CFEnvironment } = await import('cashfree-pg')
      const env = process.env.CASHFREE_ENV === 'PROD' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX
      const cashfree = new Cashfree(env, clientId, clientSecret)
      console.log('📞 [PAYMENT SUCCESS PAGE] Calling Cashfree.PGFetchOrder with order_id:', order_id)
      
      let orderResponse
      try {
        // PGFetchOrder expects order_id as a string parameter, not an object
        console.log(`📋 [PAYMENT SUCCESS PAGE] Calling PGFetchOrder with order_id string:`, order_id)
        orderResponse = await cashfree.PGFetchOrder(order_id)
      } catch (apiError: any) {
        console.error('❌ [PAYMENT SUCCESS PAGE] Cashfree API error:', {
          message: apiError?.message || 'Unknown error',
          status: apiError?.response?.status,
          statusText: apiError?.response?.statusText,
          data: apiError?.response?.data,
          code: apiError?.code
        })
        
        // If order not found (400 or 404), continue with existing payment status
        if (apiError?.response?.status === 400 || apiError?.response?.status === 404) {
          console.warn('⚠️ [PAYMENT SUCCESS PAGE] Order not found in Cashfree - using existing payment status')
          // Continue with existing payment status
        } else {
          // For other errors, log and continue
          console.error('❌ [PAYMENT SUCCESS PAGE] Error fetching order from Cashfree, continuing with existing status')
        }
        // Continue with existing payment status
      }
      
      if (orderResponse) {
        console.log('📦 [PAYMENT SUCCESS PAGE] Cashfree API response:', {
          status: orderResponse?.status,
          hasData: !!orderResponse?.data,
          orderData: orderResponse?.data ? JSON.stringify(orderResponse.data, null, 2) : 'No data'
        })
        
        // Cashfree API returns order data directly in orderResponse.data, not in orderResponse.data.order
        // The order object IS the data object itself
        if (orderResponse?.data) {
          const orderData = orderResponse.data
          cashfreeOrderStatus = orderData.order_status || payment.status
          orderNote = orderData.order_note || null
          orderAmount = orderData.order_amount || null
          
          console.log('✅ [PAYMENT SUCCESS PAGE] Order details from Cashfree:', {
            orderStatus: cashfreeOrderStatus,
            orderNote: orderNote,
            orderAmount: orderAmount,
            previousStatus: payment.status
          })
          
          // Update payment status in database
          console.log('💾 [PAYMENT SUCCESS PAGE] Updating payment status in database to:', cashfreeOrderStatus)
          await prisma.payment.update({
            where: { orderId: order_id },
            data: { status: cashfreeOrderStatus }
          })
          
          // Update payment reference
          payment = await prisma.payment.findUnique({
            where: { orderId: order_id },
            include: {
              user: true,
              enrollment: {
                include: {
                  course: true
                }
              }
            }
          })
          console.log('✅ [PAYMENT SUCCESS PAGE] Payment status updated in database')
        } else {
          console.warn('⚠️ [PAYMENT SUCCESS PAGE] Cashfree response missing order data')
        }
      }
    } else {
      console.warn('⚠️ [PAYMENT SUCCESS PAGE] Cashfree credentials not configured, skipping API call')
    }
  } catch (error) {
    console.error('❌ [PAYMENT SUCCESS PAGE] Error fetching order from Cashfree:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    // Continue with existing payment status
  }

  // If payment is successful, ensure enrollment exists
  // Note: In Cashfree test/sandbox mode, status might vary
  const isPaymentSuccessful = cashfreeOrderStatus === 'PAID' || 
                              cashfreeOrderStatus === 'SUCCESS' || 
                              cashfreeOrderStatus === 'ACTIVE' ||
                              cashfreeOrderStatus === 'COMPLETED' ||
                              (cashfreeOrderStatus && cashfreeOrderStatus.toUpperCase().includes('SUCCESS')) ||
                              (cashfreeOrderStatus && cashfreeOrderStatus.toUpperCase().includes('PAID'))

  console.log('🔍 [PAYMENT SUCCESS PAGE] Payment status check:', {
    cashfreeOrderStatus,
    isPaymentSuccessful,
    existingEnrollmentCount: payment?.enrollment?.length || 0
  })

  if (isPaymentSuccessful) {
    const existingEnrollment = payment?.enrollment?.[0]
    
    if (!existingEnrollment) {
      console.log('📚 [PAYMENT SUCCESS PAGE] No existing enrollment found, attempting to create...')
      let course = null

      // Try to find course from orderNote first (most reliable)
      if (orderNote && orderNote.startsWith('course:')) {
        const match = orderNote.match(/^course:([^|]+)/)
        if (match) {
          const courseSlug = match[1]
          console.log('🔍 [PAYMENT SUCCESS PAGE] Attempting to find course by slug:', courseSlug)
          course = await prisma.course.findUnique({
            where: { slug: courseSlug }
          })
          console.log(course ? `✅ [PAYMENT SUCCESS PAGE] Course found by slug: ${course.title}` : `❌ [PAYMENT SUCCESS PAGE] Course not found by slug: ${courseSlug}`)
        }
      }

      // Fallback: find course by matching payment amount
      if (!course && payment) {
        console.log('🔍 [PAYMENT SUCCESS PAGE] Attempting to find course by payment amount:', payment.amount, 'paise')
        course = await prisma.course.findFirst({
          where: { price: payment.amount }
        })
        console.log(course ? `✅ [PAYMENT SUCCESS PAGE] Course found by amount: ${course.title}` : `❌ [PAYMENT SUCCESS PAGE] Course not found by amount: ${payment.amount} paise`)
      }

      // Fallback: find course by orderAmount if available
      if (!course && orderAmount) {
        const amountInPaise = Math.round(orderAmount * 100)
        console.log('🔍 [PAYMENT SUCCESS PAGE] Attempting to find course by order amount:', amountInPaise, 'paise')
        course = await prisma.course.findFirst({
          where: { price: amountInPaise }
        })
        console.log(course ? `✅ [PAYMENT SUCCESS PAGE] Course found by order amount: ${course.title}` : `❌ [PAYMENT SUCCESS PAGE] Course not found by order amount: ${amountInPaise} paise`)
      }

      if (course && payment) {
        console.log('✅ [PAYMENT SUCCESS PAGE] Course identified:', {
          courseId: course.id,
          courseTitle: course.title,
          courseSlug: course.slug,
          price: course.price
        })

        // Check if enrollment already exists (race condition check)
        console.log('🔍 [PAYMENT SUCCESS PAGE] Checking for existing enrollment...')
        const enrollmentCheck = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: payment.userId,
              courseId: course.id
            }
          }
        })

        if (!enrollmentCheck) {
          console.log('📝 [PAYMENT SUCCESS PAGE] Creating enrollment...', {
            userId: payment.userId,
            courseId: course.id,
            paymentId: payment.id
          })
          // Create enrollment immediately
          const newEnrollment = await prisma.enrollment.create({
            data: {
              userId: payment.userId,
              courseId: course.id,
              status: 'ACTIVE',
              paymentId: payment.id
            }
          })
          console.log('✅ [PAYMENT SUCCESS PAGE] Enrollment created successfully:', {
            enrollmentId: newEnrollment.id,
            userId: newEnrollment.userId,
            courseId: newEnrollment.courseId,
            status: newEnrollment.status
          })
        } else {
          console.log('ℹ️ [PAYMENT SUCCESS PAGE] Enrollment already exists:', {
            enrollmentId: enrollmentCheck.id,
            userId: enrollmentCheck.userId,
            courseId: enrollmentCheck.courseId
          })
        }
      } else {
        console.error('❌ [PAYMENT SUCCESS PAGE] Course not found for order:', {
          orderId: order_id,
          orderNote: orderNote,
          paymentAmount: payment?.amount,
          orderAmount: orderAmount,
          allCourses: await prisma.course.findMany({ select: { id: true, title: true, slug: true, price: true } })
        })
      }
    } else {
      console.log('ℹ️ [PAYMENT SUCCESS PAGE] Enrollment already exists:', {
        enrollmentId: existingEnrollment.id,
        courseId: existingEnrollment.courseId,
        courseTitle: existingEnrollment.course?.title
      })
    }
  } else {
    console.log('⚠️ [PAYMENT SUCCESS PAGE] Payment not successful, status:', cashfreeOrderStatus)
  }

  // Get updated enrollment info
  console.log('🔍 [PAYMENT SUCCESS PAGE] Fetching updated payment with enrollment...')
  const updatedPayment = await prisma.payment.findUnique({
    where: { orderId: order_id },
    include: {
      enrollment: {
        include: {
          course: true
        }
      }
    }
  })

  const enrollment = updatedPayment?.enrollment?.[0]
  const course = enrollment?.course

  console.log('📊 [PAYMENT SUCCESS PAGE] Final enrollment status:', {
    hasEnrollment: !!enrollment,
    enrollmentId: enrollment?.id,
    courseId: enrollment?.courseId,
    courseTitle: course?.title,
    paymentStatus: updatedPayment?.status
  })

  // Only show success popup if payment is successful
  if (!isPaymentSuccessful) {
    console.log('⚠️ [PAYMENT SUCCESS PAGE] Payment not successful, redirecting to dashboard')
    // If payment is not successful, redirect to dashboard
    redirect('/dashboard')
  }

  console.log('✅ [PAYMENT SUCCESS PAGE] Rendering success popup')
  return (
    <div className="min-h-screen bg-brand-background">
      <PaymentSuccessPopup
        courseTitle={course?.title}
        orderId={order_id}
        amount={payment?.amount ? payment.amount / 100 : 0}
      />
    </div>
  )
}
