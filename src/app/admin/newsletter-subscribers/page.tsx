'use client'

import { useState, useEffect } from 'react'

interface NewsletterSubscriber {
    id: string
    email: string
    subscribedAt: string
    createdAt: string
}

export default function AdminNewsletterSubscribersPage() {
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const loadSubscribers = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/newsletter-subscribers')

            if (response.ok) {
                const data = await response.json()
                setSubscribers(data.subscribers)
            } else {
                console.error('Failed to load newsletter subscribers')
            }
        } catch (error) {
            console.error('Failed to load newsletter subscribers:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSubscribers()
    }, [])

    // Filter subscribers based on search term
    const filteredSubscribers = subscribers.filter(subscriber =>
        subscriber.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Export to CSV
    const exportToCSV = () => {
        const csvContent = [
            ['Email', 'Subscribed Date'],
            ...filteredSubscribers.map(sub => [
                sub.email,
                new Date(sub.subscribedAt).toLocaleDateString()
            ])
        ].map(row => row.join(',')).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <main className="mx-auto max-w-7xl p-6">
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
        <main className="mx-auto max-w-7xl p-6">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Newsletter Subscribers</h1>
                    <p className="mt-2 text-gray-600">View and export newsletter subscribers from the homepage</p>
                </div>
                {subscribers.length > 0 && (
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Export to CSV
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Subscribers List */}
            <div className="bg-white rounded-lg border shadow-sm">
                {filteredSubscribers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchTerm ? 'No subscribers match your search.' : 'No newsletter subscribers yet.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subscribed Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredSubscribers.map((subscriber) => (
                                    <tr key={subscriber.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <a
                                                href={`mailto:${subscriber.email}`}
                                                className="text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                {subscriber.email}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {new Date(subscriber.subscribedAt).toLocaleDateString('en-US', {
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
                Showing {filteredSubscribers.length} of {subscribers.length} subscribers
            </div>
        </main>
    )
}
