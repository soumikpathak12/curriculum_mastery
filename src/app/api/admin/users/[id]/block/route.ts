import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = params
    const { blocked } = await req.json()

    // Prevent blocking yourself
    if (id === adminUser.id && blocked) {
      return NextResponse.json(
        { error: 'You cannot block your own account' },
        { status: 400 }
      )
    }

    // Update user blocked status
    const user = await prisma.user.update({
      where: { id },
      data: { blocked: Boolean(blocked) },
    })

    return NextResponse.json({
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
      user: {
        id: user.id,
        email: user.email,
        blocked: user.blocked,
      },
    })
  } catch (error) {
    console.error('Error updating user block status:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

