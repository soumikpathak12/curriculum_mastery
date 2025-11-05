'use client'

import { useState, useEffect } from 'react'

interface Submission {
  id: string
  status: 'SUBMITTED' | 'REVIEWED' | 'REVISE'
  feedback: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  assignment: {
    id: string
    title: string
    course: {
      title: string
    }
  }
}

interface Assignment {
  id: string
  title: string
  description: string | null
  dueAt: string | null
  createdAt: string
  course: { id: string; title: string }
  submissions: Submission[]
  resources: AssignmentResource[]
}

interface AssignmentResource {
  id: string
  assignmentId: string
  title: string
  type: 'PDF' | 'DOC' | 'DOCX' | 'PPT' | 'PPTX'
  filename: string
  size: number
  createdAt: string
}

// Removed per requirements: per-student assignment tracking

interface CourseMaterial {
  id: string
  title: string
  type: 'PDF' | 'DOC' | 'DOCX' | 'PPT' | 'PPTX'
  filename: string
  size: number
  createdAt: string
  course: {
    id: string
    title: string
  }
}

interface Quiz {
  id: string
  title: string
  description: string | null
  dueAt: string | null
  createdAt: string
  course: { id: string; title: string }
  questions: QuizQuestion[]
  submissions: QuizSubmission[]
}

interface QuizQuestion {
  id: string
  type: 'MCQ' | 'FILL_IN_BLANK'
  question: string
  options: string[]
  correctAnswer: string | null
  order: number
}

// Removed per requirements: per-student quiz assignment

