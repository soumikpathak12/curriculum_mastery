import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optimization: Use session role directly to save a DB query
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    // Build where clause for search
    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}

    // Use a transaction to bundle the count and findMany queries
    // This can be more efficient and ensures data consistency
    const [totalCount, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          blocked: true,
          createdAt: true,
          _count: {
            select: {
              enrollments: true,
              payments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      })
    ])

    // Transform the data
    const usersWithCounts = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      blocked: user.blocked,
      createdAt: user.createdAt.toISOString(),
      enrollments: user._count.enrollments,
      payments: user._count.payments,
    }))

    return NextResponse.json({
      users: usersWithCounts,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    })
  } catch (error) {
    console.error('DEBUG: User Fetch Error:', error)
    if (error instanceof Error && error.message.includes('pool')) {
      return NextResponse.json(
        { error: 'Database is busy. Please try again in a few seconds.' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

