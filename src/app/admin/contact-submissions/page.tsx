'use client'

import { useState, useEffect } from 'react'

interface ContactSubmission {
    id: string
    name: string
    email: string
    message: string
    createdAt: string
}

export default function AdminContactSubmissionsPage() {
    const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const loadSubmissions = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/contact-submissions')

            if (response.ok) {
                const data = await response.json()
                setSubmissions(data.submissions)
            } else {
                console.error('Failed to load contact submissions')
            }
        } catch (error) {
            console.error('Failed to load contact submissions:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSubmissions()
    }, [])

    // Filter submissions based on search term
    const filteredSubmissions = submissions.filter(submission =>
        submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.message.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <main className="mx-auto max-w-7xl p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="mx-auto max-w-7xl p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Contact Submissions</h1>
                <p className="mt-2 text-gray-600">View and manage contact form submissions from the homepage</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by name, email, or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Submissions List */}
            <div className="bg-white rounded-lg border shadow-sm">
                {filteredSubmissions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchTerm ? 'No submissions match your search.' : 'No contact submissions yet.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Message
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredSubmissions.map((submission) => (
                                    <tr key={submission.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{submission.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <a
                                                href={`mailto:${submission.email}`}
                                                className="text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                {submission.email}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-md">
                                                {submission.message}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {new Date(submission.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="mt-4 text-sm text-gray-600">
                Showing {filteredSubmissions.length} of {submissions.length} submissions
            </div>
        </main>
    )
}
