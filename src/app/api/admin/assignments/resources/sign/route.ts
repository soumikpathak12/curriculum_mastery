import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { filename } = await req.json().catch(() => ({ filename: undefined }))
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'filename required' }, { status: 400 })
    }

    // Generate a unique file key for storage
    const fileKey = `assignment-resources/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    return NextResponse.json({ fileKey })
  } catch (error) {
    console.error('Failed to generate file key:', error)
    return NextResponse.json({ error: 'Failed to generate file key' }, { status: 500 })
  }
}


























