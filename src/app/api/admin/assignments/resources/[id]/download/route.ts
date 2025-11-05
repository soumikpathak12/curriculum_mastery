import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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
    const resource = await prisma.assignmentResource.findUnique({
      where: { id },
      include: {
        assignment: { select: { title: true } }
      }
    })

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // For now, return a mock file download
    // In production, you would fetch the actual file from your storage service using the fileKey
    const mockFileContent = `Assignment Resource\n\nAssignment: ${resource.assignment.title}\nTitle: ${resource.title}\nFilename: ${resource.filename}\nType: ${resource.type}\nSize: ${resource.size} bytes\n\nThis is a mock file. In production, this would fetch the actual file from storage using fileKey: ${resource.fileKey}`

    // Determine content type based on file type
    const contentTypeMap: Record<string, string> = {
      'PDF': 'application/pdf',
      'DOC': 'application/msword',
      'DOCX': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'PPT': 'application/vnd.ms-powerpoint',
      'PPTX': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }

    const contentType = contentTypeMap[resource.type] || 'application/octet-stream'

    return new NextResponse(mockFileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${resource.filename}"`
      }
    })
  } catch (error) {
    console.error('Failed to download assignment resource:', error)
    return NextResponse.json({ error: 'Failed to download assignment resource' }, { status: 500 })
  }
}

