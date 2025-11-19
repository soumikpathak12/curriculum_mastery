import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Per-student assignment feature is disabled
    // All enrolled students can access assignments
    return NextResponse.json({ 
      message: 'Per-student assignment is disabled. All enrolled students can access assignments.',
      note: 'This feature has been disabled. Assignments are accessible to all students enrolled in the course.'
    })
  } catch (error) {
    console.error('Failed to assign students:', error)
    return NextResponse.json({ error: 'Failed to assign students' }, { status: 500 })
  }
}
