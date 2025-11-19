import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        assignment: { select: { title: true } }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // For now, return a mock file download
    // In production, you would fetch the actual file from your storage service
    const mockFileContent = `Assignment Submission\n\nStudent: ${submission.user.name || submission.user.email}\nAssignment: ${submission.assignment.title}\nSubmitted: ${submission.createdAt}\nStatus: ${submission.status}\n\nThis is a mock file. In production, this would be the actual submitted file.`

    return new NextResponse(mockFileContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="submission_${id}.txt"`
      }
    })
  } catch (error) {
    console.error('Failed to download submission:', error)
    return NextResponse.json({ error: 'Failed to download submission' }, { status: 500 })
  }
}
