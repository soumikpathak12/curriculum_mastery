import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    await prisma.assignmentResource.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Resource deleted successfully' })
  } catch (error) {
    console.error('Failed to delete assignment resource:', error)
    return NextResponse.json({ error: 'Failed to delete assignment resource' }, { status: 500 })
  }
}


