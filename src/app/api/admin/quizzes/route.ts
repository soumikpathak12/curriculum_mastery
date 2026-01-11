import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    console.log('DEBUG: GET /api/admin/quizzes starting...')
    const quizzes = await prisma.quiz.findMany({
      where: courseId ? { courseId } : {},
      include: {
        course: { select: { id: true, title: true } },
        questions: true,
        // studentAssignments deprecated for now
        submissions: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`DEBUG: GET /api/admin/quizzes success, found ${quizzes.length} items`)
    return NextResponse.json({ quizzes })
  } catch (error) {
    console.error('Failed to fetch quizzes:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { courseId, title, description, dueAt, questions } = body

    if (!courseId || !title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Resolve course by id or slug (fallback when UI provides slug ids)
    let course = await prisma.course.findFirst({
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
      if (!titleFromSlug) {
        return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 })
      }
      const created = await prisma.course.upsert({
        where: { slug: courseId },
        update: {},
        create: { title: titleFromSlug, slug: courseId, price: 0, currency: 'INR' },
        select: { id: true, title: true, slug: true }
      })
      course = created
    }

    const quiz = await prisma.quiz.create({
      data: {
        courseId: course.id,
        title,
        description,
        dueAt: dueAt ? new Date(dueAt) : null,
        questions: {
          create: questions.map((q: any, index: number) => ({
            type: q.type,
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            order: index + 1
          }))
        }
      },
      include: {
        course: { select: { title: true } },
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // Assign-to-students is disabled; all enrolled students can access

    return NextResponse.json({ quiz })
  } catch (error: any) {
    console.error('Failed to create quiz:', error)
    const errorMessage = error?.message || error?.code || 'Failed to create quiz'
    return NextResponse.json({
      error: 'Failed to create quiz',
      details: errorMessage,
      code: error?.code
    }, { status: 500 })
  }
}
