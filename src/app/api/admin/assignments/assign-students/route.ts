import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { assignmentId, studentIds, dueAt } = body

    if (!assignmentId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Remove existing assignments for this assignment
    await prisma.studentAssignment.deleteMany({
      where: { assignmentId }
    })

    // Create new assignments
    const studentAssignments = await prisma.studentAssignment.createMany({
      data: studentIds.map((userId: string) => ({
        assignmentId,
        userId,
        dueAt: dueAt ? new Date(dueAt) : null
      }))
    })

    return NextResponse.json({ 
      message: 'Students assigned successfully',
      count: studentAssignments.count 
    })
  } catch (error) {
    console.error('Failed to assign students:', error)
    return NextResponse.json({ error: 'Failed to assign students' }, { status: 500 })
  }
}
