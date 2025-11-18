'use client'

import { useState, useEffect } from 'react'

interface Enrollment {
  id: string
  status: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  course: {
    id?: string
    title: string
    price?: number | null
  }
  payment: {
    id: string
    orderId: string
    amount: number
    provider: string
  } | null
}

interface Course {
  id: string
  title: string
  slug: string
  price?: number
}

export default function AdminPaymentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'enrollments' | 'manual-enroll'>('enrollments')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15
  
  // Manual enrollment form state
  const [enrollEmail, setEnrollEmail] = useState('')
  const [enrollCourseId, setEnrollCourseId] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState('')
  const [enrollSuccess, setEnrollSuccess] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const [enrollmentsRes, coursesRes] = await Promise.all([
        fetch('/api/admin/enrollments'),
        fetch('/api/admin/courses')
      ])
      
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json()
        setEnrollments(enrollmentsData.enrollments || [])
      }
      
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData.courses || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnrollError('')
    setEnrollSuccess('')
    
    if (!enrollEmail || !enrollCourseId) {
      setEnrollError('Please fill in all fields')
      return
    }
    
    setEnrolling(true)
    try {
      const res = await fetch('/api/admin/enrollments/manual-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: enrollEmail.trim().toLowerCase(),
          courseId: enrollCourseId
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setEnrollError(data.error || 'Failed to enroll student')
        return
      }
      
      setEnrollSuccess(`Successfully enrolled ${data.enrollment.user.email} in ${data.enrollment.course.title}`)
      setEnrollEmail('')
      setEnrollCourseId('')
      // Reload enrollments to show the new one
      loadData()
    } catch (error) {
      console.error('Enrollment error:', error)
      setEnrollError('An error occurred. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (!selectedCourseId) return true
    return enrollment.course.id === selectedCourseId || enrollment.course.title === selectedCourseId
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedEnrollments = filteredEnrollments.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCourseId])

  const formatAmount = (amount: number | null | undefined, currency: string) => {
    if (amount == null || amount === undefined) {
      return 'N/A'
    }
    const numAmount = typeof amount === 'number' ? amount : Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'N/A'
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numAmount / 100) // Convert from paise to rupees
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="mt-2 text-gray-600">View student enrollments and payment history</p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M7 21h10" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatAmount(
                  enrollments.reduce((sum, e) => {
                    if (e.payment && e.payment.amount) {
                      return sum + e.payment.amount
                    }
                    return sum
                  }, 0),
                  'INR'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Enrollments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {enrollments.filter(e => e.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {enrollments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'enrollments'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
              }`}
            >
              Student Enrollments ({enrollments.length})
            </button>
            <button
              onClick={() => setActiveTab('manual-enroll')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'manual-enroll'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
              }`}
            >
              Manual Enrollment
            </button>
          </nav>
        </div>
      </div>

      {/* Filters for enrollments */}
      {activeTab === 'enrollments' && (
        <div className="mb-6 flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by course:</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Enrollments Tab */}
      {activeTab === 'enrollments' && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Student Enrollments & Payment History</h2>
          </div>
          <div className="divide-y">
            {filteredEnrollments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {selectedCourseId ? 'No enrollments found for the selected course.' : 'No enrollments found.'}
              </div>
            ) : (
              paginatedEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-medium text-gray-900">{enrollment.course.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                          {enrollment.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <p><strong>Student:</strong> {enrollment.user.name || enrollment.user.email}</p>
                        <p><strong>Enrolled:</strong> {new Date(enrollment.createdAt).toLocaleDateString()}</p>
                        {enrollment.payment && (
                          <p><strong>Payment:</strong> {formatAmount(enrollment.payment.amount, 'INR')}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {enrollment.payment ? (
                        <div className="text-lg font-semibold text-green-600">
                          {formatAmount(enrollment.payment.amount, 'INR')}
                        </div>
                      ) : (
                        <div className="text-lg font-semibold text-green-600">
                          {(() => {
                            // Try to get price from enrollment.course first
                            let coursePrice = enrollment.course?.price
                            
                            // If not found, look it up from the courses list we already loaded
                            if (!coursePrice && courses.length > 0) {
                              const foundCourse = courses.find(c => 
                                c.id === enrollment.course?.id || 
                                c.title === enrollment.course?.title
                              )
                              coursePrice = foundCourse?.price
                            }
                            
                            return formatAmount(coursePrice, 'INR')
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {filteredEnrollments.length > 0 && (
            <div className="p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredEnrollments.length)} of {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? 's' : ''}
                {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages: (number | string)[] = []
                      
                      if (totalPages <= 7) {
                        // Show all pages if 7 or fewer
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i)
                        }
                      } else {
                        // Always show first page
                        pages.push(1)
                        
                        if (currentPage <= 4) {
                          // Show first 5 pages, then ellipsis, then last
                          for (let i = 2; i <= 5; i++) {
                            pages.push(i)
                          }
                          pages.push('...')
                          pages.push(totalPages)
                        } else if (currentPage >= totalPages - 3) {
                          // Show first, ellipsis, then last 5 pages
                          pages.push('...')
                          for (let i = totalPages - 4; i <= totalPages; i++) {
                            pages.push(i)
                          }
                        } else {
                          // Show first, ellipsis, current-1, current, current+1, ellipsis, last
                          pages.push('...')
                          pages.push(currentPage - 1)
                          pages.push(currentPage)
                          pages.push(currentPage + 1)
                          pages.push('...')
                          pages.push(totalPages)
                        }
                      }
                      
                      return pages.map((page, index) => {
                        if (page === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                              ...
                            </span>
                          )
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-brand-primary text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })
                    })()}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Enrollment Tab */}
      {activeTab === 'manual-enroll' && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enroll Student Manually</h2>
          <p className="text-sm text-gray-600 mb-6">
            After receiving payment via GPay, enroll students by entering their email and selecting the course.
          </p>
          
          <form onSubmit={handleManualEnroll} className="space-y-4">
            <div>
              <label htmlFor="enroll-email" className="block text-sm font-medium text-gray-700 mb-2">
                Student Email *
              </label>
              <input
                type="email"
                id="enroll-email"
                value={enrollEmail}
                onChange={(e) => setEnrollEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="enroll-course" className="block text-sm font-medium text-gray-700 mb-2">
                Course *
              </label>
              <select
                id="enroll-course"
                value={enrollCourseId}
                onChange={(e) => setEnrollCourseId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            
            {enrollError && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded p-3">
                <p className="text-sm text-red-800">{enrollError}</p>
              </div>
            )}
            
            {enrollSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded p-3">
                <p className="text-sm text-green-800">{enrollSuccess}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={enrolling}
              className="w-auto mx-auto block rounded-lg bg-brand-primary px-6 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {enrolling ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </form>
        </div>
      )}
    </main>
  )
}
