import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Fetch all newsletter subscribers, sorted by most recent first
        const subscribers = await prisma.newsletterSubscriber.findMany({
            orderBy: {
                subscribedAt: 'desc'
            }
        })

        return NextResponse.json({ subscribers }, { status: 200 })
    } catch (error) {
        console.error('Error fetching newsletter subscribers:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
