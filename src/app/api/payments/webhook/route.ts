import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function verifyWebhookSignature(rawBody: string, signature: string, timestamp: string, secretKey: string): boolean {
  const signedPayload = timestamp + rawBody
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(signedPayload)
    .digest('base64')
  
  return expectedSignature === signature
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-webhook-signature')
    const timestamp = req.headers.get('x-webhook-timestamp')

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 })
    }

    // Verify webhook signature (if secret key is configured)
    const webhookSecretKey = process.env.WEBHOOK_SECRET_KEY || process.env.RAZORPAY_WEBHOOK_SECRET
    if (webhookSecretKey && !verifyWebhookSignature(rawBody, signature, timestamp, webhookSecretKey)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const webhookData = JSON.parse(rawBody)
    const { type, data } = webhookData

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order_id, payment_status, order_amount } = data.order

      // Get payment record
      const payment = await prisma.payment.findUnique({
        where: { orderId: order_id }
      })

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      if (payment_status === 'PAID') {
        // Get course details
        const course = await prisma.course.findFirst({
          where: { price: Math.round(order_amount * 100) } // Convert rupees to paise
        })

        if (course) {
          // Create enrollment
          await prisma.enrollment.create({
            data: {
              userId: payment.userId,
              courseId: course.id,
              status: 'ACTIVE',
              paymentId: payment.id
            }
          })
        }
      }
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
