import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Return only basic course info (lightweight query)
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ courses })
  } catch (e) {
    console.error('GET /api/admin/courses error', e)
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 })
  }
}

