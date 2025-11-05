import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Cashfree, CFEnvironment } from 'cashfree-pg'

export async function GET(req: NextRequest) {
  console.log('🔵 [PAYMENT VERIFY API] Starting payment verification')
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [PAYMENT VERIFY API] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const order_id = searchParams.get('order_id')

    if (!order_id) {
      console.log('❌ [PAYMENT VERIFY API] No order_id provided')
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 })
    }

    console.log('📋 [PAYMENT VERIFY API] Verifying payment for order_id:', order_id)

    // Get payment record
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
      console.log('❌ [PAYMENT VERIFY API] Payment not found for order_id:', order_id)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.user.email !== session.user.email) {
      console.log('❌ [PAYMENT VERIFY API] Payment user mismatch')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ [PAYMENT VERIFY API] Payment found:', {
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amount,
      existingEnrollments: payment.enrollment?.length || 0
    })

    // Verify payment status with Cashfree API
    let cashfreeOrderStatus = payment.status
    let orderNote: string | null = null
    let orderAmount: number | null = null

    try {
      const clientId = process.env.CASHFREE_CLIENT_ID
      const clientSecret = process.env.CASHFREE_CLIENT_SECRET
      const env = process.env.CASHFREE_ENV === 'PROD' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX

      if (clientId && clientSecret) {
        const cashfree = new Cashfree(env, clientId, clientSecret)
        console.log('📞 [PAYMENT VERIFY API] Calling Cashfree.PGFetchOrder...')
        
        let orderResponse
        try {
          // PGFetchOrder expects order_id as a string parameter, not an object
          console.log(`📋 [PAYMENT VERIFY API] Calling PGFetchOrder with order_id string:`, order_id)
          orderResponse = await cashfree.PGFetchOrder(order_id)
        } catch (apiError: any) {
          console.error('❌ [PAYMENT VERIFY API] Cashfree API error:', {
            message: apiError?.message || 'Unknown error',
            status: apiError?.response?.status,
            statusText: apiError?.response?.statusText,
            data: apiError?.response?.data,
            code: apiError?.code
          })
          
          // If order not found, return error
          if (apiError?.response?.status === 400 || apiError?.response?.status === 404) {
            return NextResponse.json({ 
              success: false, 
              error: 'Order not found in Cashfree',
              order_id: order_id
            }, { status: 404 })
          }
          
          throw apiError // Re-throw for outer catch
        }
        
        console.log('📦 [PAYMENT VERIFY API] Cashfree API response:', {
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
          
          console.log('✅ [PAYMENT VERIFY API] Order details from Cashfree:', {
            orderStatus: cashfreeOrderStatus,
            orderNote: orderNote,
            orderAmount: orderAmount,
            previousStatus: payment.status
          })
          
          // Update payment status in database
          await prisma.payment.update({
            where: { orderId: order_id },
            data: { status: cashfreeOrderStatus }
          })
          
          // Refresh payment reference
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
        }
      }
    } catch (error) {
      console.error('❌ [PAYMENT VERIFY API] Error fetching order from Cashfree:', error)
    }

    // If payment is successful, ensure enrollment exists
    // Note: In Cashfree test/sandbox mode, status might vary
    const isPaymentSuccessful = cashfreeOrderStatus === 'PAID' || 
                                cashfreeOrderStatus === 'SUCCESS' || 
                                cashfreeOrderStatus === 'ACTIVE' ||
                                cashfreeOrderStatus === 'COMPLETED' ||
                                (cashfreeOrderStatus && cashfreeOrderStatus.toUpperCase().includes('SUCCESS')) ||
                                (cashfreeOrderStatus && cashfreeOrderStatus.toUpperCase().includes('PAID'))

    console.log('🔍 [PAYMENT VERIFY API] Payment status check:', {
      cashfreeOrderStatus,
      isPaymentSuccessful,
      existingEnrollmentCount: payment?.enrollment?.length || 0
    })

    if (isPaymentSuccessful) {
      const existingEnrollment = payment?.enrollment?.[0]
      
      if (!existingEnrollment) {
        console.log('📚 [PAYMENT VERIFY API] No existing enrollment found, attempting to create...')
        let course = null

        // Try to find course from orderNote first (most reliable)
        if (orderNote && orderNote.startsWith('course:')) {
          const match = orderNote.match(/^course:([^|]+)/)
          if (match) {
            const courseSlug = match[1]
            console.log('🔍 [PAYMENT VERIFY API] Looking for course by slug:', courseSlug)
            course = await prisma.course.findUnique({
              where: { slug: courseSlug }
            })
            console.log(course ? `✅ [PAYMENT VERIFY API] Course found by slug: ${course.title}` : `❌ [PAYMENT VERIFY API] Course not found by slug: ${courseSlug}`)
          }
        }

        // Fallback: find course by matching payment amount
        if (!course && payment) {
          console.log('🔍 [PAYMENT VERIFY API] Looking for course by payment amount:', payment.amount, 'paise')
          course = await prisma.course.findFirst({
            where: { price: payment.amount }
          })
          console.log(course ? `✅ [PAYMENT VERIFY API] Course found by amount: ${course.title}` : `❌ [PAYMENT VERIFY API] Course not found by amount: ${payment.amount} paise`)
        }

        // Fallback: find course by orderAmount if available
        if (!course && orderAmount) {
          const amountInPaise = Math.round(orderAmount * 100)
          console.log('🔍 [PAYMENT VERIFY API] Looking for course by order amount:', amountInPaise, 'paise')
          course = await prisma.course.findFirst({
            where: { price: amountInPaise }
          })
          console.log(course ? `✅ [PAYMENT VERIFY API] Course found by order amount: ${course.title}` : `❌ [PAYMENT VERIFY API] Course not found by order amount: ${amountInPaise} paise`)
        }

        if (course && payment) {
          console.log('✅ [PAYMENT VERIFY API] Course identified:', {
            courseId: course.id,
            courseTitle: course.title,
            courseSlug: course.slug,
            price: course.price
          })

          // Check if enrollment already exists (race condition check)
          const enrollmentCheck = await prisma.enrollment.findUnique({
            where: {
              userId_courseId: {
                userId: payment.userId,
                courseId: course.id
              }
            }
          })

          if (!enrollmentCheck) {
            console.log('📝 [PAYMENT VERIFY API] Creating enrollment...')
            const newEnrollment = await prisma.enrollment.create({
              data: {
                userId: payment.userId,
                courseId: course.id,
                status: 'ACTIVE',
                paymentId: payment.id
              }
            })
            console.log('✅ [PAYMENT VERIFY API] Enrollment created successfully:', {
              enrollmentId: newEnrollment.id,
              userId: newEnrollment.userId,
              courseId: newEnrollment.courseId,
              status: newEnrollment.status
            })
            return NextResponse.json({ 
              success: true, 
              message: 'Enrollment created',
              enrollment: newEnrollment 
            })
          } else {
            console.log('ℹ️ [PAYMENT VERIFY API] Enrollment already exists')
            return NextResponse.json({ 
              success: true, 
              message: 'Enrollment already exists',
              enrollment: enrollmentCheck 
            })
          }
        } else {
          console.error('❌ [PAYMENT VERIFY API] Course not found for order:', {
            orderId: order_id,
            orderNote: orderNote,
            paymentAmount: payment?.amount,
            orderAmount: orderAmount
          })
          return NextResponse.json({ 
            success: false, 
            error: 'Course not found',
            orderNote,
            paymentAmount: payment?.amount,
            orderAmount
          })
        }
      } else {
        console.log('ℹ️ [PAYMENT VERIFY API] Enrollment already exists')
        return NextResponse.json({ 
          success: true, 
          message: 'Enrollment already exists',
          enrollment: existingEnrollment 
        })
      }
    } else {
      console.log('⚠️ [PAYMENT VERIFY API] Payment not successful, status:', cashfreeOrderStatus)
      return NextResponse.json({ 
        success: false, 
        message: 'Payment not successful',
        status: cashfreeOrderStatus 
      })
    }
  } catch (error) {
    console.error('❌ [PAYMENT VERIFY API] Error:', error)
    return NextResponse.json({ 
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

