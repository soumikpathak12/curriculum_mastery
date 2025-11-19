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
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    // Get quiz with questions (without correct answers)
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            question: true,
            options: true,
            order: true,
            // Don't include correctAnswer
          },
        },
        submissions: {
          where: { userId: user.id },
          select: { id: true, submittedAt: true },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: quiz.courseId,
        status: 'ACTIVE',
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to take the quiz' },
        { status: 403 }
      )
    }

    // Check if already submitted
    if (quiz.submissions.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted this quiz' },
        { status: 400 }
      )
    }

    // Return quiz without correct answers
    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Failed to fetch quiz:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}

