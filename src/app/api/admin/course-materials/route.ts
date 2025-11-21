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

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null
    const courseId = formData.get('courseId') as string | null

    if (!file || !title || !courseId) {
      return NextResponse.json({ error: 'File, title, and courseId are required' }, { status: 400 })
    }

    // Convert file to base64 for storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileData = buffer.toString('base64')

    // Auto-detect file type from extension
    const ext = file.name.toLowerCase().split('.').pop()
    const typeMap: Record<string, 'PDF' | 'DOC' | 'DOCX' | 'PPT' | 'PPTX'> = {
      'pdf': 'PDF',
      'doc': 'DOC',
      'docx': 'DOCX',
      'ppt': 'PPT',
      'pptx': 'PPTX',
    }
    const type = typeMap[ext || ''] || 'PDF'

    // Store file data in database (fileKey will contain base64 data)
    const fileKey = `data:${file.type || 'application/octet-stream'};base64,${fileData}`

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
        filename: file.name,
        size: file.size
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
