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

    console.log('DEBUG: GET /api/admin/course-materials starting...')

    // Explicitly fetching with typed check
    const materials = await prisma.courseMaterial.findMany({
      where: courseId ? { courseId } : {},
      include: {
        course: {
          select: { id: true, title: true }
        },
        files: true
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`DEBUG: GET /api/admin/course-materials success, found ${materials.length} items`)
    return NextResponse.json({ materials })
  } catch (error: any) {
    console.error('DEBUG: GET /api/admin/course-materials failed:', error)
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

    console.log('DEBUG: POST /api/admin/course-materials starting...')
    const formData = await req.formData()
    const files = formData.getAll('file') as File[]
    const title = formData.get('title') as string | null
    const courseId = formData.get('courseId') as string | null

    console.log(`DEBUG: POST data - title: ${title}, courseId: ${courseId}, files: ${files.length}`)

    if (files.length === 0 || !title || !courseId) {
      console.log('DEBUG: POST missing fields')
      return NextResponse.json({ error: 'Files, title, and courseId are required' }, { status: 400 })
    }

    // Resolve course by id or slug
    let course = await prisma.course.findFirst({
      where: { OR: [{ id: courseId }, { slug: courseId }] },
      select: { id: true, slug: true, title: true }
    })

    if (!course) {
      console.log(`DEBUG: Course not found for ${courseId}, attempting upsert...`)
      const canonical: Record<string, string> = {
        'igcse-basic': 'IGCSE Music Basic',
        'igcse-advanced': 'IGCSE Music Advanced',
        'ib-comprehensive': 'IB Music Comprehensive',
        'ib-igcse-music-educators-course': 'IB & IGCSE Music Educators Course',
      }
      const titleFromSlug = canonical[courseId]
      if (!titleFromSlug) {
        console.log('DEBUG: Invalid courseId')
        return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 })
      }
      course = await prisma.course.upsert({
        where: { slug: courseId },
        update: {},
        create: { title: titleFromSlug, slug: courseId, price: 0, currency: 'INR' },
        select: { id: true, slug: true, title: true }
      })
    }

    console.log(`DEBUG: Target course ID: ${course.id}`)

    // Create CourseMaterial first
    const material = await prisma.courseMaterial.create({
      data: {
        courseId: course.id,
        title,
      }
    })

    console.log(`DEBUG: Material created ID: ${material.id}`)

    // Process all files
    const fileEntries = []
    for (const file of files) {
      console.log(`DEBUG: Processing file: ${file.name} (${file.size} bytes)`)
      // Convert file to base64 for storage
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const fileData = buffer.toString('base64')

      // Auto-detect file type from extension
      const ext = file.name.toLowerCase().split('.').pop()
      const typeMap: Record<string, 'PDF' | 'DOC' | 'DOCX' | 'PPT' | 'PPTX' | 'IMAGE'> = {
        'pdf': 'PDF',
        'doc': 'DOC',
        'docx': 'DOCX',
        'ppt': 'PPT',
        'pptx': 'PPTX',
        'png': 'IMAGE',
        'jpg': 'IMAGE',
        'jpeg': 'IMAGE',
        'gif': 'IMAGE',
        'webp': 'IMAGE',
        'svg': 'IMAGE',
      }
      const type = typeMap[ext || ''] || 'PDF'

      // Store file data in database (fileKey will contain base64 data)
      const fileKey = `data:${file.type || 'application/octet-stream'};base64,${fileData}`

      const fileEntry = await prisma.courseMaterialFile.create({
        data: {
          materialId: material.id,
          type,
          fileKey,
          filename: file.name,
          size: file.size
        }
      })
      fileEntries.push(fileEntry)
    }

    console.log(`DEBUG: Total files processed: ${fileEntries.length}`)

    return NextResponse.json({
      material: {
        ...material,
        files: fileEntries,
        course: { title: course.title }
      }
    })
  } catch (error) {
    console.error('Failed to create course material:', error)
    return NextResponse.json({ error: 'Failed to create course material' }, { status: 500 })
  }
}
