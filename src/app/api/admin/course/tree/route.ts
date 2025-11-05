import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Return all courses
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: { resources: true },
            },
          },
        },
        assignments: true,
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ courses })
  } catch (e) {
    console.error('GET /api/admin/course/tree error', e)
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 })
  }
}
