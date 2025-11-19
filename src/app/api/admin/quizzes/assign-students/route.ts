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

    const { quizId, studentIds } = await req.json()

    if (!quizId || !Array.isArray(studentIds)) {
      return NextResponse.json({ error: 'Invalid request. quizId and studentIds array required.' }, { status: 400 })
    }

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Assign students to quiz
    const assignments = await Promise.all(
      studentIds.map((userId: string) =>
        prisma.studentQuizAssignment.upsert({
          where: {
            userId_quizId: {
              userId,
              quizId
            }
          },
          create: {
            userId,
            quizId
          },
          update: {}
        })
      )
    )

    return NextResponse.json({ 
      message: `Successfully assigned ${assignments.length} student(s) to quiz`,
      assignments
    })
  } catch (error) {
    console.error('Failed to assign students to quiz:', error)
    return NextResponse.json({ error: 'Failed to assign students to quiz' }, { status: 500 })
  }
}
