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

    const { email, courseId } = await req.json()

    if (!email || !courseId) {
      return NextResponse.json(
        { error: 'Email and courseId are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found with this email' },
        { status: 404 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'User is already enrolled in this course' },
        { status: 400 }
      )
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: courseId,
        status: 'ACTIVE'
      },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } }
      }
    })

    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        user: enrollment.user,
        course: enrollment.course,
        status: enrollment.status,
        createdAt: enrollment.createdAt
      }
    })
  } catch (error: any) {
    console.error('Failed to create enrollment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create enrollment' },
      { status: 500 }
    )
  }
}

