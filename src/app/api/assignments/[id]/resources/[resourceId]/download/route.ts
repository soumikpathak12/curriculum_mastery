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

    // Return download endpoint that serves the file
    const downloadUrl = `/api/assignments/${id}/resources/${resourceId}/download-file`
    return NextResponse.json({ 
      downloadUrl,
      filename: resource.filename
    })
  } catch (error) {
    console.error('Failed to get download URL:', error)
    return NextResponse.json({ error: 'Failed to get download URL' }, { status: 500 })
  }
}
