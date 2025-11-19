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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    // Get assignment with resources and check if user is enrolled in the course
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true }
        },
        resources: {
          orderBy: { createdAt: 'desc' }
        },
        submissions: {
          where: { userId: user.id },
          select: { id: true, status: true, createdAt: true, feedback: true }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: assignment.courseId,
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

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Failed to fetch assignment:', error)
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 })
  }
}
