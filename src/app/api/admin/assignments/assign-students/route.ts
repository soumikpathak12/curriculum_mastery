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

    const { assignmentId, studentIds } = await req.json()

    if (!assignmentId || !Array.isArray(studentIds)) {
      return NextResponse.json({ error: 'Invalid request. assignmentId and studentIds array required.' }, { status: 400 })
    }

    // Verify assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Assign students to assignment
    const assignments = await Promise.all(
      studentIds.map((userId: string) =>
        prisma.studentAssignment.upsert({
          where: {
            userId_assignmentId: {
              userId,
              assignmentId
            }
          },
          create: {
            userId,
            assignmentId
          },
          update: {}
        })
      )
    )

    return NextResponse.json({ 
      message: `Successfully assigned ${assignments.length} student(s) to assignment`,
      assignments
    })
  } catch (error) {
    console.error('Failed to assign students:', error)
    return NextResponse.json({ error: 'Failed to assign students' }, { status: 500 })
  }
}
