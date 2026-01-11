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

    console.log('DEBUG: GET /api/admin/assignments/enhanced starting...')
    const assignments = await prisma.assignment.findMany({
      where: courseId ? { courseId } : {},
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        resources: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`DEBUG: GET /api/admin/assignments/enhanced success, found ${assignments.length} items`)
    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Failed to fetch assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
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
    const { courseId, title, description, dueAt } = body

    if (!courseId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Resolve course by id or slug
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
      course = await prisma.course.upsert({
        where: { slug: courseId },
        update: {},
        create: { title: titleFromSlug, slug: courseId, price: 0, currency: 'INR' },
        select: { id: true, title: true, slug: true }
      })
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId: course.id,
        title,
        description,
        dueAt: dueAt ? new Date(dueAt) : null
      },
      include: {
        course: { select: { title: true } }
      }
    })

    // Assign-to-students is disabled; all enrolled students can access

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Failed to create assignment:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
