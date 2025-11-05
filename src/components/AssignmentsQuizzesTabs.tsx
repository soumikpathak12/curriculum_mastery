'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Assignment {
  id: string
  title: string
  description: string | null
  dueAt: Date | null
  course: {
    title: string
  }
  submissions: Array<{
    id: string
    status: string
    createdAt: Date
    feedback: string | null
  }>
}

interface Quiz {
  id: string
  title: string
  description: string | null
  dueAt: Date | null
  course: {
    title: string
  }
  submissions: Array<{
    id: string
    score: number | null
    submittedAt: Date | null
  }>
}

interface AssignmentsQuizzesTabsProps {
  assignments: Assignment[]
  quizzes: Quiz[]
}

export default function AssignmentsQuizzesTabs({ assignments, quizzes }: AssignmentsQuizzesTabsProps) {
  const [activeTab, setActiveTab] = useState<'assignments' | 'quizzes'>('assignments')

  if (assignments.length === 0 && quizzes.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      {/* Tabs */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'assignments'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'quizzes'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quizzes ({quizzes.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        {activeTab === 'assignments' && assignments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
            {assignments.map((assignment) => {
              const submission = assignment.submissions[0]
              const isOverdue = assignment.dueAt && new Date(assignment.dueAt) < new Date() && !submission
              const isSubmitted = !!submission
              const statusColor = submission 
                ? submission.status === "REVIEWED" 
                  ? "border-l-green-500" 
                  : submission.status === "REVISE"
                  ? "border-l-yellow-500"
                  : "border-l-blue-500"
                : isOverdue
                ? "border-l-red-500"
                : "border-l-gray-300"
              
              return (
                <div
                  key={assignment.id}
                  className={`bg-gray-50 rounded-lg p-4 border-l-4 ${statusColor} border-r border-t border-b border-gray-200 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer flex flex-col h-full`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {isSubmitted ? (
                        <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-brand-primary line-clamp-1 mb-1">
                          {assignment.title}
                        </h3>
                        {isSubmitted && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            Submitted {new Date(submission.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {submission && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submission.status === "REVIEWED"
                              ? "bg-green-100 text-green-800"
                              : submission.status === "REVISE"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {submission.status}
                        </span>
                      )}
                      {isOverdue && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Overdue
                        </span>
                      )}
                      {!isSubmitted && !isOverdue && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2 ml-6">
                    {assignment.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3 ml-6">
                    <span className="truncate">{assignment.course.title}</span>
                    {assignment.dueAt && (
                      <span className={`shrink-0 ml-2 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                        Due: {new Date(assignment.dueAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  {submission?.feedback && (
                    <div className="mb-3 p-2.5 bg-white rounded text-xs border border-gray-200 ml-6">
                      <span className="font-medium text-gray-700">Feedback: </span>
                      <span className="text-gray-600 line-clamp-1">{submission.feedback}</span>
                    </div>
                  )}
                  <div className="flex justify-center mt-auto pt-3">
                    {submission ? (
                      <Link
                        href={`/assignments/${assignment.id}/submission`}
                        className="inline-block text-center rounded-lg bg-brand-primary px-3 py-2 text-white font-medium text-xs hover:bg-opacity-90 transition-all w-full"
                      >
                        View Submission
                      </Link>
                    ) : (
                      <Link
                        href={`/assignments/${assignment.id}/submit`}
                        className="inline-block text-center rounded-lg bg-brand-primary px-3 py-2 text-white font-medium text-xs hover:bg-opacity-90 transition-all w-full"
                      >
                        Submit Assignment
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'assignments' && assignments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No assignments available</p>
          </div>
        )}

        {activeTab === 'quizzes' && quizzes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
            {quizzes.map((quiz) => {
              const submission = quiz.submissions[0]
              const isOverdue = quiz.dueAt && new Date(quiz.dueAt) < new Date() && !submission
              const isCompleted = !!submission
              const statusColor = isCompleted
                ? "border-l-green-500"
                : isOverdue
                ? "border-l-red-500"
                : "border-l-gray-300"
              
              return (
                <div
                  key={quiz.id}
                  className={`bg-gray-50 rounded-lg p-4 border-l-4 ${statusColor} border-r border-t border-b border-gray-200 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer flex flex-col h-full`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {isCompleted ? (
                        <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-brand-primary line-clamp-1 mb-1">
                          {quiz.title}
                        </h3>
                        {isCompleted && submission.submittedAt && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            Completed {new Date(submission.submittedAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {submission && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      )}
                      {isOverdue && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Overdue
                        </span>
                      )}
                      {!isCompleted && !isOverdue && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2 ml-6">
                    {quiz.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3 ml-6">
                    <span className="truncate">{quiz.course.title}</span>
                    {quiz.dueAt && (
                      <span className={`shrink-0 ml-2 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                        Due: {new Date(quiz.dueAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  {submission && submission.score !== null && (
                    <div className="mb-3 text-xs ml-6">
                      <span className="font-medium text-brand-primary">Score: {submission.score}%</span>
                    </div>
                  )}
                  <div className="flex justify-center mt-auto pt-3">
                    {submission ? (
                      <Link
                        href={`/quizzes/${quiz.id}/results`}
                        className="inline-block text-center rounded-lg bg-brand-primary px-3 py-2 text-white font-medium text-xs hover:bg-opacity-90 transition-all w-full"
                      >
                        View Results
                      </Link>
                    ) : (
                      <Link
                        href={`/quizzes/${quiz.id}/take`}
                        className="inline-block text-center rounded-lg bg-brand-primary px-3 py-2 text-white font-medium text-xs hover:bg-opacity-90 transition-all w-full"
                      >
                        Take Quiz
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'quizzes' && quizzes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No quizzes available</p>
          </div>
        )}
      </div>
    </div>
  )
}

