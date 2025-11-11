'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'

interface QuizQuestion {
  id: string
  type: 'MCQ' | 'FILL_IN_BLANK'
  question: string
  options: string[]
  order: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  dueAt: string | null
  course: {
    id: string
    title: string
    slug: string
  }
  questions: QuizQuestion[]
}

export default function TakeQuizPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const quizId = params?.id as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (status === 'authenticated' && quizId) {
      loadQuiz()
    }
  }, [status, quizId])

  const loadQuiz = async () => {
    if (!quizId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/quizzes/${quizId}/take`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load quiz')
      }
      const data = await res.json()
      setQuiz(data.quiz)
    } catch (err) {
      console.error('Failed to load quiz:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleSubmit = async () => {
    if (!quiz) return

    // Check if all questions are answered
    const unanswered = quiz.questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0) {
      if (
        !confirm(
          `You have ${unanswered.length} unanswered question(s). Do you want to submit anyway?`
        )
      ) {
        return
      }
    }

    if (!quizId) return
    try {
      setSubmitting(true)
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit quiz')
      }

      // Redirect to results page
      router.push(`/quizzes/${quizId}/results`)
    } catch (err) {
      console.error('Failed to submit quiz:', err)
      alert(err instanceof Error ? err.message : 'Failed to submit quiz')
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col">
        <Header />
        <main className="mx-auto max-w-6xl w-full p-6 sm:p-8 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quiz...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col">
        <Header />
        <main className="mx-auto max-w-6xl w-full p-6 sm:p-8 flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error || 'Quiz not found'}</p>
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

  const answeredCount = Object.keys(answers).length
  const totalQuestions = quiz.questions.length

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Header />
      <main className="mx-auto max-w-6xl w-full p-6 sm:p-8 flex-1">
        {/* Quiz Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-8">
              <h1 className="text-3xl font-bold text-brand-primary mb-3">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-gray-600 text-lg mb-4">{quiz.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {quiz.course.title}
                </span>
                {quiz.dueAt && (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Due: {new Date(quiz.dueAt).toLocaleDateString('en-IN', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-brand-primary/10 rounded-xl p-4 text-center min-w-[120px]">
              <div className="text-3xl font-bold text-brand-primary mb-1">
                {answeredCount}/{totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-brand-primary">
                {Math.round((answeredCount / totalQuestions) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-primary to-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Questions Container */}
        <div className="space-y-6 mb-8">
          {quiz.questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white rounded-xl shadow-md p-6 border-l-4 border-brand-primary hover:shadow-lg transition-shadow"
            >
              <div className="mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-lg">{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 flex-1 pt-1">
                    {question.question}
                  </h3>
                </div>
              </div>

              {question.type === 'MCQ' ? (
                <div className="space-y-3 ml-14">
                  {question.options.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className={`flex items-start p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        answers[question.id] === option
                          ? 'border-brand-primary bg-brand-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-brand-primary/50 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-5 h-5 text-brand-primary focus:ring-brand-primary mt-0.5 mr-4 flex-shrink-0"
                      />
                      <span className="text-gray-700 text-base leading-relaxed flex-1">{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="ml-14">
                  <input
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full px-5 py-3 text-base border-2 border-gray-300 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 sticky bottom-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-medium text-gray-700 mb-1">
                {answeredCount === totalQuestions
                  ? '✓ All questions answered'
                  : `${totalQuestions - answeredCount} question(s) remaining`}
              </p>
              <p className="text-sm text-gray-500">
                {answeredCount === totalQuestions
                  ? 'You can now submit your quiz'
                  : 'Please answer all questions before submitting'}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-brand-primary text-white rounded-xl font-semibold text-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Quiz'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

