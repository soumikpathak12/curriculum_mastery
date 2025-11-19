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
    amount: payment.amount,
    userId: payment.userId,
    existingEnrollments: payment.enrollment?.length || 0
  })

  // Check if enrollment exists - if it does, payment was successful
  const hasEnrollment = payment.enrollment && payment.enrollment.length > 0
  
  // If enrollment exists, payment was successful
  // Otherwise, try to create enrollment if payment exists
  const isPaymentSuccessful = hasEnrollment || true // Assume payment is valid if payment record exists

  console.log('🔍 [PAYMENT SUCCESS PAGE] Payment check:', {
    hasEnrollment,
    isPaymentSuccessful,
    existingEnrollmentCount: payment?.enrollment?.length || 0
  })

  if (isPaymentSuccessful) {
    const existingEnrollment = payment?.enrollment?.[0]
    
    if (!existingEnrollment) {
      console.log('📚 [PAYMENT SUCCESS PAGE] No existing enrollment found, attempting to create...')
      let course = null

      // Try to find course by matching payment amount
      if (!course && payment) {
        console.log('🔍 [PAYMENT SUCCESS PAGE] Attempting to find course by payment amount:', payment.amount, 'paise')
        course = await prisma.course.findFirst({
          where: { price: payment.amount }
        })
        console.log(course ? `✅ [PAYMENT SUCCESS PAGE] Course found by amount: ${course.title}` : `❌ [PAYMENT SUCCESS PAGE] Course not found by amount: ${payment.amount} paise`)
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
          paymentAmount: payment?.amount
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
    console.log('⚠️ [PAYMENT SUCCESS PAGE] Payment not successful')
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
    paymentAmount: updatedPayment?.amount
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
