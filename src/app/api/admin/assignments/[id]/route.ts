import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
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
    const { courseId, title, description, dueAt } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
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

    const assignment = await prisma.assignment.update({
      where: { id },
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

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Failed to update assignment:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
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
    
    // Delete related records first (cascade delete should handle this, but being explicit)
    // Files are stored as base64 in DB, so deleting records removes them automatically
    await prisma.studentAssignment.deleteMany({
      where: { assignmentId: id }
    })
    
    await prisma.assignmentResource.deleteMany({
      where: { assignmentId: id }
    })
    
    await prisma.submission.deleteMany({
      where: { assignmentId: id }
    })

    await prisma.assignment.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Failed to delete assignment:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}

