import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, content, recipientType, customEmails } = await req.json()

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 })
    }

    // Get recipients based on type
    let recipients: string[] = []

    switch (recipientType) {
      case 'all':
        // Get all students (excluding blocked users)
        const students = await prisma.user.findMany({ 
          where: { role: 'STUDENT', blocked: false }, 
          select: { email: true } 
        })
        recipients = students.map(s => s.email)
        break
      
      case 'students':
        // Same as 'all' for now
        const studentUsers = await prisma.user.findMany({
          where: { role: 'STUDENT', blocked: false },
          select: { email: true }
        })
        recipients = studentUsers.map(s => s.email)
        break
      
      case 'custom':
        if (!customEmails) {
          return NextResponse.json({ error: 'Custom emails are required' }, { status: 400 })
        }
        recipients = customEmails.split(',').map((email: string) => email.trim()).filter((email: string) => email)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid recipient type' }, { status: 400 })
    }

    // Remove duplicates
    recipients = [...new Set(recipients)]

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    // Convert content to HTML with proper email structure
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px; background-color: #ffffff;">
              <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">${title}</h1>
              <div style="color: #555555; font-size: 16px; line-height: 1.6;">
                ${content.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                This email was sent from Curriculum Mastery.<br>
                If you no longer wish to receive these emails, please contact us.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    // Create plain text version (important for deliverability)
    const textContent = content.replace(/\n\n+/g, '\n\n').trim()

    // Get the from email address (use verified domain)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@curriculum-mastery.in'
    const replyToEmail = process.env.RESEND_REPLY_TO || fromEmail

    // Send emails to all recipients with improved headers
    const results = await Promise.allSettled(
      recipients.map(email => 
        resend.emails.send({
          from: fromEmail,
          to: email,
          replyTo: replyToEmail,
          subject: title,
          html: htmlContent,
          text: textContent, // Plain text version for better deliverability
          headers: {
            'List-Unsubscribe': `<mailto:${replyToEmail}?subject=Unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'X-Entity-Ref-ID': `mailer-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          },
        })
      )
    )

    // Process results with detailed logging
    const emailResults: Array<{ email: string; success: boolean; error?: string; id?: string }> = []
    let successful = 0
    let failed = 0

    results.forEach((result, index) => {
      const email = recipients[index]
      if (result.status === 'fulfilled') {
        const response = result.value
        // Resend SDK v6 returns { data: { id: string }, error: null } on success
        // or { data: null, error: { message: string } } on error
        const responseAny = response as any
        
        if (responseAny.error) {
          failed++
          const errorMsg = typeof responseAny.error === 'string' 
            ? responseAny.error 
            : responseAny.error?.message || JSON.stringify(responseAny.error)
          emailResults.push({
            email,
            success: false,
            error: errorMsg
          })
          console.error(`Resend API error for ${email}:`, responseAny.error)
        } else if (responseAny.data?.id) {
          successful++
          emailResults.push({
            email,
            success: true,
            id: responseAny.data.id
          })
        } else if (responseAny.id) {
          // Some SDK versions return id directly
          successful++
          emailResults.push({
            email,
            success: true,
            id: responseAny.id
          })
        } else {
          failed++
          emailResults.push({
            email,
            success: false,
            error: `Unexpected response: ${JSON.stringify(responseAny).substring(0, 200)}`
          })
          console.error(`Unexpected response format for ${email}:`, JSON.stringify(responseAny, null, 2))
        }
      } else {
        failed++
        const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason)
        emailResults.push({
          email,
          success: false,
          error: errorMessage
        })
        console.error(`Failed to send email to ${email}:`, result.reason)
      }
    })
    
    return NextResponse.json({ 
      recipients: recipients.length,
      successful,
      failed,
      results: emailResults,
      message: `Mailer sent to ${successful} recipients${failed > 0 ? ` (${failed} failed)` : ''}`
    })
  } catch (error) {
    console.error('Failed to send mailer:', error)
    return NextResponse.json({ error: 'Failed to send mailer' }, { status: 500 })
  }
}
