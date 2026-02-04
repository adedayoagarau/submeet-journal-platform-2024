'use client'

import { useEffect, useState } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Submission {
  id: string
  title: string
  subtitle?: string
  genre?: string
  wordCount?: number
  status: string
  submittedAt: string
  form: {
    publication: {
      name: string
      organization: {
        name: string
      }
    }
  }
  submissionFiles: Array<{
    id: string
    originalName: string
  }>
}

export default function SubmissionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchSubmissions()
  }, [session, filter])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }
      
      const data = await response.json()
      setSubmissions(data.submissions)
      setIsLoading(false)
      
    } catch (error) {
      console.error('Error fetching submissions:', error)
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pending',
      under_review: 'Under Review',
      shortlisted: 'Shortlisted',
      accepted: 'Accepted',
      declined: 'Declined',
      withdrawn: 'Withdrawn'
    }
    return labels[status as keyof typeof labels] || status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true
    return submission.status === filter
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                Submeet
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/directory" 
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Directory
              </Link>
              <Link 
                href="/submissions/new"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                New Submission
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          <p className="text-gray-600 mt-2">Track your literary submissions across all journals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total</h3>
            <p className="text-3xl font-bold text-gray-600">{submissions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{submissions.filter(s => s.status === 'pending').length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Under Review</h3>
            <p className="text-3xl font-bold text-blue-600">{submissions.filter(s => s.status === 'under_review').length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Decided</h3>
            <p className="text-3xl font-bold text-green-600">{submissions.filter(s => ['accepted', 'declined', 'shortlisted'].includes(s.status)).length}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filter Submissions</h3>
              <div className="flex space-x-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'under_review', label: 'Under Review' },
                  { value: 'shortlisted', label: 'Shortlisted' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'declined', label: 'Declined' },
                  { value: 'withdrawn', label: 'Withdrawn' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      filter === option.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {filter === 'all' ? 'All Submissions' : `${getStatusLabel(filter)} Submissions`}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' 
                    ? "You haven't submitted any work yet."
                    : `No submissions found with status "${getStatusLabel(filter)}".`
                  }
                </p>
                <div className="mt-6">
                  <Link
                    href="/directory"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Browse Journals
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <div key={submission.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {getStatusLabel(submission.status)}
                          </span>
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {submission.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {submission.form.publication.name} • {submission.form.publication.organization.name}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Submitted {formatDate(submission.submittedAt)}</span>
                          {submission.genre && <span>• {submission.genre}</span>}
                          {submission.wordCount && <span>• {submission.wordCount} words</span>}
                          {submission.submissionFiles.length > 0 && (
                            <span>• {submission.submissionFiles.length} file{submission.submissionFiles.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/submissions/${submission.id}`}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          View Details
                        </Link>
                        {submission.status === 'pending' && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to withdraw this submission?')) {
                                // Handle withdrawal
                                console.log('Withdraw submission', submission.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}