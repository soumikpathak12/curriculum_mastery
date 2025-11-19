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
    // Get quiz with questions (including correct answers) and submission
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true } },
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
        { error: 'You must be enrolled in this course to view results' },
        { status: 403 }
      )
    }

    // Check if quiz is assigned to this user
    const quizAssignment = await prisma.studentQuizAssignment.findUnique({
      where: {
        userId_quizId: {
          userId: user.id,
          quizId: id
        }
      }
    })

    if (!quizAssignment) {
      return NextResponse.json(
        { error: 'This quiz has not been assigned to you' },
        { status: 403 }
      )
    }

    // Check if submitted
    if (quiz.submissions.length === 0) {
      return NextResponse.json(
        { error: 'You have not submitted this quiz yet' },
        { status: 400 }
      )
    }

    const submission = quiz.submissions[0]
    const userAnswers = submission.answers as Record<string, string>

    // Calculate detailed results
    const results = quiz.questions.map((question) => {
      const userAnswer = userAnswers[question.id] || ''
      const isCorrect = question.correctAnswer && userAnswer === question.correctAnswer

      return {
        questionId: question.id,
        type: question.type,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        order: question.order,
      }
    })

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        course: quiz.course,
      },
      submission: {
        id: submission.id,
        score: submission.score,
        submittedAt: submission.submittedAt,
      },
      results,
    })
  } catch (error) {
    console.error('Failed to fetch quiz results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz results' },
      { status: 500 }
    )
  }
}

