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

    // Get student groups based on course enrollments
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { title: true } }
      }
    })

    // Group students by course
    const courseGroups = enrollments.reduce((acc, enrollment) => {
      const courseTitle = enrollment.course.title
      if (!acc[courseTitle]) {
        acc[courseTitle] = []
      }
      acc[courseTitle].push(enrollment.user)
      return acc
    }, {} as Record<string, Array<{ id: string; name: string | null; email: string }>>)

    const groups = Object.entries(courseGroups).map(([courseTitle, students]) => ({
      id: courseTitle.toLowerCase().replace(/\s+/g, '-'),
      name: `${courseTitle} Students`,
      count: students.length
    }))

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Failed to fetch student groups:', error)
    return NextResponse.json({ error: 'Failed to fetch student groups' }, { status: 500 })
  }
}
