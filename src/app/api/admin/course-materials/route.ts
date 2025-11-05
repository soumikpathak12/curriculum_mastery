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

    const materials = await prisma.courseMaterial.findMany({
      where: courseId ? { courseId } : {},
      include: {
        course: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ materials })
  } catch (error: any) {
    console.error('Failed to fetch course materials:', error)
    const errorMessage = error?.message || error?.code || 'Failed to fetch course materials'
    return NextResponse.json({ 
      error: 'Failed to fetch course materials',
      details: errorMessage,
      code: error?.code
    }, { status: 500 })
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
    const { courseId, title, type, fileKey, filename, size } = body

    if (!courseId || !title || !type || !fileKey || !filename || !size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Resolve course by id or slug
    let course = await prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
      select: { id: true, slug: true }
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
        select: { id: true, slug: true }
      })
    }

    const material = await prisma.courseMaterial.create({
      data: {
        courseId: course.id,
        title,
        type,
        fileKey,
        filename,
        size
      },
      include: {
        course: { select: { title: true } }
      }
    })

    return NextResponse.json({ material })
  } catch (error) {
    console.error('Failed to create course material:', error)
    return NextResponse.json({ error: 'Failed to create course material' }, { status: 500 })
  }
}
