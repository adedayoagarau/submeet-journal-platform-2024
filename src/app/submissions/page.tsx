'use client'

import { useEffect, useState } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Search, 
  Filter, 
  Download,
  Grid,
  List,
  SortAsc,
  X
} from 'lucide-react'
import { 
  useSubmissionFilters, 
  SortButton, 
  FilterDropdown, 
  statusOptions,
  genreOptions 
} from "@/hooks/useSubmissionFilters"

interface Submission {
  id: string
  title: string
  subtitle?: string
  genre?: string
  wordCount?: number
  status: string
  submittedAt: string
  updatedAt: string
  form: {
    publication: {
      id: string
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showFilters, setShowFilters] = useState(false)

  const {
    sortedSubmissions,
    sortConfig,
    filterConfig,
    searchQuery,
    activeFiltersCount,
    handleSort,
    setFilterConfig,
    setSearchQuery,
    clearFilters
  } = useSubmissionFilters(submissions)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchSubmissions()
  }, [session])

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
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      shortlisted: 'bg-purple-100 text-purple-800 border-purple-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      declined: 'bg-red-100 text-red-800 border-red-200',
      withdrawn: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
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

  const exportToCSV = () => {
    const headers = ['Title', 'Publication', 'Status', 'Genre', 'Word Count', 'Submitted', 'Updated']
    const rows = sortedSubmissions.map(s => [
      s.title,
      s.form.publication.name,
      getStatusLabel(s.status),
      s.genre || '',
      s.wordCount || '',
      formatDate(s.submittedAt),
      formatDate(s.updatedAt)
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'submissions.csv'
    a.click()
  }

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
                href="/dashboard" 
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
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
          <p className="text-gray-600 mt-2">Track and manage your literary submissions</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Total', value: submissions.length, color: 'text-gray-600' },
            { label: 'Pending', value: submissions.filter(s => s.status === 'pending').length, color: 'text-yellow-600' },
            { label: 'Under Review', value: submissions.filter(s => s.status === 'under_review').length, color: 'text-blue-600' },
            { label: 'Shortlisted', value: submissions.filter(s => s.status === 'shortlisted').length, color: 'text-purple-600' },
            { label: 'Accepted', value: submissions.filter(s => s.status === 'accepted').length, color: 'text-green-600' },
            { label: 'Declined', value: submissions.filter(s => s.status === 'declined').length, color: 'text-red-600' }
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFiltersCount > 0 || showFilters
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="h-6 w-px bg-gray-300 mx-2" />

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
                >
                  <List className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                >
                  <Grid className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Export */}
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <FilterDropdown
                  label="Status"
                  options={statusOptions}
                  selected={filterConfig.status || []}
                  onChange={(values) => setFilterConfig({ ...filterConfig, status: values })}
                />
                <FilterDropdown
                  label="Genre"
                  options={genreOptions}
                  selected={filterConfig.genre || []}
                  onChange={(values) => setFilterConfig({ ...filterConfig, genre: values })}
                />
                
                {/* Sort Options */}
                <div className="flex items-center space-x-2 ml-auto">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <SortButton
                    label="Date"
                    sortKey="submittedAt"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortButton
                    label="Title"
                    sortKey="title"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortButton
                    label="Status"
                    sortKey="status"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortButton
                    label="Publication"
                    sortKey="publication"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{sortedSubmissions.length}</span> of{' '}
            <span className="font-medium">{submissions.length}</span> submissions
          </p>
          {activeFiltersCount > 0 && (
            <p className="text-sm text-indigo-600">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
            </p>
          )}
        </div>

        {/* Submissions Display */}
        {viewMode === 'list' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Publication
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.title}
                            </div>
                            {submission.subtitle && (
                              <div className="text-sm text-gray-500">{submission.subtitle}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.form.publication.name}</div>
                        <div className="text-sm text-gray-500">{submission.form.publication.organization.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(submission.status)}`}>
                          {getStatusLabel(submission.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.genre && <div>{submission.genre}</div>}
                        {submission.wordCount && <div>{submission.wordCount.toLocaleString()} words</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(submission.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/submissions/${submission.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(submission.status)}`}>
                    {getStatusLabel(submission.status)}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(submission.submittedAt)}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{submission.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{submission.form.publication.name}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {submission.genre && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {submission.genre}
                    </span>
                  )}
                  {submission.wordCount && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {submission.wordCount.toLocaleString()} words
                    </span>
                  )}
                </div>
                
                <Link
                  href={`/submissions/${submission.id}`}
                  className="block w-full text-center py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {sortedSubmissions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              {searchQuery || activeFiltersCount > 0
                ? "No submissions match your filters"
                : "No submissions yet"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchQuery || activeFiltersCount > 0
                ? "Try adjusting your search or filters"
                : "Start by submitting your work to journals!"}
            </p>
            <div className="mt-6">
              {searchQuery || activeFiltersCount > 0 ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  href="/directory"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Browse Journals
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
