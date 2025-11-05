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
    const body = await req.json()
    const { title, type, fileKey, filename, size } = body

    if (!title || !type || !fileKey || !filename || !size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const resource = await prisma.assignmentResource.create({
      data: {
        assignmentId: id,
        title,
        type,
        fileKey,
        filename,
        size
      }
    })

    return NextResponse.json({ resource })
  } catch (error) {
    console.error('Failed to create assignment resource:', error)
    return NextResponse.json({ error: 'Failed to create assignment resource' }, { status: 500 })
  }
}


