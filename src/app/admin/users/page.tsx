"use client"

import { useState, useEffect, useRef } from 'react'

type User = {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'STUDENT'
  blocked: boolean
  createdAt: string
  enrollments: number
  payments: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const closeModal = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setSelectedUser(null)
    setLoadingDetails(false)
  }

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/users?page=${page}&limit=10&search=${debouncedSearch}`)
      if (!response.ok) {
        throw new Error('Failed to load users')
      }
      const data = await response.json()
      setUsers(data.users || [])
      setTotalPages(data.pagination.pages)
      setTotalUsers(data.pagination.total)
      setCurrentPage(data.pagination.currentPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const loadUserDetails = async (userId: string) => {
    // Explanation: the userId like 'cmi5o...' is a CUID (Collision-resistant Unique Identifier)
    // used as a secure, more URL-friendly and horizontally scalable alternative to simple IDs or UUIDs.
    try {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      abortControllerRef.current = new AbortController()

      setLoadingDetails(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        signal: abortControllerRef.current.signal
      })
      if (!response.ok) throw new Error('Failed to load user details')
      const data = await response.json()
      setSelectedUser(data.user)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      alert(err instanceof Error ? err.message : 'Failed to load user details')
    } finally {
      setLoadingDetails(false)
      abortControllerRef.current = null
    }
  }

  useEffect(() => {
    loadUsers(1)
  }, [debouncedSearch])

  const handleBlock = async (userId: string, currentBlocked: boolean) => {
    if (!confirm(`Are you sure you want to ${currentBlocked ? 'unblock' : 'block'} this user?`)) {
      return
    }

    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !currentBlocked }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      await loadUsers(currentPage)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone and will delete all associated data.`)) {
      return
    }

    setActionLoading(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      await loadUsers(currentPage)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setActionLoading(null)
    }
  }



  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">Block or delete users from the database</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="text-sm text-gray-500">
          Showing {users.length} of {totalUsers} users
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 cursor-pointer group"
                      onClick={() => loadUserDetails(user.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.enrollments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.payments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.blocked ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBlock(user.id, user.blocked)
                            }}
                            disabled={actionLoading === user.id}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${user.blocked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50'
                              }`}
                          >
                            {actionLoading === user.id
                              ? '...'
                              : user.blocked
                                ? 'Unblock'
                                : 'Block'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(user.id, user.email)
                            }}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === user.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => loadUsers(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadUsers(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(currentPage * 10, totalUsers)}</span> of <span className="font-medium">{totalUsers}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => loadUsers(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => loadUsers(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                          ? 'z-10 bg-brand-primary border-brand-primary text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => loadUsers(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* User Details Modal */}
      {(selectedUser || loadingDetails) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {loadingDetails ? 'Loading User...' : (selectedUser?.name || 'User Details')}
                </h3>
                {!loadingDetails && <p className="text-sm text-gray-500">{selectedUser?.email}</p>}
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary mb-4"></div>
                  <p className="text-gray-500">Fetching detailed records...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Account Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${selectedUser?.blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {selectedUser?.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Joined</p>
                      <p className="text-sm font-medium text-gray-900">{new Date(selectedUser?.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Enrollments */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-900 border-l-4 border-brand-primary pl-3 mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Course Enrollments ({selectedUser?.enrollments?.length || 0})
                    </h4>
                    {selectedUser?.enrollments?.length > 0 ? (
                      <div className="space-y-3">
                        {selectedUser.enrollments.map((en: any) => (
                          <div key={en.id} className="flex justify-between items-center p-3 bg-white border rounded-lg hover:border-brand-primary transition-colors group">
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-brand-primary transition-colors">{en.course.title}</p>
                              <p className="text-xs text-gray-500">Enrolled on {new Date(en.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${en.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                              {en.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">No active enrollments</p>
                    )}
                  </section>

                  {/* Payments */}
                  <section>
                    <h4 className="text-sm font-bold text-gray-900 border-l-4 border-brand-primary pl-3 mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Payment History ({selectedUser?.payments?.length || 0})
                    </h4>
                    {selectedUser?.payments?.length > 0 ? (
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-xs font-bold text-gray-600 uppercase">
                            <tr>
                              <th className="px-4 py-3 text-left">Date</th>
                              <th className="px-4 py-3 text-left">Order ID</th>
                              <th className="px-4 py-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedUser.payments.map((p: any) => (
                              <tr key={p.id}>
                                <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 font-mono text-xs text-brand-primary">{p.orderId}</td>
                                <td className="px-4 py-3 text-right font-bold text-gray-900">₹{(p.amount / 100).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">No payment records found</p>
                    )}
                  </section>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-normal hover:bg-black transition-colors shadow-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

