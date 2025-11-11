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
        recipients = customEmails.split(',').map(email => email.trim()).filter(email => email)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid recipient type' }, { status: 400 })
    }

    // Remove duplicates
    recipients = [...new Set(recipients)]

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
    }

    // Convert content to HTML (preserve line breaks)
    const htmlContent = content.replace(/\n/g, '<br>')

    // Get the from email address (use verified domain or default)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    // Send emails to all recipients
    const results = await Promise.allSettled(
      recipients.map(email => 
        resend.emails.send({
          from: fromEmail,
          to: email,
          subject: title,
          html: htmlContent,
        })
      )
    )

    // Count successful and failed sends
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    // Log any failures for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send email to ${recipients[index]}:`, result.reason)
      }
    })

    return NextResponse.json({ 
      recipients: recipients.length,
      successful,
      failed,
      message: `Mailer sent to ${successful} recipients${failed > 0 ? ` (${failed} failed)` : ''}`
    })
  } catch (error) {
    console.error('Failed to send mailer:', error)
    return NextResponse.json({ error: 'Failed to send mailer' }, { status: 500 })
  }
}
