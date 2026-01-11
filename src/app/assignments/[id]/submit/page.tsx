'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'

interface AssignmentResource {
  id: string
  title: string
  filename: string
  type: string
  size: number
}

interface Assignment {
  id: string
  title: string
  description: string | null
  dueAt: string | null
  course: {
    id: string
    title: string
  }
  resources: AssignmentResource[]
  submissions: Array<{
    id: string
    status: string
    createdAt: string
    feedback: string | null
  }>
}

export default function SubmitAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [comment, setComment] = useState('')
  const assignmentId = params?.id as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (status === 'authenticated' && assignmentId) {
      loadAssignment()
    }
  }, [status, assignmentId])

  const loadAssignment = async () => {
    if (!assignmentId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/assignments/${assignmentId}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load assignment')
      }
      const data = await res.json()

      // Check if already submitted
      if (data.assignment.submissions && data.assignment.submissions.length > 0) {
        router.push(`/assignments/${assignmentId}/submission`)
        return
      }

      setAssignment(data.assignment)
    } catch (err) {
      console.error('Failed to load assignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('File size must be less than 500MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleDownloadResource = async (resourceId: string, filename: string) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/resources/${resourceId}/download`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to get download URL')
      }
      const data = await res.json()

      // Create a download link
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // If it's a mock URL, show a message
      if (data.downloadUrl.includes('example-storage.local')) {
        alert('File download functionality will be available once storage is configured.')
      }
    } catch (err) {
      console.error('Failed to download resource:', err)
      alert(err instanceof Error ? err.message : 'Failed to download resource')
    }
  }

  const handleSubmit = async () => {
    if (!assignment) return

    if (!selectedFile && !comment.trim()) {
      alert('Please attach a file or write a comment')
      return
    }

    if (!assignmentId) return

    // Confirm submission
    if (!confirm('Are you sure you want to submit this assignment? You cannot modify it after submission.')) {
      return
    }

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('assignmentId', assignmentId)
      if (selectedFile) {
        formData.append('file', selectedFile)
      }
      if (comment.trim()) {
        formData.append('comment', comment.trim())
      }

      const res = await fetch('/api/assignments/submit', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit assignment')
      }

      // Redirect to submission view page
      router.push(`/assignments/${assignmentId}/submission`)
    } catch (err) {
      console.error('Failed to submit assignment:', err)
      alert(err instanceof Error ? err.message : 'Failed to submit assignment')
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col">
        <Header />
        <main className="mx-auto max-w-4xl w-full p-6 sm:p-8 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assignment...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col">
        <Header />
        <main className="mx-auto max-w-4xl w-full p-6 sm:p-8 flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error || 'Assignment not found'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    )
  }

  const isOverdue = assignment.dueAt && new Date(assignment.dueAt) < new Date()

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Header />
      <main className="mx-auto max-w-4xl w-full p-6 sm:p-8 flex-1">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-brand-primary mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-primary mb-2">
              {assignment.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">{assignment.course.title}</span>
              {assignment.dueAt && (
                <span className={`${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                  Due: {new Date(assignment.dueAt).toLocaleDateString('en-IN', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
              {isOverdue && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Overdue
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {assignment.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
            </div>
          )}

          {/* Assignment Resources */}
          {assignment.resources && assignment.resources.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Assignment Resources</h2>
              <div className="space-y-2">
                {assignment.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{resource.filename}</p>
                        <p className="text-xs text-gray-500">
                          {(resource.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadResource(resource.id, resource.filename)}
                      className="px-3 py-1.5 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium shrink-0 ml-3"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Form */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Assignment</h2>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach File (PDF, DOC, DOCX, PPT, PPTX)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    className="hidden"
                    disabled={submitting}
                  />
                  <div className="flex items-center justify-center px-6 py-10 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-primary hover:bg-gray-50 transition-colors">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-brand-primary">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">File should be less than 500MB</p>
                    </div>
                  </div>
                </label>
              </div>
              {selectedFile && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-800 flex-1">{selectedFile.name}</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-green-600 hover:text-green-800"
                    disabled={submitting}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comment (Optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                placeholder="Add any comments or notes about your submission..."
                disabled={submitting}
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || (!selectedFile && !comment.trim())}
                className="px-6 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
