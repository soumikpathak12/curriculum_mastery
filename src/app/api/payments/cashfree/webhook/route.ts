import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cashfree webhook handler
export async function POST(req: NextRequest) {
  console.log('🔵 [CASHFREE WEBHOOK] Webhook received')
  
  try {
    const event = await req.json();
    console.log('📦 [CASHFREE WEBHOOK] Full webhook event:', JSON.stringify(event, null, 2));

    // Extract order details from webhook
    const orderId = event?.data?.order?.order_id;
    const orderStatus = event?.data?.order?.order_status;
    const orderAmount = event?.data?.order?.order_amount;
    const orderNote = event?.data?.order?.order_note;
    
    console.log('📋 [CASHFREE WEBHOOK] Extracted order details:', {
      orderId,
      orderStatus,
      orderAmount,
      orderNote,
      eventType: event?.type,
      eventTime: new Date().toISOString()
    })

    if (!orderId) {
      console.error('No order_id in webhook event');
      return NextResponse.json({ error: 'No order_id' }, { status: 400 });
    }

    // Update payment status
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { user: true }
    });

    if (!payment) {
      console.error(`Payment not found for order_id: ${orderId}`);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    await prisma.payment.update({
      where: { orderId },
      data: { status: orderStatus || 'UNKNOWN' }
    });

    // If payment is successful, create enrollment
    // Cashfree statuses: PAID, SUCCESS, ACTIVE, COMPLETED (all indicate successful payment)
    // In test mode, statuses might vary
    const isPaymentSuccessful = orderStatus === 'PAID' || 
                                orderStatus === 'SUCCESS' || 
                                orderStatus === 'ACTIVE' ||
                                orderStatus === 'COMPLETED' ||
                                (orderStatus && orderStatus.toUpperCase().includes('SUCCESS')) ||
                                (orderStatus && orderStatus.toUpperCase().includes('PAID'))

    if (isPaymentSuccessful) {
      // Extract courseSlug from orderNote (format: "course:slug|Title")
      let courseSlug = null;
      if (orderNote && orderNote.startsWith('course:')) {
        const match = orderNote.match(/^course:([^|]+)/);
        if (match) {
          courseSlug = match[1];
        }
      }

      // Find course by slug first (most reliable)
      let course = null;
      if (courseSlug) {
        course = await prisma.course.findUnique({
          where: { slug: courseSlug }
        });
        console.log(`Found course by slug: ${courseSlug} -> ${course ? course.title : 'NOT FOUND'}`);
      }

      // Fallback: find course by price if slug not found
      if (!course && orderAmount) {
        const amountInPaise = Math.round(orderAmount * 100);
        const courses = await prisma.course.findMany({
          where: { price: amountInPaise }
        });
        // If multiple courses with same price, take first one
        // (This shouldn't happen with current pricing, but handle it)
        course = courses[0] || null;
        console.log(`Found course by price: ${amountInPaise} paise -> ${course ? course.title : 'NOT FOUND'}`);
      }

      // Fallback: find course by payment amount in database
      if (!course) {
        course = await prisma.course.findFirst({
          where: { price: payment.amount }
        });
        console.log(`Found course by payment amount: ${payment.amount} paise -> ${course ? course.title : 'NOT FOUND'}`);
      }

      if (course) {
        // Check if enrollment already exists
        const existingEnrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: payment.userId,
              courseId: course.id
            }
          }
        });

        if (!existingEnrollment) {
          // Create enrollment
          const enrollment = await prisma.enrollment.create({
            data: {
              userId: payment.userId,
              courseId: course.id,
              status: 'ACTIVE',
              paymentId: payment.id
            }
          });
          console.log(`✅ Enrollment created via webhook: user ${payment.userId} -> course ${course.id} (${course.title})`);
        } else {
          console.log(`ℹ️  Enrollment already exists: user ${payment.userId} -> course ${course.id} (${course.title})`);
        }
      } else {
        console.error(`❌ Course not found for order ${orderId}. courseSlug: ${courseSlug}, orderAmount: ${orderAmount}, paymentAmount: ${payment.amount}`);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    const message = error instanceof Error ? error.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
