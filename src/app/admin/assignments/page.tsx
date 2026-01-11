'use client'

import { useState, useEffect, useRef } from 'react'

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
  type: 'PDF' | 'DOC' | 'DOCX' | 'PPT' | 'PPTX' | 'IMAGE'
  filename: string
  size: number
  createdAt: string
}

// Removed per requirements: per-student assignment tracking

interface CourseMaterial {
  id: string
  title: string
  files: CourseMaterialFile[]
  createdAt: string
  course: {
    id: string
    title: string
  }
}

interface CourseMaterialFile {
  id: string
  materialId: string
  type: 'PDF' | 'DOC' | 'DOCX' | 'PPT' | 'PPTX' | 'IMAGE'
  filename: string
  size: number
  createdAt: string
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
  const [assignmentsSubTab, setAssignmentsSubTab] = useState<'submissions' | 'management'>('management')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const isInitialMount = useRef(true)
  // Removed per requirements: per-student assigning
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [feedback, setFeedback] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUBMITTED' | 'REVIEWED' | 'REVISE'>('ALL')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [coursesLoaded, setCoursesLoaded] = useState(false)

  // Student assignment state
  const [students, setStudents] = useState<Student[]>([])
  const [assigningStudents, setAssigningStudents] = useState<{ type: 'assignment' | 'quiz' | 'material' | null, id: string | null }>({ type: null, id: null })
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [assignmentDueDate, setAssignmentDueDate] = useState('')
  const [studentSearchQuery, setStudentSearchQuery] = useState('')

