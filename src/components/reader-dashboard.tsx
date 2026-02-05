'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Star,
  BarChart3,
  MessageSquare,
  Filter,
  Search,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react'
import { useSubmissionFilters, SortButton, FilterDropdown, statusOptions } from '@/hooks/useSubmissionFilters'

interface ReaderDashboardProps {
  user: {
    id: string
    name: string
    email: string
  }
  publications: Array<{
    id: string
    name: string
    role: string
  }>
}

interface ReviewAssignment {
  id: string
  submission: {
    id: string
    title: string
    genre?: string
    wordCount?: number
    author: {
      name: string
      bio?: string
    }
    coverLetter?: string
  }
  assignedAt: string
  isComplete: boolean
  rating?: number
  recommendation?: 'pass' | 'maybe' | 'yes'
}

export function ReaderDashboard({ user, publications }: ReaderDashboardProps) {
  const [selectedPublication, setSelectedPublication] = useState(publications[0]?.id)
  const [activeTab, setActiveTab] = useState<'assigned' | 'completed' | 'stats'>('assigned')
  
  // Mock data - replace with actual API calls
  const assignments: ReviewAssignment[] = []
  
  const stats = {
    totalAssigned: 0,
    completed: 0,
    averageRating: 0,
    acceptanceRate: 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reader Dashboard</h1>
              <p className="text-gray-600 mt-1">Review submissions and manage your workload</p>
            </div>
            
            {publications.length > 1 && (
              <div className="relative">
                <select
                  value={selectedPublication}
                  onChange={(e) => setSelectedPublication(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {publications.map((pub) => (
                    <option key={pub.id} value={pub.id}>{pub.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Assigned to You"
            value={stats.totalAssigned}
            icon={FileText}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Completed Reviews"
            value={stats.completed}
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            title="Average Rating"
            value={stats.averageRating || '-'}
            icon={Star}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
          />
          <StatCard
            title="Acceptance Rate"
            value={`${stats.acceptanceRate}%`}
            icon={BarChart3}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'assigned', label: 'Assigned to Me', count: stats.totalAssigned },
                { id: 'completed', label: 'Completed', count: stats.completed },
                { id: 'stats', label: 'My Stats' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'assigned' && (
              <AssignedReviews assignments={assignments} />
            )}
            {activeTab === 'completed' && (
              <CompletedReviews assignments={assignments.filter(a => a.isComplete)} />
            )}
            {activeTab === 'stats' && (
              <ReaderStats userId={user.id} publicationId={selectedPublication} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-2`}>{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  )
}

function AssignedReviews({ assignments }: { assignments: ReviewAssignment[] }) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No assignments</h3>
        <p className="text-gray-500 mt-2">You don't have any submissions to review right now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div key={assignment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {assignment.submission.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                by {assignment.submission.author.name}
              </p>
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                {assignment.submission.genre && (
                  <span className="px-2 py-1 bg-gray-100 rounded">{assignment.submission.genre}</span>
                )}
                {assignment.submission.wordCount && (
                  <span>{assignment.submission.wordCount.toLocaleString()} words</span>
                )}
                <span>Assigned {new Date(assignment.assignedAt).toLocaleDateString()}</span>
              </div>
              
              {assignment.submission.coverLetter && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {assignment.submission.coverLetter}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href={`/reader/review/${assignment.id}`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Start Review
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function CompletedReviews({ assignments }: { assignments: ReviewAssignment[] }) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No completed reviews</h3>
        <p className="text-gray-500 mt-2">You haven't completed any reviews yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div key={assignment.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {assignment.submission.title}
              </h3>
              <div className="flex items-center space-x-4 mt-3">
                {assignment.rating && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium">{assignment.rating}/5</span>
                  </div>
                )}
                {assignment.recommendation && (
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    assignment.recommendation === 'yes' ? 'bg-green-100 text-green-700' :
                    assignment.recommendation === 'maybe' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {assignment.recommendation === 'yes' ? 'Recommend Accept' :
                     assignment.recommendation === 'maybe' ? 'Maybe' : 'Pass'}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/reader/review/${assignment.id}`}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              View Review
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReaderStats({ userId, publicationId }: { userId: string; publicationId?: string }) {
  // Mock stats - replace with actual data
  const stats = {
    reviewsThisMonth: 0,
    averageReviewTime: 0,
    agreementRate: 0,
    genresReviewed: [] as string[]
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-600 mb-4">Review Activity</h4>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.reviewsThisMonth}</p>
            <p className="text-sm text-gray-600">Reviews this month</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.averageReviewTime}h</p>
            <p className="text-sm text-gray-600">Average review time</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-600 mb-4">Quality Metrics</h4>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.agreementRate}%</p>
            <p className="text-sm text-gray-600">Agreement with final decision</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Genres reviewed:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {stats.genresReviewed.length === 0 ? (
                <span className="text-gray-400 text-sm">No data yet</span>
              ) : (
                stats.genresReviewed.map((genre) => (
                  <span key={genre} className="px-2 py-1 bg-white border border-gray-200 rounded text-sm">
                    {genre}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
