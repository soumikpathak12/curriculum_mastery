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

    if (!submission.fileKey) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if fileKey contains base64 data (stored directly in database)
    if (submission.fileKey.startsWith('data:')) {
      // Extract base64 data
      const base64Match = submission.fileKey.match(/^data:([^;]+);base64,(.+)$/)
      if (base64Match) {
        const [, contentType, base64Data] = base64Match
        const buffer = Buffer.from(base64Data, 'base64')
        
        const filename = `${submission.assignment.title}_${submission.user.name || submission.user.email}.${contentType.includes('pdf') ? 'pdf' : 'txt'}`
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'Content-Length': buffer.length.toString(),
          }
        })
      }
    }

    // Fallback for legacy file keys
    return NextResponse.json({ error: 'File format not supported' }, { status: 400 })
  } catch (error) {
    console.error('Failed to download submission:', error)
    return NextResponse.json({ error: 'Failed to download submission' }, { status: 500 })
  }
}
