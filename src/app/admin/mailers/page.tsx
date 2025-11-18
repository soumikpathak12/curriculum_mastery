'use client'

import { useState, useEffect } from 'react'

interface StudentGroup {
  id: string
  name: string
  count: number
}

interface ContactSubmission {
  id: string
  name: string
  email: string
  message: string
  createdAt: string
}

interface NewsletterSubscriber {
  id: string
  email: string
  subscribedAt: string
  createdAt: string
}

export default function AdminMailersPage() {
  const [activeTab, setActiveTab] = useState<'mailers' | 'contact' | 'newsletter'>('mailers')
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([])
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([])
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  
  // Compose form state
  const [composeForm, setComposeForm] = useState({
    title: '',
    content: '',
    recipientType: 'all' as 'all' | 'students' | 'custom',
    customEmails: ''
  })
  const [sending, setSending] = useState(false)
  
  // Contact submissions search
  const [contactSearchTerm, setContactSearchTerm] = useState('')
  
  // Newsletter subscribers search
  const [newsletterSearchTerm, setNewsletterSearchTerm] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const [groupsRes, contactRes, newsletterRes] = await Promise.all([
        fetch('/api/admin/student-groups'),
        fetch('/api/admin/contact-submissions'),
        fetch('/api/admin/newsletter-subscribers')
      ])
      
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setStudentGroups(groupsData.groups)
      }
      
      if (contactRes.ok) {
        const contactData = await contactRes.json()
        setContactSubmissions(contactData.submissions || [])
      }
      
      if (newsletterRes.ok) {
        const newsletterData = await newsletterRes.json()
        setNewsletterSubscribers(newsletterData.subscribers || [])
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
  
  // Filter contact submissions
  const filteredContactSubmissions = contactSubmissions.filter(submission =>
    submission.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    submission.email.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    submission.message.toLowerCase().includes(contactSearchTerm.toLowerCase())
  )
  
  // Filter newsletter subscribers
  const filteredNewsletterSubscribers = newsletterSubscribers.filter(subscriber =>
    subscriber.email.toLowerCase().includes(newsletterSearchTerm.toLowerCase())
  )
  
  // Export newsletter to CSV
  const exportNewsletterToCSV = () => {
    const csvContent = [
      ['Email', 'Subscribed Date'],
      ...filteredNewsletterSubscribers.map(sub => [
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

  const sendMailer = async () => {
    if (!composeForm.title.trim() || !composeForm.content.trim()) {
      alert('Please fill in title and content')
      return
    }

    try {
      setSending(true)
      const response = await fetch('/api/admin/mailers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeForm)
      })
      
      if (response.ok) {
        const data = await response.json()
        const message = data.failed > 0
          ? `Mailer sent to ${data.successful} recipients (${data.failed} failed)`
          : `Mailer sent successfully to ${data.successful} recipients!`
        alert(message)
        setComposeForm({
          title: '',
          content: '',
          recipientType: 'all',
          customEmails: ''
        })
      } else {
        const error = await response.json()
        alert(`Failed to send mailer: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to send mailer:', error)
      alert('Failed to send mailer')
    } finally {
      setSending(false)
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
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Send Mailers</h1>
        <p className="mt-2 text-gray-600">Send emails, view contact submissions, and manage newsletter subscribers</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('mailers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'mailers'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
            }`}
          >
            Send Mailers
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'contact'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
            }`}
          >
            Contact Submissions ({contactSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'newsletter'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
            }`}
          >
            Newsletter ({newsletterSubscribers.length})
          </button>
        </nav>
      </div>

      {/* Send Mailers Tab */}
      {activeTab === 'mailers' && (
        <>
      {/* Compose Form */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Compose Email</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Title
            </label>
            <input
              type="text"
              value={composeForm.title}
              onChange={(e) => setComposeForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter email title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients
            </label>
            <select
              value={composeForm.recipientType}
              onChange={(e) => setComposeForm(prev => ({ ...prev, recipientType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Students</option>
              <option value="custom">Custom Email List</option>
            </select>
          </div>

          {composeForm.recipientType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Email Addresses
              </label>
              <textarea
                value={composeForm.customEmails}
                onChange={(e) => setComposeForm(prev => ({ ...prev, customEmails: e.target.value }))}
                placeholder="Enter email addresses separated by commas..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Content
            </label>
            <textarea
              value={composeForm.content}
              onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your email content here..."
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={sendMailer}
              disabled={sending}
              className="px-6 py-2 bg-brand-primary text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>

        </>
      )}

      {/* Contact Submissions Tab */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div>
            <input
              type="text"
              placeholder="Search by name, email, or message..."
              value={contactSearchTerm}
              onChange={(e) => setContactSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Submissions List */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {filteredContactSubmissions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {contactSearchTerm ? 'No submissions match your search.' : 'No contact submissions yet.'}
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
                    {filteredContactSubmissions.map((submission) => (
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
          <div className="text-sm text-gray-600">
            Showing {filteredContactSubmissions.length} of {contactSubmissions.length} submissions
          </div>
        </div>
      )}

      {/* Newsletter Subscribers Tab */}
      {activeTab === 'newsletter' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by email..."
                value={newsletterSearchTerm}
                onChange={(e) => setNewsletterSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            {newsletterSubscribers.length > 0 && (
              <button
                onClick={exportNewsletterToCSV}
                className="ml-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:shadow-md transition-all hover:scale-105"
              >
                Export to CSV
              </button>
            )}
          </div>

          {/* Subscribers List */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {filteredNewsletterSubscribers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {newsletterSearchTerm ? 'No subscribers match your search.' : 'No newsletter subscribers yet.'}
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
                    {filteredNewsletterSubscribers.map((subscriber) => (
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
          <div className="text-sm text-gray-600">
            Showing {filteredNewsletterSubscribers.length} of {newsletterSubscribers.length} subscribers
          </div>
        </div>
      )}
    </main>
  )
}
