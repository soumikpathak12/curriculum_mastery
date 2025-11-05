import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export async function POST(req: NextRequest) {
  console.log('🔵 [PAYMENT CREATE API] Starting payment creation')
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('❌ [PAYMENT CREATE API] Unauthorized - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [PAYMENT CREATE API] Session found:', { email: session.user.email })

    const body = await req.json();
    const { courseId, courseTitle, orderAmount } = body as {
      courseId?: string; // This is courseSlug
      courseTitle?: string;
      orderAmount?: number | string;
    };

    console.log('📋 [PAYMENT CREATE API] Request body:', {
      courseId,
      courseTitle,
      orderAmount,
      orderAmountType: typeof orderAmount
    });

    if (!orderAmount) {
      console.log('❌ [PAYMENT CREATE API] orderAmount is required')
      return NextResponse.json({ error: 'orderAmount is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      console.log('❌ [PAYMENT CREATE API] User not found:', session.user.email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ [PAYMENT CREATE API] User found:', { userId: user.id, email: user.email })

    // Find course by slug to get course ID
    let course = null;
    if (courseId) {
      console.log('🔍 [PAYMENT CREATE API] Looking for course by slug:', courseId)
      course = await prisma.course.findUnique({
        where: { slug: courseId }
      });
      console.log(course ? `✅ [PAYMENT CREATE API] Course found: ${course.title} (ID: ${course.id})` : `❌ [PAYMENT CREATE API] Course not found: ${courseId}`)
    }

    const orderId = `order_${Date.now()}_${user.id.slice(-8)}`;
    const amountNumber = typeof orderAmount === 'string' ? parseFloat(orderAmount) : orderAmount;
    
    console.log('💰 [PAYMENT CREATE API] Amount processing:', {
      originalAmount: orderAmount,
      parsedAmount: amountNumber,
      orderId
    })
    
    // Validate amount
    if (!amountNumber || amountNumber <= 0) {
      console.log('❌ [PAYMENT CREATE API] Invalid amount:', amountNumber)
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Create local Payment record in CREATED status (store amount in paise)
    const amountPaise = Math.round((amountNumber || 0) * 100)
    
    // Store courseSlug in orderNote for webhook to use: "course:slug|Course Title"
    const orderNote = courseId ? `course:${courseId}|${courseTitle || 'Course Enrollment'}` : (courseTitle || 'Course Enrollment');

    console.log('💾 [PAYMENT CREATE API] Creating payment record:', {
      orderId,
      amountPaise,
      amountRupees: amountNumber,
      orderNote,
      userId: user.id
    })

    await prisma.payment.create({
      data: {
        orderId,
        amount: amountPaise,
        currency: 'INR',
        status: 'CREATED',
        userId: user.id,
        provider: 'cashfree',
      },
    });

    console.log('✅ [PAYMENT CREATE API] Payment record created in database')

    const payload = {
      order_id: orderId,
      order_amount: amountNumber, // Send amount in rupees (not paise)
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id,
        customer_name: user.name || session.user.name || 'Customer',
        customer_email: user.email,
        customer_phone: '9999999999', // Required field - using placeholder
      },
      order_meta: {
        return_url: `${req.nextUrl.origin}/payment/success?order_id={order_id}`,
        notify_url: `${req.nextUrl.origin}/api/payments/cashfree/webhook`,
      },
      order_note: orderNote,
    };

    // Get environment variables
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    const env = process.env.CASHFREE_ENV === 'PROD' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

    if (!clientId || !clientSecret) {
      console.error('Cashfree credentials not found:', { clientId: !!clientId, clientSecret: !!clientSecret });
      return NextResponse.json({ error: 'Cashfree not configured' }, { status: 500 });
    }

    // Initialize Cashfree SDK
    const cashfree = new Cashfree(env, clientId, clientSecret);

    console.log('Creating order with payload:', JSON.stringify(payload, null, 2));
    console.log('Cashfree credentials check:', { clientId: !!clientId, clientSecret: !!clientSecret, env });

    console.log('📞 [PAYMENT CREATE API] Calling Cashfree.PGCreateOrder...')
    console.log('📋 [PAYMENT CREATE API] Payload being sent to Cashfree:', JSON.stringify(payload, null, 2))
    
    let cfResponse
    try {
      cfResponse = await cashfree.PGCreateOrder(payload);
    } catch (createError: any) {
      console.error('❌ [PAYMENT CREATE API] Cashfree order creation failed:', {
        message: createError?.message || 'Unknown error',
        status: createError?.response?.status,
        statusText: createError?.response?.statusText,
        data: createError?.response?.data ? JSON.stringify(createError.response.data, null, 2) : 'No data',
        code: createError?.code
      })
      
      // If order creation failed, delete the payment record we created
      await prisma.payment.delete({
        where: { orderId }
      }).catch(err => {
        console.error('❌ [PAYMENT CREATE API] Failed to delete payment record:', err)
      })
      
      throw createError // Re-throw to be caught by outer catch
    }
    
    // Safe stringify function to avoid circular references
    const safeStringify = (obj: any) => {
      try {
        return JSON.stringify(obj, null, 2)
      } catch (e) {
        // If circular, return data only
        if (obj?.data) {
          try {
            return JSON.stringify({ data: obj.data }, null, 2)
          } catch (e2) {
            return 'Cannot stringify (circular reference)'
          }
        }
        return 'Cannot stringify (circular reference)'
      }
    }
    
    console.log('📦 [PAYMENT CREATE API] Cashfree API response:', {
      status: cfResponse?.status,
      statusCode: cfResponse?.statusCode,
      hasData: !!cfResponse?.data,
      data: cfResponse?.data ? safeStringify(cfResponse.data) : 'No data',
      dataKeys: cfResponse?.data ? Object.keys(cfResponse.data) : [],
      paymentSessionId: cfResponse?.data?.payment_session_id || cfResponse?.data?.paymentSessionId || 'NOT FOUND',
      orderId: cfResponse?.data?.order_id || cfResponse?.data?.orderId || 'NOT FOUND'
    })
    
    // Check if order was created successfully
    if (!cfResponse?.data) {
      console.error('❌ [PAYMENT CREATE API] Cashfree response missing data, order may not have been created')
      // Delete the payment record we created
      await prisma.payment.delete({
        where: { orderId }
      }).catch(err => {
        console.error('❌ [PAYMENT CREATE API] Failed to delete payment record:', err)
      })
      return NextResponse.json({ 
        error: 'Order creation failed - no response data from Cashfree' 
      }, { status: 500 })
    }
    
    // Check if payment_session_id is present (required for checkout)
    const paymentSessionId = cfResponse?.data?.payment_session_id || cfResponse?.data?.paymentSessionId
    if (!paymentSessionId) {
      console.error('❌ [PAYMENT CREATE API] No payment_session_id in response - order cannot be processed')
      console.error('❌ [PAYMENT CREATE API] Response data keys:', Object.keys(cfResponse.data || {}))
      // Delete the payment record we created
      await prisma.payment.delete({
        where: { orderId }
      }).catch(err => {
        console.error('❌ [PAYMENT CREATE API] Failed to delete payment record:', err)
      })
      return NextResponse.json({ 
        error: 'Order creation failed - no payment_session_id in response',
        responseData: cfResponse.data
      }, { status: 500 })
    }
    
    // Check if Cashfree returned a different order_id
    const cashfreeOrderId = cfResponse?.data?.order_id || cfResponse?.data?.orderId || orderId
    if (cashfreeOrderId && cashfreeOrderId !== orderId) {
      console.warn('⚠️ [PAYMENT CREATE API] Cashfree returned different order_id:', {
        ourOrderId: orderId,
        cashfreeOrderId: cashfreeOrderId
      })
      // Update payment record with Cashfree's order ID
      await prisma.payment.update({
        where: { orderId },
        data: { orderId: cashfreeOrderId }
      })
      console.log('✅ [PAYMENT CREATE API] Updated payment record with Cashfree order_id')
    }

    console.log('✅ [PAYMENT CREATE API] Payment order created successfully, returning response')
    console.log('✅ [PAYMENT CREATE API] Payment session ID:', paymentSessionId)
    return NextResponse.json({ 
      orderId: cashfreeOrderId || orderId, 
      data: cfResponse?.data,
      payment_session_id: paymentSessionId
    })
  } catch (error) {
    console.error('Cashfree order creation failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json({ 
      error: 'Order creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
