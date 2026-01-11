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
    const resources = await prisma.assignmentResource.findMany({
      where: { assignmentId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Failed to fetch assignment resources:', error)
    return NextResponse.json({ error: 'Failed to fetch assignment resources' }, { status: 500 })
  }
}

export async function POST(
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
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null

    if (!file || !title) {
      return NextResponse.json({ error: 'File and title are required' }, { status: 400 })
    }

    // Convert file to base64 for storage (works well with Netlify serverless)
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

    const resource = await prisma.assignmentResource.create({
      data: {
        assignmentId: id,
        title,
        type,
        fileKey,
        filename: file.name,
        size: file.size
      }
    })

    return NextResponse.json({ resource })
  } catch (error) {
    console.error('Failed to create assignment resource:', error)
    return NextResponse.json({ error: 'Failed to create assignment resource' }, { status: 500 })
  }
}


