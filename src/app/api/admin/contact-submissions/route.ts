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

        // Fetch all contact submissions, sorted by most recent first
        const submissions = await prisma.contactSubmission.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ submissions }, { status: 200 })
    } catch (error) {
        console.error('Error fetching contact submissions:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
