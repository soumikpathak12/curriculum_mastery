'use client'

import { useState, useEffect } from 'react'

interface Payment {
  id: string
  orderId: string
  amount: number
  currency: string
  status: string
  provider: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  enrollment: Array<{
    id: string
    status: string
    course: {
      title: string
    }
  }>
}

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
    title: string
  }
  payment: {
    id: string
    orderId: string
    amount: number
    status: string
    provider: string
  } | null
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'payments' | 'enrollments'>('payments')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'CANCELLED'>('ALL')

  const loadData = async () => {
    try {
      setLoading(true)
      const [paymentsRes, enrollmentsRes] = await Promise.all([
        fetch('/api/admin/payments'),
        fetch('/api/admin/enrollments')
      ])
      
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        setPayments(paymentsData.payments)
      }
      
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json()
        setEnrollments(enrollmentsData.enrollments)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredEnrollments = enrollments.filter(enrollment => 
    filterStatus === 'ALL' || enrollment.status === filterStatus
  )

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount / 100) // Convert from paise to rupees
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
        <p className="mt-2 text-gray-600">View enrollments and payment history</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment History ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enrollments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Student Enrollments ({enrollments.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Filters for enrollments */}
      {activeTab === 'enrollments' && (
        <div className="mb-6 flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm"
            >
              <option value="ALL">All Enrollments</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredEnrollments.length} enrollment{filteredEnrollments.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
          </div>
          <div className="divide-y">
            {payments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No payments found.
              </div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-medium text-gray-900">Order #{payment.orderId}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                        <span className="text-sm text-gray-500">{payment.provider}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <p><strong>Student:</strong> {payment.user.name || payment.user.email}</p>
                        <p><strong>Amount:</strong> {formatAmount(payment.amount, payment.currency)}</p>
                        <p><strong>Date:</strong> {new Date(payment.createdAt).toLocaleDateString()}</p>
                        {payment.enrollment.length > 0 && (
                          <p><strong>Course:</strong> {payment.enrollment[0].course.title}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatAmount(payment.amount, payment.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Enrollments Tab */}
      {activeTab === 'enrollments' && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Student Enrollments</h2>
          </div>
          <div className="divide-y">
            {filteredEnrollments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No enrollments found for the selected filter.
              </div>
            ) : (
              filteredEnrollments.map((enrollment) => (
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
                          <>
                            <p><strong>Payment:</strong> {formatAmount(enrollment.payment.amount, 'INR')}</p>
                            <p><strong>Payment Status:</strong> {enrollment.payment.status}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {enrollment.payment ? (
                        <div className="text-lg font-semibold text-green-600">
                          {formatAmount(enrollment.payment.amount, 'INR')}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No payment</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatAmount(
                  payments.reduce((sum, p) => sum + (p.status.toLowerCase() === 'success' ? p.amount : 0), 0),
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {payments.filter(p => p.status.toLowerCase() === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
