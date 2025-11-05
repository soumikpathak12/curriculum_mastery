import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Get recipients based on type
    let recipients: string[] = []

    switch (recipientType) {
      case 'all':
        // Get all students
        const students = await prisma.user.findMany({ 
          where: { role: 'STUDENT' }, 
          select: { email: true } 
        })
        recipients = students.map(s => s.email)
        break
      
      case 'students':
        // Same as 'all' for now
        const studentUsers = await prisma.user.findMany({
          where: { role: 'STUDENT' },
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

    // In a real implementation, you would send emails here
    // For now, we'll just log the recipients
    console.log(`Mailer "${title}" sent to ${recipients.length} recipients:`, recipients)

    return NextResponse.json({ 
      recipients: recipients.length,
      message: `Mailer sent to ${recipients.length} recipients`
    })
  } catch (error) {
    console.error('Failed to send mailer:', error)
    return NextResponse.json({ error: 'Failed to send mailer' }, { status: 500 })
  }
}