interface QuizSubmission {
  id: string
  userId: string
  answers: any
  score: number | null
  submittedAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface Course { id: string; title: string; slug?: string }

interface Student {
  id: string
  name: string | null
  email: string
}

export default function AdminAssignmentsPage() {
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments' | 'quizzes'>('materials')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [courses, setCourses] = useState<Course[]>([])
// Removed per requirements: per-student assigning
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [feedback, setFeedback] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUBMITTED' | 'REVIEWED' | 'REVISE'>('ALL')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [coursesLoaded, setCoursesLoaded] = useState(false)
  
  // Materials state
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    courseId: '',
    title: '',
    file: null as File | null
  })
  
  // Assignment state
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    courseId: '',
    title: '',
    description: '',
    dueAt: '',
    files: [] as File[]
  })
  
  // Quiz state
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [savingQuiz, setSavingQuiz] = useState(false)
  const [newQuiz, setNewQuiz] = useState({
    courseId: '',
    title: '',
    description: '',
    dueAt: '',
    questions: [] as any[]
  })

  const loadData = async (tab?: 'materials' | 'assignments' | 'quizzes') => {
    try {
      setLoading(true)
      const targetTab = tab || activeTab
      
      // Load courses - only once, needed for all tabs
      if (!coursesLoaded) {
        const coursesResponse = await fetch('/api/admin/course/tree')
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          const apiCourses: Array<{ id: string; title: string; slug?: string }> = coursesData.courses || []

          const knownCourses = [
            { slug: 'igcse-basic', title: 'IGCSE Music Basic' },
            { slug: 'igcse-advanced', title: 'IGCSE Music Advanced' },
            { slug: 'ib-comprehensive', title: 'IB Music Comprehensive' },
            { slug: 'ib-igcse-music-educators-course', title: 'IB & IGCSE Music Educators Course' },
          ]

          const finalCourses = knownCourses.map(k => {
            const match = apiCourses.find(c => (c.slug && c.slug === k.slug) || c.title === k.title)
            return match ? { id: match.id, title: match.title, slug: match.slug || k.slug } : { id: k.slug, title: k.title, slug: k.slug }
          })

          setCourses(finalCourses)
          setCoursesLoaded(true)
        }
      }
      
      // Only load data for the active tab
      if (targetTab === 'materials') {
        const materialsResponse = await fetch('/api/admin/course-materials')
        if (materialsResponse.ok) {
          const materialsData = await materialsResponse.json()
          setMaterials(materialsData.materials || [])
        }
      } else if (targetTab === 'assignments') {
        const assignmentsResponse = await fetch('/api/admin/assignments/enhanced')
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json()
          setAssignments(assignmentsData.assignments || [])
        }
      } else if (targetTab === 'quizzes') {
        const quizzesResponse = await fetch('/api/admin/quizzes')
        if (quizzesResponse.ok) {
          const quizzesData = await quizzesResponse.json()
          setQuizzes(quizzesData.quizzes || [])
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data for the active tab (on mount and when tab changes)
  useEffect(() => {
    loadData(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Helper function to detect file type from extension
  const getFileTypeFromExtension = (filename: string): 'PDF' | 'DOC' | 'DOCX' | 'PPT' | 'PPTX' => {
    const extension = filename.toLowerCase().split('.').pop()
    switch (extension) {
      case 'pdf':
        return 'PDF'
      case 'doc':
        return 'DOC'
      case 'docx':
        return 'DOCX'
      case 'ppt':
        return 'PPT'
      case 'pptx':
        return 'PPTX'
      default:
        return 'PDF' // Default fallback
    }
  }

  // Material functions
  const uploadMaterial = async () => {
    if (!newMaterial.file || !newMaterial.title || !newMaterial.courseId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      // Get signed URL
      const signResponse = await fetch('/api/admin/course-materials/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: newMaterial.file.name })
      })
      
      if (!signResponse.ok) {
        alert('Failed to get upload URL')
        return
      }
      
      const { fileKey } = await signResponse.json()
      
      // Auto-detect file type from extension
      const fileType = getFileTypeFromExtension(newMaterial.file.name)
      
      // Create material record
      const response = await fetch('/api/admin/course-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: newMaterial.courseId,
          title: newMaterial.title,
          type: fileType,
          fileKey,
          filename: newMaterial.file.name,
          size: newMaterial.file.size
        })
      })
      
      if (response.ok) {
        setNewMaterial({ courseId: '', title: '', file: null })
        setShowMaterialForm(false)
        await loadData()
      } else {
        alert('Failed to upload material')
      }
    } catch (error) {
      console.error('Failed to upload material:', error)
      alert('Failed to upload material')
    }
  }

  // Assignment functions
  const createAssignment = async () => {
    if (!newAssignment.title || !newAssignment.courseId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSavingAssignment(true)
      // Convert date-only to full datetime for API (end of day)
      const assignmentData = {
        courseId: newAssignment.courseId,
        title: newAssignment.title,
        description: newAssignment.description,
        dueAt: newAssignment.dueAt ? `${newAssignment.dueAt}T23:59:59` : null
      }
      const response = await fetch('/api/admin/assignments/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      })
      
      if (response.ok) {
        const data = await response.json()
        const assignmentId = data.assignment.id

        // Upload files if any
        if (newAssignment.files.length > 0) {
          for (const file of newAssignment.files) {
            // Get signed URL
            const signResponse = await fetch('/api/admin/assignments/resources/sign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: file.name })
            })
            
            if (signResponse.ok) {
              const { fileKey } = await signResponse.json()
              
              // Auto-detect file type from extension
              const fileType = getFileTypeFromExtension(file.name)
              
              // Create resource record
              await fetch(`/api/admin/assignments/${assignmentId}/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: file.name,
                  type: fileType,
                  fileKey,
                  filename: file.name,
                  size: file.size
                })
              })
            }
          }
        }

        setNewAssignment({ courseId: '', title: '', description: '', dueAt: '', files: [] })
        setShowAssignmentForm(false)
        await loadData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create assignment')
      }
    } catch (error) {
      console.error('Failed to create assignment:', error)
      alert('Failed to create assignment')
    } finally {
      setSavingAssignment(false)
    }
  }

  const assignStudentsToAssignment = async (assignmentId: string, studentIds: string[], dueAt?: string) => {
    try {
      const response = await fetch('/api/admin/assignments/assign-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, studentIds, dueAt })
      })
      
      if (response.ok) {
        await loadData()
      } else {
        alert('Failed to assign students')
      }
    } catch (error) {
      console.error('Failed to assign students:', error)
      alert('Failed to assign students')
    }
  }

  // Quiz functions
  const createQuiz = async () => {
    if (!newQuiz.title || !newQuiz.courseId || newQuiz.questions.length === 0) {
      alert('Please fill in all required fields and add at least one question')
      return
    }

    try {
      setSavingQuiz(true)
      // Convert date-only to full datetime for API (end of day)
      const quizData = {
        ...newQuiz,
        dueAt: newQuiz.dueAt ? `${newQuiz.dueAt}T23:59:59` : null
      }

      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData)
      })
      
      if (response.ok) {
        setNewQuiz({ courseId: '', title: '', description: '', dueAt: '', questions: [] })
        setShowQuizForm(false)
        setEditingQuiz(null)
        await loadData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create quiz')
      }
    } catch (error) {
      console.error('Failed to create quiz:', error)
      alert('Failed to create quiz')
    } finally {
      setSavingQuiz(false)
    }
  }

  const assignStudentsToQuiz = async (quizId: string, studentIds: string[], dueAt?: string) => {
    try {
      const response = await fetch('/api/admin/quizzes/assign-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, studentIds, dueAt })
      })
      
      if (response.ok) {
        await loadData()
      } else {
        alert('Failed to assign students to quiz')
      }
    } catch (error) {
      console.error('Failed to assign students to quiz:', error)
      alert('Failed to assign students to quiz')
    }
  }

  const addQuizQuestion = () => {
    setNewQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, {
        type: 'MCQ',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: ''
      }]
    }))
  }

  const updateQuizQuestion = (index: number, field: string, value: any) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const removeQuizQuestion = (index: number) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const editQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setNewQuiz({
      courseId: quiz.course.id,
      title: quiz.title,
      description: quiz.description || '',
      dueAt: quiz.dueAt ? new Date(quiz.dueAt).toISOString().split('T')[0] : '',
      questions: quiz.questions.map(q => ({
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer || ''
      }))
    })
    setShowQuizForm(true)
  }

  const updateQuiz = async () => {
    if (!editingQuiz || !newQuiz.title || !newQuiz.courseId || newQuiz.questions.length === 0) {
      alert('Please fill in all required fields and add at least one question')
      return
    }

    try {
      setSavingQuiz(true)
      // Convert date-only to full datetime for API (end of day)
      const quizData = {
        ...newQuiz,
        dueAt: newQuiz.dueAt ? `${newQuiz.dueAt}T23:59:59` : null
      }

      const response = await fetch(`/api/admin/quizzes/${editingQuiz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData)
      })
      
      if (response.ok) {
        setNewQuiz({ courseId: '', title: '', description: '', dueAt: '', questions: [] })
        setShowQuizForm(false)
        setEditingQuiz(null)
        await loadData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update quiz')
      }
    } catch (error) {
      console.error('Failed to update quiz:', error)
      alert('Failed to update quiz')
    } finally {
      setSavingQuiz(false)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadData()
      } else {
        alert('Failed to delete quiz')
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error)
      alert('Failed to delete quiz')
    }
  }

  const updateSubmissionStatus = async (submissionId: string, status: 'REVIEWED' | 'REVISE', feedback?: string) => {
    try {
      setSubmittingFeedback(true)
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback })
      })
      
      if (response.ok) {
        await loadData()
        setSelectedSubmission(null)
        setFeedback('')
      } else {
        alert('Failed to update submission')
      }
    } catch (error) {
      console.error('Failed to update submission:', error)
      alert('Failed to update submission')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const downloadSubmission = async (submissionId: string, filename: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to download file')
      }
    } catch (error) {
      console.error('Failed to download file:', error)
      alert('Failed to download file')
    }
  }

  const downloadAssignmentResource = async (resourceId: string, filename: string) => {
    try {
      const response = await fetch(`/api/admin/assignments/resources/${resourceId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to download file')
      }
    } catch (error) {
      console.error('Failed to download file:', error)
      alert('Failed to download file')
    }
  }

  const filteredSubmissions = assignments.flatMap(assignment => 
    assignment.submissions.map(submission => ({
      ...submission,
      assignmentTitle: assignment.title,
      courseTitle: assignment.course.title
    }))
  ).filter(submission => 
    filterStatus === 'ALL' || submission.status === filterStatus
  )

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
        <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
        <p className="mt-2 text-gray-600">Manage course materials, assignments, and quizzes</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('materials')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'materials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Course Materials ({materials.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'quizzes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quizzes ({quizzes.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Course Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter by course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
        {activeTab === 'materials' && (
          <button
            onClick={() => setShowMaterialForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Upload Material
          </button>
        )}
        {activeTab === 'assignments' && (
          <button
            onClick={() => setShowAssignmentForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Assignment
          </button>
        )}
        {activeTab === 'quizzes' && (
          <button
            onClick={() => {
              setEditingQuiz(null)
              setNewQuiz({ courseId: '', title: '', description: '', dueAt: '', questions: [] })
              setShowQuizForm(true)
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Create Quiz
          </button>
        )}
      </div>

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Course Materials</h2>
          </div>
          <div className="divide-y">
            {materials.filter(m => !selectedCourse || m.course.id === selectedCourse).length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No materials found.
              </div>
            ) : (
              materials.filter(m => !selectedCourse || m.course.id === selectedCourse).map((material) => (
                <div key={material.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{material.title}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <p><strong>Course:</strong> {material.course.title}</p>
                        <p><strong>Type:</strong> {material.type}</p>
                        <p><strong>File:</strong> {material.filename}</p>
                        <p><strong>Size:</strong> {(material.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p><strong>Uploaded:</strong> {new Date(material.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {/* Download functionality */}}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Assignment Submissions */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Assignment Submissions</h2>
            </div>
            <div className="divide-y">
              {filteredSubmissions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No submissions found.
                </div>
              ) : (
                filteredSubmissions.map((submission) => (
                  <div key={submission.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-medium text-gray-900">{submission.assignmentTitle}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submission.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
                            submission.status === 'REVIEWED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {submission.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <p><strong>Course:</strong> {submission.courseTitle}</p>
                          <p><strong>Student:</strong> {submission.user.name || submission.user.email}</p>
                          <p><strong>Submitted:</strong> {new Date(submission.createdAt).toLocaleDateString()}</p>
                          {submission.feedback && (
                            <p><strong>Feedback:</strong> {submission.feedback}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadSubmission(submission.id, `${submission.assignmentTitle}_${submission.user.name || submission.user.email}.pdf`)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assignment Management */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Assignment Management</h2>
            </div>
            <div className="divide-y">
              {assignments.filter(a => !selectedCourse || a.course.id === selectedCourse).length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No assignments found.
                </div>
              ) : (
                assignments.filter(a => !selectedCourse || a.course.id === selectedCourse).map((assignment) => (
                  <div key={assignment.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <p><strong>Course:</strong> {assignment.course.title}</p>
                          <p><strong>Description:</strong> {assignment.description || 'No description'}</p>
                          <p><strong>Due Date:</strong> {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'No due date'}</p>
                          {assignment.resources && assignment.resources.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium text-gray-700 mb-1">Resources:</p>
                              <div className="flex flex-wrap gap-2">
                                {assignment.resources.map((resource) => (
                                  <button
                                    key={resource.id}
                                    onClick={() => downloadAssignmentResource(resource.id, resource.filename)}
                                    className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                                  >
                                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-gray-700 hover:text-blue-600">{resource.filename}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Assigned Students removed */}
                          <p className="mt-1"><strong>Submissions:</strong> {assignment.submissions.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2"></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === 'quizzes' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Quizzes</h2>
          </div>
          <div>
            {quizzes.filter(q => !selectedCourse || q.course.id === selectedCourse).length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                No quizzes found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.filter(q => !selectedCourse || q.course.id === selectedCourse).map((quiz) => (
                  <div key={quiz.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">{quiz.title}</h3>
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Course:</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {quiz.course.title}
                            </span>
                          </div>
                          {quiz.description && (
                            <p className="text-gray-600 line-clamp-2">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs">
                                {quiz.dueAt ? new Date(quiz.dueAt).toLocaleDateString() : 'No due date'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs">{quiz.questions.length} questions</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs">{quiz.submissions.length} submissions</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-auto">
                        <button
                          onClick={() => editQuiz(quiz)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteQuiz(quiz.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Material Upload Modal */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Upload Course Material</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <select
                    value={newMaterial.courseId}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter material title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={uploadMaterial}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Upload
                </button>
                <button
                  onClick={() => setShowMaterialForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Creation Modal */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between relative">
              <h3 className="text-lg font-semibold text-gray-900">Create Assignment</h3>
              <button
                onClick={() => {
                  if (savingAssignment) return
                  setShowAssignmentForm(false)
                  setNewAssignment({ courseId: '', title: '', description: '', dueAt: '', files: [] })
                }}
                disabled={savingAssignment}
                className="absolute right-4 top-6 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 hover:bg-gray-100 rounded"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <select
                    value={newAssignment.courseId}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assignment title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assignment description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newAssignment.dueAt}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, dueAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resources (PDF, Word files)</label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setNewAssignment(prev => ({ ...prev, files: [...prev.files, ...files] }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {newAssignment.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {newAssignment.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                          <span className="text-gray-700">{file.name}</span>
                          <button
                            onClick={() => {
                              setNewAssignment(prev => ({
                                ...prev,
                                files: prev.files.filter((_, i) => i !== index)
                              }))
                            }}
                            className="text-red-600 hover:text-red-800"
                            type="button"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={createAssignment}
                  disabled={savingAssignment}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingAssignment && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {savingAssignment ? 'Creating...' : 'Create Assignment'}
                </button>
                <button
                  onClick={() => {
                    if (savingAssignment) return
                    setShowAssignmentForm(false)
                    setNewAssignment({ courseId: '', title: '', description: '', dueAt: '', files: [] })
                  }}
                  disabled={savingAssignment}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Creation/Edit Modal */}
      {showQuizForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between relative">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingQuiz ? 'Edit Quiz' : 'Create Quiz'}
              </h3>
              <button
                onClick={() => {
                  if (savingQuiz) return
                  setShowQuizForm(false)
                  setEditingQuiz(null)
                  setNewQuiz({ courseId: '', title: '', description: '', dueAt: '', questions: [] })
                }}
                disabled={savingQuiz}
                className="absolute right-4 top-6 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 hover:bg-gray-100 rounded"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <select
                    value={newQuiz.courseId}
                    onChange={(e) => setNewQuiz(prev => ({ ...prev, courseId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quiz title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newQuiz.description}
                    onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quiz description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newQuiz.dueAt}
                    onChange={(e) => setNewQuiz(prev => ({ ...prev, dueAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Questions</label>
                    <button
                      onClick={addQuizQuestion}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Add Question
                    </button>
                  </div>
                  <div className="space-y-4">
                    {newQuiz.questions.map((question, index) => (
                      <div key={index} className="border border-gray-300 rounded-md p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <button
                            onClick={() => removeQuizQuestion(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                              value={question.type}
                              onChange={(e) => updateQuizQuestion(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="MCQ">Multiple Choice</option>
                              <option value="FILL_IN_BLANK">Fill in the Blank</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                            <input
                              type="text"
                              value={question.question}
                              onChange={(e) => updateQuizQuestion(index, 'question', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter question"
                            />
                          </div>
                          {question.type === 'MCQ' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                              {question.options.map((option, optIndex) => (
                                <input
                                  key={optIndex}
                                  type="text"
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...question.options]
                                    newOptions[optIndex] = e.target.value
                                    updateQuizQuestion(index, 'options', newOptions)
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                  placeholder={`Option ${optIndex + 1}`}
                                />
                              ))}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                                <select
                                  value={question.correctAnswer || ''}
                                  onChange={(e) => updateQuizQuestion(index, 'correctAnswer', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select correct answer</option>
                                  {question.options.map((option, optIndex) => (
                                    <option key={optIndex} value={option}>{option}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                          {question.type === 'FILL_IN_BLANK' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer(s)</label>
                              <input
                                type="text"
                                value={question.correctAnswer || ''}
                                onChange={(e) => updateQuizQuestion(index, 'correctAnswer', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter correct answer (comma-separated for multiple answers)"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assign to Students removed */}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={editingQuiz ? updateQuiz : createQuiz}
                  disabled={savingQuiz}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingQuiz && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {savingQuiz ? (editingQuiz ? 'Updating...' : 'Creating...') : (editingQuiz ? 'Update Quiz' : 'Create Quiz')}
                </button>
                <button
                  onClick={() => {
                    if (savingQuiz) return
                    setShowQuizForm(false)
                    setEditingQuiz(null)
                    setNewQuiz({ courseId: '', title: '', description: '', dueAt: '', questions: [] })
                  }}
                  disabled={savingQuiz}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Review Submission</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedSubmission.assignmentTitle} - {selectedSubmission.user.name || selectedSubmission.user.email}
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback for the student..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => updateSubmissionStatus(selectedSubmission.id, 'REVIEWED', feedback)}
                  disabled={submittingFeedback}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {submittingFeedback ? 'Updating...' : 'Approve'}
                </button>
                <button
                  onClick={() => updateSubmissionStatus(selectedSubmission.id, 'REVISE', feedback)}
                  disabled={submittingFeedback}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {submittingFeedback ? 'Updating...' : 'Request Revision'}
                </button>
                <button
                  onClick={() => {
                    setSelectedSubmission(null)
                    setFeedback('')
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
