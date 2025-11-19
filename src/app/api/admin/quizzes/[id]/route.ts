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
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          orderBy: { order: 'asc' }
        },
        submissions: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Failed to fetch quiz:', error)
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 })
  }
}

export async function PATCH(
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
    const body = await req.json()
    const { courseId, title, description, dueAt, questions } = body

    // Resolve course by id or slug if courseId is provided
    let course = null
    if (courseId) {
      course = await prisma.course.findFirst({
        where: { OR: [{ id: courseId }, { slug: courseId }] },
        select: { id: true, title: true, slug: true }
      })

      if (!course) {
        const canonical: Record<string, string> = {
          'igcse-basic': 'IGCSE Music Basic',
          'igcse-advanced': 'IGCSE Music Advanced',
          'ib-comprehensive': 'IB Music Comprehensive',
          'ib-igcse-music-educators-course': 'IB & IGCSE Music Educators Course',
        }
        const titleFromSlug = canonical[courseId]
        if (titleFromSlug) {
          course = await prisma.course.upsert({
            where: { slug: courseId },
            update: {},
            create: { title: titleFromSlug, slug: courseId, price: 0, currency: 'INR' },
            select: { id: true, title: true, slug: true }
          })
        }
      }
    }

    // Get existing quiz
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true }
    })

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Delete existing questions if new ones provided
    if (questions && Array.isArray(questions)) {
      await prisma.quizQuestion.deleteMany({
        where: { quizId: id }
      })
    }

    // Update quiz
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : null
    if (course && course.id) updateData.courseId = course.id

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        ...updateData,
        ...(questions && Array.isArray(questions) ? {
          questions: {
            create: questions.map((q: any, index: number) => ({
              type: q.type,
              question: q.question,
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              order: index + 1
            }))
          }
        } : {})
      },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json({ quiz })
  } catch (error: any) {
    console.error('Failed to update quiz:', error)
    return NextResponse.json({ 
      error: 'Failed to update quiz',
      details: error?.message || error?.code
    }, { status: 500 })
  }
}

export async function DELETE(
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
    // Delete quiz (cascade will handle questions and submissions)
    await prisma.quiz.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Failed to delete quiz:', error)
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
  }
}
