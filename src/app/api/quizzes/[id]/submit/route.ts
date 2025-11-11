import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    // Get quiz with questions (including correct answers for scoring)
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        course: { select: { id: true } },
        questions: {
          orderBy: { order: 'asc' },
        },
        submissions: {
          where: { userId: user.id },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if already submitted
    if (quiz.submissions.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted this quiz' },
        { status: 400 }
      )
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: quiz.courseId,
        status: 'ACTIVE',
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in this course to submit the quiz' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { answers } = body // answers is an object: { questionId: answer }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid answers format' },
        { status: 400 }
      )
    }

    // Calculate score
    let correctCount = 0
    const totalQuestions = quiz.questions.length

    for (const question of quiz.questions) {
      const userAnswer = answers[question.id]
      if (question.correctAnswer && userAnswer === question.correctAnswer) {
        correctCount++
      }
    }

    const score = Math.round((correctCount / totalQuestions) * 100)

    // Create submission
    const submission = await prisma.quizSubmission.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        answers: answers,
        score: score,
      },
      include: {
        quiz: {
          select: { title: true, courseId: true },
        },
      },
    })

    return NextResponse.json({
      submission,
      score,
      correctCount,
      totalQuestions,
    })
  } catch (error: any) {
    console.error('Failed to submit quiz:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit quiz',
        details: error?.message || error?.code,
      },
      { status: 500 }
    )
  }
}

