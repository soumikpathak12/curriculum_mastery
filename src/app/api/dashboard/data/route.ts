import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
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

    // First, check if user has any enrollments (lightweight query)
    const enrollmentCount = await prisma.enrollment.count({
      where: { userId: user.id }
    })

    // If no enrollments, return early
    if (enrollmentCount === 0) {
      return NextResponse.json({
        hasEnrollments: false,
        enrollments: [],
        availableCourses: [],
        assignments: [],
        quizzes: [],
        lessonProgress: [],
        stats: {
          totalEnrollments: 0,
          pendingAssignments: 0,
          pendingQuizzes: 0,
          overdueAssignments: 0,
          totalCompletedLessons: 0
        }
      })
    }

    // Only fetch heavy data if user has enrollments
    const [availableCourses, enrollments] = await Promise.all([
      prisma.course.findMany({
        include: { modules: { include: { lessons: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.enrollment.findMany({
        where: { userId: user.id },
        include: {
          course: {
            include: { 
              modules: { 
                include: { lessons: true },
                orderBy: { order: 'asc' }
              },
              assignments: {
                orderBy: { createdAt: 'desc' }
              },
              quizzes: {
                orderBy: { createdAt: 'desc' }
              }
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    ])

    // Get lesson progress, assignments, and quizzes in parallel
    const enrolledCourseIds = enrollments.map(e => e.courseId);
    
    const [lessonProgress, assignments, quizzes] = await Promise.all([
      enrolledCourseIds.length > 0 
        ? prisma.lessonProgress.findMany({
            where: { 
              userId: user.id,
              lesson: {
                module: {
                  courseId: { in: enrolledCourseIds }
                }
              }
            }
          })
        : Promise.resolve([]),
      enrolledCourseIds.length > 0
        ? prisma.assignment.findMany({
            where: {
              courseId: { in: enrolledCourseIds },
              studentAssignments: {
                some: {
                  userId: user.id
                }
              }
            },
            include: {
              course: {
                select: { title: true, slug: true }
              },
              submissions: {
                where: { userId: user.id },
                select: { id: true, status: true, createdAt: true, feedback: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
        : Promise.resolve([]),
      enrolledCourseIds.length > 0
        ? prisma.quiz.findMany({
            where: {
              courseId: { in: enrolledCourseIds },
              studentAssignments: {
                some: {
                  userId: user.id
                }
              }
            },
            include: {
              course: {
                select: { title: true, slug: true }
              },
              submissions: {
                where: { userId: user.id },
                select: { id: true, score: true, submittedAt: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
        : Promise.resolve([])
    ])
    
    const completedLessonIds = new Set(lessonProgress.map(lp => lp.lessonId))
    const enrolledCourseIdSet = new Set(enrolledCourseIds)
    const unenrolledCourses = availableCourses.filter(
      (course: { id: string }) => !enrolledCourseIdSet.has(course.id)
    )

    // Calculate stats
    const pendingAssignments = assignments.filter(a => !a.submissions[0] && (!a.dueAt || new Date(a.dueAt) > new Date())).length
    const pendingQuizzes = quizzes.filter(q => !q.submissions[0] && (!q.dueAt || new Date(q.dueAt) > new Date())).length
    const overdueAssignments = assignments.filter(a => a.dueAt && new Date(a.dueAt) < new Date() && !a.submissions[0]).length

    return NextResponse.json({
      hasEnrollments: true,
      enrollments,
      availableCourses: unenrolledCourses,
      assignments,
      quizzes,
      lessonProgress,
      completedLessonIds: Array.from(completedLessonIds),
      stats: {
        totalEnrollments: enrollments.length,
        pendingAssignments,
        pendingQuizzes,
        overdueAssignments,
        totalCompletedLessons: completedLessonIds.size
      }
    })
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}

