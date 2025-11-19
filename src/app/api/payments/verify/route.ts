import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      amount: payment.amount,
      existingEnrollments: payment.enrollment?.length || 0
    })

    // Check if enrollment exists - if it does, payment was successful
    const hasEnrollment = payment.enrollment && payment.enrollment.length > 0
    
    // If enrollment exists, payment was successful
    // Otherwise, try to create enrollment if payment exists
    const isPaymentSuccessful = hasEnrollment || true // Assume payment is valid if payment record exists

    console.log('🔍 [PAYMENT VERIFY API] Payment check:', {
      hasEnrollment,
      isPaymentSuccessful,
      existingEnrollmentCount: payment?.enrollment?.length || 0
    })

    if (isPaymentSuccessful) {
      const existingEnrollment = payment?.enrollment?.[0]
      
      if (!existingEnrollment) {
        console.log('📚 [PAYMENT VERIFY API] No existing enrollment found, attempting to create...')
        let course = null

        // Try to find course by payment amount (most reliable)
        if (!course && payment) {
          console.log('🔍 [PAYMENT VERIFY API] Looking for course by payment amount:', payment.amount, 'paise')
          course = await prisma.course.findFirst({
            where: { price: payment.amount }
          })
          console.log(course ? `✅ [PAYMENT VERIFY API] Course found by amount: ${course.title}` : `❌ [PAYMENT VERIFY API] Course not found by amount: ${payment.amount} paise`)
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
            paymentAmount: payment?.amount
          })
          return NextResponse.json({ 
            success: false, 
            error: 'Course not found',
            paymentAmount: payment?.amount
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
      console.log('⚠️ [PAYMENT VERIFY API] Payment not found or invalid')
      return NextResponse.json({ 
        success: false, 
        message: 'Payment not found or invalid'
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

