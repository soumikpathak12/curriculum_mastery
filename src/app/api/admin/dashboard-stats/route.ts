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

    // Get all stats in parallel
    const [
      totalStudents,
      totalEnrollments,
      totalPayments,
      totalAssignments,
      pendingSubmissions,
      recentEnrollments
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.enrollment.count(),
      prisma.payment.count(),
      prisma.assignment.count(),
      prisma.submission.count({ where: { status: 'SUBMITTED' } }),
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } }
        }
      })
    ])

    return NextResponse.json({
      totalStudents,
      totalEnrollments,
      totalPayments,
      totalAssignments,
      pendingSubmissions,
      recentEnrollments
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
