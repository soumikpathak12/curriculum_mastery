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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const assignmentId = formData.get('assignmentId') as string
    const comment = formData.get('comment') as string | null
    const file = formData.get('file') as File | null

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Check if assignment exists and user is enrolled
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId: assignment.courseId,
        status: 'ACTIVE'
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'You are not enrolled in this course' }, { status: 403 })
    }

    // Check if user already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        userId: user.id
      }
    })

    if (existingSubmission) {
      return NextResponse.json({ error: 'You have already submitted this assignment' }, { status: 400 })
    }

    // Handle file upload
    let fileKey = ''
    if (file) {
      // Generate a unique file key for the submission
      const timestamp = Date.now()
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      fileKey = `assignment-submissions/${assignmentId}/${user.id}/${timestamp}-${sanitizedFilename}`
      
      // TODO: Upload file to S3/R2 storage
      // For now, we'll just store the file key
      // In production, upload the file to your storage service here
    } else if (!comment) {
      return NextResponse.json({ error: 'Either a file or comment is required' }, { status: 400 })
    }

    // If no file but comment exists, create a placeholder file key
    if (!fileKey && comment) {
      fileKey = `assignment-submissions/${assignmentId}/${user.id}/${Date.now()}-text-submission.txt`
    }

    // Create submission record
    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        userId: user.id,
        fileKey,
        status: 'SUBMITTED'
      },
      include: {
        assignment: {
          select: { id: true, title: true }
        }
      }
    })

    // Store comment if provided (we can add a comment field to Submission model later, or use fileKey)
    // For now, if there's a comment, we could store it in a separate table or use the feedback field
    // But feedback is for instructor feedback, not student comments
    // TODO: Add a comment field to Submission model if needed

    return NextResponse.json({ 
      submission,
      message: 'Assignment submitted successfully'
    })
  } catch (error) {
    console.error('Failed to submit assignment:', error)
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 })
  }
}
