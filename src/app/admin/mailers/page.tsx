'use client'

import { useState, useEffect } from 'react'

interface StudentGroup {
  id: string
  name: string
  count: number
}

export default function AdminMailersPage() {
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([])
  const [loading, setLoading] = useState(true)
  
  // Compose form state
  const [composeForm, setComposeForm] = useState({
    title: '',
    content: '',
    recipientType: 'all' as 'all' | 'students' | 'custom',
    customEmails: ''
  })
  const [sending, setSending] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const groupsRes = await fetch('/api/admin/student-groups')
      
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setStudentGroups(groupsData.groups)
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
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Send Mailers</h1>
        <p className="mt-2 text-gray-600">Send emails and announcements to students</p>
      </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients
            </label>
            <select
              value={composeForm.recipientType}
              onChange={(e) => setComposeForm(prev => ({ ...prev, recipientType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Students</option>
              <option value="students">Students Only</option>
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
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>

      {/* Student Groups Info */}
      {studentGroups.length > 0 && (
        <div className="mt-8 bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Available Student Groups</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentGroups.map((group) => (
                <div key={group.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-600">{group.count} students</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
