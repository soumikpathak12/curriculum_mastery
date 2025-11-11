'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'

interface QuestionResult {
  questionId: string
  type: 'MCQ' | 'FILL_IN_BLANK'
  question: string
  options: string[]
  correctAnswer: string | null
  userAnswer: string
  isCorrect: boolean
  order: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  course: {
    id: string
    title: string
    slug: string
  }
}

interface Submission {
  id: string
  score: number | null
  submittedAt: string
}

export default function QuizResultsPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const quizId = params?.id as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (status === 'authenticated' && quizId) {
      loadResults()
    }
  }, [status, quizId])

  const loadResults = async () => {
    if (!quizId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/quizzes/${quizId}/results`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load results')
      }
      const data = await res.json()
      setQuiz(data.quiz)
      setSubmission(data.submission)
      setResults(data.results)
    } catch (err) {
      console.error('Failed to load results:', err)
      setError(err instanceof Error ? err.message : 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col">
        <Header />
        <main className="mx-auto max-w-4xl p-4 sm:p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !quiz || !submission) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col">
        <Header />
        <main className="mx-auto max-w-4xl p-4 sm:p-6 flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">{error || 'Results not found'}</p>
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

  const correctCount = results.filter((r) => r.isCorrect).length
  const totalQuestions = results.length
  const score = submission.score || 0

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <Header />
      <main className="mx-auto max-w-4xl p-4 sm:p-6 flex-1">
        {/* Results Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-brand-primary mb-2">{quiz.title} - Results</h1>
          {quiz.description && (
            <p className="text-gray-600 mb-4">{quiz.description}</p>
          )}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span>Course: {quiz.course.title}</span>
            <span>
              Submitted: {new Date(submission.submittedAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Score Card */}
          <div className="bg-gradient-to-r from-brand-primary to-blue-600 rounded-lg p-6 text-white">
            <div className="text-center">
              <p className="text-sm opacity-90 mb-2">Your Score</p>
              <p className="text-5xl font-bold mb-2">{score}%</p>
              <p className="text-lg opacity-90">
                {correctCount} out of {totalQuestions} questions correct
              </p>
            </div>
          </div>
        </div>

        {/* Question Results */}
        <div className="space-y-6 mb-6">
          {results.map((result, index) => (
            <div
              key={result.questionId}
              className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
                result.isCorrect ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Question {index + 1}: {result.question}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      result.isCorrect
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
              </div>

              {result.type === 'MCQ' ? (
                <div className="space-y-2">
                  {result.options.map((option, optIndex) => {
                    const isCorrect = option === result.correctAnswer
                    const isUserAnswer = option === result.userAnswer

                    return (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-lg border-2 ${
                          isCorrect
                            ? 'border-green-500 bg-green-50'
                            : isUserAnswer
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          {isCorrect && (
                            <svg
                              className="w-5 h-5 text-green-600 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          {isUserAnswer && !isCorrect && (
                            <svg
                              className="w-5 h-5 text-red-600 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                          <span
                            className={`${
                              isCorrect
                                ? 'text-green-800 font-semibold'
                                : isUserAnswer
                                ? 'text-red-800 font-semibold'
                                : 'text-gray-700'
                            }`}
                          >
                            {option}
                            {isCorrect && ' (Correct Answer)'}
                            {isUserAnswer && !isCorrect && ' (Your Answer)'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border-2 border-green-500 bg-green-50">
                    <p className="text-sm text-gray-600 mb-1">Correct Answer:</p>
                    <p className="text-green-800 font-semibold">{result.correctAnswer || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg border-2 border-red-500 bg-red-50">
                    <p className="text-sm text-gray-600 mb-1">Your Answer:</p>
                    <p className="text-red-800 font-semibold">{result.userAnswer || 'No answer provided'}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-6 py-3 bg-brand-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}

