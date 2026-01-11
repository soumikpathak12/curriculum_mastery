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
    const formData = await req.formData()
    const title = formData.get('title') as string | null
    const courseId = formData.get('courseId') as string | null
    const file = formData.get('file') as File | null

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get existing material
    const existingMaterial = await prisma.courseMaterial.findUnique({
      where: { id }
    })

    if (!existingMaterial) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const files = formData.getAll('file') as File[]

    // Resolve course by id or slug
    let course = await prisma.course.findFirst({
      where: { OR: [{ id: courseId || '' }, { slug: courseId || '' }] },
      select: { id: true, slug: true, title: true }
    })

    if (!course && courseId) {
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
          select: { id: true, slug: true, title: true }
        })
      }
    }

    // Update main material info
    const material = await prisma.courseMaterial.update({
      where: { id },
      data: {
        courseId: course?.id || existingMaterial.courseId,
        title,
      },
      include: {
        course: { select: { title: true } },
        files: true
      }
    })

    // Add new files if provided
    const newFiles = []
    for (const file of files) {
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
        'svg': 'IMAGE'
      }
      const type = typeMap[ext || ''] || 'PDF'

      const fileKey = `data:${file.type || 'application/octet-stream'};base64,${fileData}`

      const fileEntry = await prisma.courseMaterialFile.create({
        data: {
          materialId: id,
          type,
          fileKey,
          filename: file.name,
          size: file.size
        }
      })
      newFiles.push(fileEntry)
    }

    return NextResponse.json({ material })
  } catch (error) {
    console.error('Failed to update course material:', error)
    return NextResponse.json({ error: 'Failed to update course material' }, { status: 500 })
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

    // Delete related student assignments first (cascade should handle this, but being explicit)
    await prisma.studentMaterialAssignment.deleteMany({
      where: { materialId: id }
    })

    // Delete the material (file is stored as base64 in DB, so deleting record removes it)
    await prisma.courseMaterial.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Course material deleted successfully' })
  } catch (error) {
    console.error('Failed to delete course material:', error)
    return NextResponse.json({ error: 'Failed to delete course material' }, { status: 500 })
  }
}

