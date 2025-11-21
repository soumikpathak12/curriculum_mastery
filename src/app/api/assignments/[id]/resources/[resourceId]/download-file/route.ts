import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id, resourceId } = await params

    // Get assignment resource
    const resource = await prisma.assignmentResource.findUnique({
      where: { id: resourceId },
      include: {
        assignment: {
          include: {
            course: true
          }
        }
      }
    })

    if (!resource || resource.assignmentId !== id) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: resource.assignment.courseId,
        status: 'ACTIVE'
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this course' }, { status: 403 })
    }

    // Check if assignment is assigned to this user
    const assignmentAssignment = await prisma.studentAssignment.findUnique({
      where: {
        userId_assignmentId: {
          userId: user.id,
          assignmentId: id
        }
      }
    })

    if (!assignmentAssignment) {
      return NextResponse.json({ error: 'This assignment has not been assigned to you' }, { status: 403 })
    }

    if (!resource.fileKey) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Determine content type based on file type
    const contentTypeMap: Record<string, string> = {
      'PDF': 'application/pdf',
      'DOC': 'application/msword',
      'DOCX': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'PPT': 'application/vnd.ms-powerpoint',
      'PPTX': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }

    const contentType = contentTypeMap[resource.type] || 'application/octet-stream'

    // Check if fileKey contains base64 data (stored directly in database)
    if (resource.fileKey.startsWith('data:')) {
      // Extract base64 data
      const base64Match = resource.fileKey.match(/^data:([^;]+);base64,(.+)$/)
      if (base64Match) {
        const [, detectedContentType, base64Data] = base64Match
        const buffer = Buffer.from(base64Data, 'base64')
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': detectedContentType || contentType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(resource.filename)}"`,
            'Content-Length': buffer.length.toString(),
          }
        })
      }
    }

    return NextResponse.json({ error: 'File format not supported' }, { status: 400 })
  } catch (error) {
    console.error('Failed to download assignment resource:', error)
    return NextResponse.json({ error: 'Failed to download assignment resource' }, { status: 500 })
  }
}

