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

    const { materialId, studentIds } = await req.json()

    if (!materialId || !Array.isArray(studentIds)) {
      return NextResponse.json({ error: 'Invalid request. materialId and studentIds array required.' }, { status: 400 })
    }

    // Verify material exists
    const material = await prisma.courseMaterial.findUnique({
      where: { id: materialId }
    })

    if (!material) {
      return NextResponse.json({ error: 'Course material not found' }, { status: 404 })
    }

    // Assign students to material
    const assignments = await Promise.all(
      studentIds.map((userId: string) =>
        prisma.studentMaterialAssignment.upsert({
          where: {
            userId_materialId: {
              userId,
              materialId
            }
          },
          create: {
            userId,
            materialId
          },
          update: {}
        })
      )
    )

    return NextResponse.json({ 
      message: `Successfully assigned ${assignments.length} student(s) to course material`,
      assignments
    })
  } catch (error) {
    console.error('Failed to assign students to material:', error)
    return NextResponse.json({ error: 'Failed to assign students to material' }, { status: 500 })
  }
}

