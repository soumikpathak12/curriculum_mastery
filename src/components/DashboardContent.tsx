'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import AssignmentsQuizzesTabs from '@/components/AssignmentsQuizzesTabs'
import ScrollToTopButton from '@/components/ScrollToTopButton'

interface DashboardData {
  hasEnrollments: boolean
  enrollments: any[]
  availableCourses: any[]
  assignments: any[]
  quizzes: any[]
  lessonProgress: any[]
  completedLessonIds: string[]
  stats: {
    totalEnrollments: number
    pendingAssignments: number
    pendingQuizzes: number
    overdueAssignments: number
    totalCompletedLessons: number
  }
}

export default function DashboardContent() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/dashboard/data')
        if (!res.ok) {
          throw new Error('Failed to load dashboard data')
        }
        const dashboardData = await res.json()
        setData(dashboardData)
      } catch (err) {
        console.error('Failed to load dashboard:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col">
        <Header />
        <main className="mx-auto max-w-7xl p-4 sm:p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col">
        <Header />
        <main className="mx-auto max-w-7xl p-4 sm:p-6 flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // If no enrollments, show QR code
  if (!data.hasEnrollments) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col">
        <Header />
        <main className="mx-auto max-w-4xl p-4 sm:p-6 flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-brand-primary mb-2">Complete Your Enrollment</h1>
              <p className="text-gray-600 mb-4">
                Scan the QR code below to make payment via GPay
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Once payment is received, you will be enrolled in the course automatically
              </p>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <Image
                  src="/assets/qr.jpeg"
                  alt="GPay QR Code"
                  width={300}
                  height={300}
                  className="rounded-lg"
                  priority
                />
              </div>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Payment Instructions:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Scan the QR code with your GPay app</li>
                    <li>Complete the payment</li>
                    <li>Admin will enroll you after verifying payment</li>
                    <li>You will receive access to the course once enrolled</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Your email: <span className="font-medium text-gray-700">{session?.user?.email}</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Please ensure you use the same email for payment
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const { enrollments, availableCourses, assignments, quizzes, stats, completedLessonIds } = data
  const completedLessonIdsSet = new Set(completedLessonIds)

  // Get courses not enrolled in
  const enrolledCourseIdSet = new Set(enrollments.map((e: any) => e.courseId))
  const unenrolledCourses = availableCourses.filter(
    (course: any) => !enrolledCourseIdSet.has(course.id)
  )

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Header />
      <main className="mx-auto max-w-7xl p-4 sm:p-6 flex-1">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-primary mb-1">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}!
          </p>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-brand-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">My Courses</p>
                <p className="text-2xl font-bold text-brand-primary">{stats.totalEnrollments}</p>
              </div>
              <div className="bg-brand-primary/10 rounded-lg p-3">
                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Assignments</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendingAssignments}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Quizzes</p>
                <p className="text-2xl font-bold text-purple-600">{stats.pendingQuizzes}</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Lessons</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalCompletedLessons}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {stats.overdueAssignments > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-red-800">
                You have {stats.overdueAssignments} overdue assignment{stats.overdueAssignments > 1 ? 's' : ''}. Please submit them soon.
              </p>
            </div>
          </div>
        )}

        {/* My Enrolled Courses - Information Only */}
        {enrollments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-brand-primary">My Enrolled Courses</h2>
              {enrollments.length > 3 && (
                <span className="text-sm text-gray-500">{enrollments.length} courses</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map((en: any) => {
                const totalLessons = en.course.modules.reduce(
                  (acc: number, m: any) => acc + m.lessons.length,
                  0
                )
                const completedCount = en.course.modules.reduce(
                  (acc: number, m: any) =>
                    acc +
                    m.lessons.filter((l: any) => completedLessonIdsSet.has(l.id)).length,
                  0
                )
                return (
                  <div
                    key={en.id}
                    className="bg-white rounded-xl shadow-md p-5 border border-gray-100"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-brand-primary line-clamp-2 flex-1">
                        {en.course.title}
                      </h3>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                          en.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {en.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span>{en.course.modules.length} modules</span>
                        <span>•</span>
                        <span>{totalLessons} lessons</span>
                        <span>•</span>
                        <span className="text-brand-primary font-medium">{completedCount} completed</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-gray-600 font-medium">Enrolled on: </span>
                        <span className="text-gray-700">
                          {new Date(en.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Assignments and Quizzes - Tab Based */}
        <AssignmentsQuizzesTabs assignments={assignments} quizzes={quizzes} />

        {/* Other Available Courses - Show QR Code */}
        {unenrolledCourses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-brand-primary mb-4">Other Available Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unenrolledCourses.map((course: any) => {
                const totalLessons = course.modules.reduce(
                  (acc: number, m: any) => acc + m.lessons.length,
                  0
                )
                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100"
                  >
                    <h3 className="text-lg font-semibold text-brand-primary mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-3">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                      <span>{course.modules.length} modules</span>
                      <span>•</span>
                      <span>{totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xl font-bold text-brand-primary">
                        ₹{(course.price / 100).toLocaleString('en-IN')}
                      </span>
                      <ScrollToTopButton className="rounded-lg px-5 py-2.5 text-base font-medium text-white shadow-md hover:shadow-lg transition-all bg-brand-primary">
                        Pay
                      </ScrollToTopButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </main>
      <footer className="border-t bg-gray-50 mt-auto">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <span>
              © {new Date().getFullYear()} Pratik Kulgod, Bhairavi Music. All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

