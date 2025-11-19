import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, courseId } = await req.json()
    if (!orderId || !courseId) {
      return NextResponse.json({ error: 'Order ID and Course ID required' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get course
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { orderId }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({ 
        message: 'Already enrolled',
        enrollment: existingEnrollment
      })
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status: 'ACTIVE',
        paymentId: payment.id
      }
    })

    return NextResponse.json({
      message: 'Mock payment successful and enrollment created',
      enrollment,
      payment: {
        orderId: payment.orderId,
        amount: payment.amount
      }
    })

  } catch (error) {
    console.error('Mock payment success error:', error)
    return NextResponse.json(
      { error: 'Failed to process mock payment' },
      { status: 500 }
    )
  }
}