  // Materials state
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null)
  const [newMaterial, setNewMaterial] = useState({
    courseId: '',
    title: '',
    files: [null] as (File | null)[]
  })
  const [savingMaterial, setSavingMaterial] = useState(false)

  // Assignment state
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [existingResources, setExistingResources] = useState<AssignmentResource[]>([])
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null)
  const [newAssignment, setNewAssignment] = useState({
    courseId: '',
    title: '',
    description: '',
    dueAt: '',
    files: [null] as (File | null)[]
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

  const loadData = async () => {
    console.log('DEBUG: loadData starting...')
    try {
      setLoading(true)

      // Load courses - only once, needed for all tabs (using lightweight endpoint)
      if (!coursesLoaded) {
        const coursesResponse = await fetch('/api/admin/courses')
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

      // Load all data in parallel to show counts immediately
      const [materialsResponse, assignmentsResponse, quizzesResponse, enrollmentsResponse] = await Promise.all([
        fetch('/api/admin/course-materials'),
        fetch('/api/admin/assignments/enhanced'),
        fetch('/api/admin/quizzes'),
        fetch('/api/admin/enrollments')
      ])

      // Load students from enrollments
      if (enrollmentsResponse.ok) {
        const enrollmentsData = await enrollmentsResponse.json()
        const uniqueStudents = new Map<string, Student>()
        enrollmentsData.enrollments?.forEach((enrollment: any) => {
          if (enrollment.user && !uniqueStudents.has(enrollment.user.id)) {
            uniqueStudents.set(enrollment.user.id, {
              id: enrollment.user.id,
              name: enrollment.user.name,
              email: enrollment.user.email
            })
          }
        })
        setStudents(Array.from(uniqueStudents.values()))
      }

      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json()
        setMaterials(materialsData.materials || [])
      }

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData.assignments || [])
      }

      if (quizzesResponse.ok) {
        const quizzesData = await quizzesResponse.json()
        setQuizzes(quizzesData.quizzes || [])
      }
    } catch (error) {
      console.error('DEBUG: loadData failed:', error)
    } finally {
      console.log('DEBUG: loadData finished')
      setLoading(false)
    }
  }

  // Load all data on mount (to show counts immediately)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helper function to detect file type from extension
  const getFileTypeFromExtension = (filename: string): 'PDF' | 'DOC' | 'DOCX' | 'PPT' | 'PPTX' | 'IMAGE' => {
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
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'svg':
        return 'IMAGE'
      default:
        return 'PDF' // Default fallback
    }
  }

  // Material functions
  const openMaterialModal = () => {
    setEditingMaterial(null)
    setNewMaterial({ courseId: selectedCourse || '', title: '', files: [null] })
    setShowMaterialForm(true)
  }

  const editMaterial = (material: CourseMaterial) => {
    setEditingMaterial(material)
    setNewMaterial({
      courseId: material.course.id,
      title: material.title,
      files: [null]
    })
    setShowMaterialForm(true)
  }

  const deleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this course material? This action cannot be undone and the file will be permanently deleted.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/course-materials/${materialId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete material')
      }
    } catch (error) {
      console.error('Failed to delete material:', error)
      alert('Failed to delete material')
    }
  }

  const uploadMaterial = async () => {
    if (!newMaterial.title || !newMaterial.courseId) {
      alert('Please fill in all required fields')
      return
    }

    // For editing, files are optional
    if (!editingMaterial && newMaterial.files.filter(Boolean).length === 0) {
      alert('Please select at least one file')
      return
    }

    setSavingMaterial(true)
    try {
      if (editingMaterial) {
        // Update existing material
        const formData = new FormData()
        formData.append('title', newMaterial.title)
        formData.append('courseId', newMaterial.courseId)
        if (newMaterial.files.length > 0) {
          newMaterial.files.forEach(file => {
            if (file) {
              formData.append('file', file)
            }
          })
        }

        const response = await fetch(`/api/admin/course-materials/${editingMaterial.id}`, {
          method: 'PUT',
          body: formData
        })

        if (response.ok) {
          setNewMaterial({ courseId: '', title: '', files: [null] })
          setEditingMaterial(null)
          setShowMaterialForm(false)
          await loadData()
        } else {
          const data = await response.json()
          alert(data.error || 'Failed to update material')
        }
      } else {
        // Create new material
        if (newMaterial.files.filter(Boolean).length === 0) {
          alert('Please select at least one file')
          setSavingMaterial(false)
          return
        }

        const formData = new FormData()
        formData.append('title', newMaterial.title)
        formData.append('courseId', newMaterial.courseId)

        newMaterial.files.forEach(file => {
          if (file) {
            formData.append('file', file)
          }
        })

        const response = await fetch(`/api/admin/course-materials`, {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          setNewMaterial({ courseId: '', title: '', files: [null] })
          setShowMaterialForm(false)
          await loadData()
        } else {
          const data = await response.json()
          alert(data.error || 'Failed to upload material')
        }
      }
    } catch (error) {
      console.error('Failed to upload material:', error)
      alert('Failed to upload material')
    } finally {
      setSavingMaterial(false)
    }
  }

  // Assignment functions
  const editAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setExistingResources(assignment.resources || [])
    setNewAssignment({
      courseId: assignment.course.id,
      title: assignment.title,
      description: assignment.description || '',
      dueAt: assignment.dueAt ? new Date(assignment.dueAt).toISOString().split('T')[0] : '',
      files: []
    })
    setShowAssignmentForm(true)
  }

  const deleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingResourceId(resourceId)
      const response = await fetch(`/api/admin/assignments/resources/${resourceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from existing resources (no need to reload entire page)
        setExistingResources(prev => prev.filter(r => r.id !== resourceId))
        // Also update the assignment in the assignments list if it's loaded
        setAssignments(prev => prev.map(assignment => {
          if (assignment.id === editingAssignment?.id) {
            return {
              ...assignment,
              resources: assignment.resources?.filter(r => r.id !== resourceId) || []
            }
          }
          return assignment
        }))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete resource')
      }
    } catch (error) {
      console.error('Failed to delete resource:', error)
      alert('Failed to delete resource')
    } finally {
      setDeletingResourceId(null)
    }
  }

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete assignment')
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      alert('Failed to delete assignment')
    }
  }

  const createAssignment = async () => {
    if (!newAssignment.title || !newAssignment.courseId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSavingAssignment(true)

      const filesToUpload = newAssignment.files.filter((f): f is File => f !== null)
      const totalFilesCount = (editingAssignment ? existingResources.length : 0) + filesToUpload.length

      if (totalFilesCount > 5) {
        alert('You can only have up to 5 attachments in total')
        setSavingAssignment(false)
        return
      }

      // Convert date-only to full datetime for API (end of day)
      const assignmentData = {
        courseId: newAssignment.courseId,
        title: newAssignment.title,
        description: newAssignment.description,
        dueAt: newAssignment.dueAt ? `${newAssignment.dueAt}T23:59:59` : null
      }

      let response
      if (editingAssignment) {
        // Update existing assignment
        response = await fetch(`/api/admin/assignments/${editingAssignment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignmentData)
        })
      } else {
        // Create new assignment
        response = await fetch('/api/admin/assignments/enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignmentData)
        })
      }

      if (response.ok) {
        const data = await response.json()
        const assignmentId = editingAssignment ? editingAssignment.id : data.assignment.id

        // Upload files if any (only for new assignments or when editing)
        const filesToUpload = newAssignment.files.filter((f): f is File => f !== null)
        if (filesToUpload.length > 0) {
          for (const file of filesToUpload) {
            // Upload file directly to API route (works with Netlify serverless)
            const formData = new FormData()
            formData.append('file', file)
            formData.append('title', file.name)

            const uploadResponse = await fetch(`/api/admin/assignments/${assignmentId}/resources`, {
              method: 'POST',
              body: formData
            })

            if (!uploadResponse.ok) {
              const error = await uploadResponse.json()
              alert(`Failed to upload ${file.name}: ${error.error || 'Unknown error'}`)
            }
          }
        }

        setNewAssignment({ courseId: '', title: '', description: '', dueAt: '', files: [null] })
        setEditingAssignment(null)
        setShowAssignmentForm(false)
        await loadData()
      } else {
        const data = await response.json()
        alert(data.error || `Failed to ${editingAssignment ? 'update' : 'create'} assignment`)
      }
    } catch (error) {
      console.error(`Failed to ${editingAssignment ? 'update' : 'create'} assignment:`, error)
      alert(`Failed to ${editingAssignment ? 'update' : 'create'} assignment`)
    } finally {
      setSavingAssignment(false)
    }
  }

  const openAssignStudentsModal = (type: 'assignment' | 'quiz' | 'material', id: string) => {
    setAssigningStudents({ type, id })
    setSelectedStudentIds([])
    setAssignmentDueDate('')
  }

  const closeAssignStudentsModal = () => {
    setAssigningStudents({ type: null, id: null })
    setSelectedStudentIds([])
    setAssignmentDueDate('')
    setStudentSearchQuery('')
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
        closeAssignStudentsModal()
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
        closeAssignStudentsModal()
      } else {
        alert('Failed to assign students to quiz')
      }
    } catch (error) {
      console.error('Failed to assign students to quiz:', error)
      alert('Failed to assign students to quiz')
    }
  }

  const assignStudentsToMaterial = async (materialId: string, studentIds: string[]) => {
    try {
      const response = await fetch('/api/admin/course-materials/assign-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, studentIds })
      })

      if (response.ok) {
        await loadData()
        closeAssignStudentsModal()
      } else {
        alert('Failed to assign students to material')
      }
    } catch (error) {
      console.error('Failed to assign students to material:', error)
      alert('Failed to assign students to material')
    }
  }

  const handleAssignStudents = () => {
    if (!assigningStudents.id || selectedStudentIds.length === 0) {
      alert('Please select at least one student')
      return
    }

    if (assigningStudents.type === 'assignment') {
      assignStudentsToAssignment(assigningStudents.id, selectedStudentIds, assignmentDueDate || undefined)
    } else if (assigningStudents.type === 'quiz') {
      assignStudentsToQuiz(assigningStudents.id, selectedStudentIds, assignmentDueDate || undefined)
    } else if (assigningStudents.type === 'material') {
      assignStudentsToMaterial(assigningStudents.id, selectedStudentIds)
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
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'materials'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
                }`}
            >
              Course Materials ({materials.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'assignments'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
                }`}
            >
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'quizzes'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
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
            className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            Upload Material
          </button>
        )}
        {activeTab === 'assignments' && assignmentsSubTab === 'management' && (
          <button
            onClick={() => {
              setNewAssignment({ courseId: '', title: '', description: '', dueAt: '', files: [] })
              setEditingAssignment(null)
              setShowAssignmentForm(true)
            }}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:scale-105"
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
            className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:scale-105"
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
                        <p><strong>Files:</strong> {material.files?.length || 0}</p>
                        <div className="ml-4 mt-1 space-y-1">
                          {material.files?.map((file, idx) => (
                            <p key={idx} className="text-xs text-gray-500">
                              • {file.filename} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          ))}
                        </div>
                        <p><strong>Uploaded:</strong> {new Date(material.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAssignStudentsModal('material', material.id)}
                        className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-105"
                      >
                        Assign Students
                      </button>
                      <button
                        onClick={() => editMaterial(material)}
                        className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMaterial(material.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Delete
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
          {/* Sub-tabs for Assignments */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setAssignmentsSubTab('management')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${assignmentsSubTab === 'management'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
                  }`}
              >
                Assignment Management ({assignments.filter(a => !selectedCourse || a.course.id === selectedCourse).length})
              </button>
              <button
                onClick={() => setAssignmentsSubTab('submissions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${assignmentsSubTab === 'submissions'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-brand-primary hover:border-brand-primary/30'
                  }`}
              >
                Submissions ({filteredSubmissions.length})
              </button>
            </nav>
          </div>

          {/* Assignment Management Sub-tab */}
          {assignmentsSubTab === 'management' && (
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openAssignStudentsModal('assignment', assignment.id)}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-105"
                          >
                            Assign Students
                          </button>
                          <button
                            onClick={() => editAssignment(assignment)}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-105"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteAssignment(assignment.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Assignment Submissions Sub-tab */}
          {assignmentsSubTab === 'submissions' && (
            <>
              {/* Status Filter for Submissions */}
              <div className="mb-4 flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Filter by status:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'SUBMITTED' | 'REVIEWED' | 'REVISE')}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="ALL">All Submissions</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="REVISE">Revise</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  Showing {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
                </div>
              </div>

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
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${submission.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
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
                              className="px-3 py-1 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-105"
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
            </>
          )}

          {/* Assignment Management Sub-tab */}
          {assignmentsSubTab === 'management' && (
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openAssignStudentsModal('assignment', assignment.id)}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-105"
                          >
                            Assign Students
                          </button>
                          <button
                            onClick={() => editAssignment(assignment)}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-105"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteAssignment(assignment.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === 'quizzes' && (
        <div>
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Quiz Management</h2>
              <button
                onClick={() => {
                  setNewQuiz({ courseId: '', title: '', description: '', dueAt: '', questions: [] })
                  setEditingQuiz(null)
                  setShowQuizForm(true)
                }}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                Create Quiz
              </button>
            </div>
            <div className="divide-y">
              {quizzes.filter(q => !selectedCourse || q.course.id === selectedCourse).length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No quizzes found.
                </div>
              ) : (
                quizzes.filter(q => !selectedCourse || q.course.id === selectedCourse).map((quiz) => (
                  <div key={quiz.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          <p><strong>Course:</strong> {quiz.course.title}</p>
                          <p><strong>Description:</strong> {quiz.description || 'No description'}</p>
                          <p><strong>Due Date:</strong> {quiz.dueAt ? new Date(quiz.dueAt).toLocaleDateString() : 'No due date'}</p>
                          <p className="mt-1"><strong>Questions:</strong> {quiz.questions.length}</p>
                          <p className="mt-1"><strong>Submissions:</strong> {quiz.submissions.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAssignStudentsModal('quiz', quiz.id)}
                          className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-105"
                        >
                          Assign Students
                        </button>
                        <button
                          onClick={() => editQuiz(quiz)}
                          className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-105"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteQuiz(quiz.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Material Upload Modal */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMaterial ? 'Edit Course Material' : 'Upload Course Material'}
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <select
                    value={newMaterial.courseId}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, courseId: e.target.value }))}
                    disabled={savingMaterial}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={savingMaterial}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter material title"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Files {editingMaterial && '(Add new files below)'}
                    </label>
                    {newMaterial.files.length < 5 && (
                      <button
                        onClick={() => setNewMaterial(prev => ({ ...prev, files: [...prev.files, null] }))}
                        disabled={savingMaterial}
                        className="text-xs text-brand-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        + Add another file
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {newMaterial.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.svg"
                          onChange={(e) => {
                            const updatedFiles = [...newMaterial.files]
                            updatedFiles[index] = e.target.files?.[0] || null
                            setNewMaterial(prev => ({ ...prev, files: updatedFiles }))
                          }}
                          disabled={savingMaterial}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        {newMaterial.files.length > 1 && (
                          <button
                            onClick={() => {
                              const updatedFiles = newMaterial.files.filter((_, i) => i !== index)
                              setNewMaterial(prev => ({ ...prev, files: updatedFiles }))
                            }}
                            disabled={savingMaterial}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Each file should be less than 500MB (Max 5 files)</p>

                  {editingMaterial && editingMaterial.files && editingMaterial.files.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Existing Files:</p>
                      <ul className="space-y-1">
                        {editingMaterial.files.map((file, idx) => (
                          <li key={idx} className="text-xs text-gray-500 flex justify-between">
                            <span>{file.filename}</span>
                            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={uploadMaterial}
                  disabled={savingMaterial}
                  className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  {savingMaterial && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {savingMaterial
                    ? (editingMaterial ? 'Updating...' : 'Uploading...')
                    : (editingMaterial ? 'Update' : 'Upload')}
                </button>
                <button
                  onClick={() => {
                    if (savingMaterial) return
                    setShowMaterialForm(false)
                    setNewMaterial({ courseId: '', title: '', files: [null] })
                    setEditingMaterial(null)
                  }}
                  disabled={savingMaterial}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Creation/Edit Modal */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between relative">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
              </h3>
              <button
                onClick={() => {
                  if (savingAssignment) return
                  setShowAssignmentForm(false)
                  setNewAssignment({ courseId: '', title: '', description: '', dueAt: '', files: [null] })
                  setEditingAssignment(null)
                  setExistingResources([])
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Enter assignment title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Resources (PDF, Word, Images)</label>
                    {newAssignment.files.length + (editingAssignment ? existingResources.length : 0) < 5 && (
                      <button
                        onClick={() => setNewAssignment(prev => ({ ...prev, files: [...prev.files, null] }))}
                        disabled={savingAssignment}
                        className="text-xs text-brand-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        + Add another file
                      </button>
                    )}
                  </div>

                  {/* Existing Resources (when editing) */}
                  {editingAssignment && existingResources.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Existing Resources:</p>
                      {existingResources.map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm border border-gray-200">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-gray-700 truncate max-w-[200px]">{resource.filename}</span>
                            <span className="text-[10px] text-gray-400">({(resource.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button
                            onClick={() => deleteResource(resource.id)}
                            disabled={deletingResourceId === resource.id}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            type="button"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Resources */}
                  <div className="space-y-3">
                    {newAssignment.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.svg"
                          onChange={(e) => {
                            const updatedFiles = [...newAssignment.files]
                            updatedFiles[index] = e.target.files?.[0] || null
                            setNewAssignment(prev => ({ ...prev, files: updatedFiles }))
                          }}
                          disabled={savingAssignment}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        {newAssignment.files.length > 1 && (
                          <button
                            onClick={() => {
                              const updatedFiles = newAssignment.files.filter((_, i) => i !== index)
                              setNewAssignment(prev => ({ ...prev, files: updatedFiles }))
                            }}
                            disabled={savingAssignment}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            title="Remove"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-gray-500 italic">Max 5 total attachments per assignment. Each file &lt; 500MB.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={createAssignment}
                  disabled={savingAssignment}
                  className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  {savingAssignment && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {savingAssignment
                    ? (editingAssignment ? 'Updating...' : 'Creating...')
                    : (editingAssignment ? 'Update Assignment' : 'Create Assignment')}
                </button>
                <button
                  onClick={() => {
                    if (savingAssignment) return
                    setShowAssignmentForm(false)
                    setNewAssignment({ courseId: '', title: '', description: '', dueAt: '', files: [null] })
                    setEditingAssignment(null)
                    setExistingResources([])
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Enter quiz title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newQuiz.description}
                    onChange={(e) => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Questions</label>
                    <button
                      onClick={addQuizQuestion}
                      className="px-3 py-1 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-105"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                              placeholder="Enter question"
                            />
                          </div>
                          {question.type === 'MCQ' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                              {question.options.map((option: string, optIndex: number) => (
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
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                >
                                  <option value="">Select correct answer</option>
                                  {question.options.map((option: string, optIndex: number) => (
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
                  className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
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
                {selectedSubmission.assignment.title} - {selectedSubmission.user.name || selectedSubmission.user.email}
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

      {/* Assign Students Modal */}
      {assigningStudents.type && assigningStudents.id && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Students to {
                  assigningStudents.type === 'assignment' ? 'Assignment' :
                    assigningStudents.type === 'quiz' ? 'Quiz' :
                      'Course Material'
                }
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {assigningStudents.type !== 'material' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={assignmentDueDate}
                      onChange={(e) => setAssignmentDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Students
                    </label>
                    <div className="relative w-64">
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary pl-8"
                      />
                      <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                    {(() => {
                      const filteredStudents = students.filter(student =>
                        (student.name?.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
                        (student.email?.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                      );

                      return filteredStudents.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No students found matching "{studentSearchQuery}"</div>
                      ) : (
                        <div className="divide-y">
                          {filteredStudents.map((student) => (
                            <label
                              key={student.id}
                              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentIds([...selectedStudentIds, student.id])
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id))
                                  }
                                }}
                                className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                              />
                              <span className="ml-3 text-sm text-gray-900">
                                {student.name || student.email}
                                {student.name && <span className="text-gray-500 ml-1">({student.email})</span>}
                              </span>
                            </label>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                  {students.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      {selectedStudentIds.length} of {students.length} students selected
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAssignStudents}
                  disabled={selectedStudentIds.length === 0}
                  className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Students
                </button>
                <button
                  onClick={closeAssignStudentsModal}
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
