import Link from 'next/link'
import { 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Bookmark,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface DashboardStats {
  activeSubmissions: number
  totalSubmissions: number
  acceptanceRate: number
  bookmarkedJournals: number
  pendingReviews: number
  totalWords: number
  submissionsThisMonth: number
  averageResponseTime: number
}

interface Activity {
  id: string
  type: 'submission_created' | 'status_changed' | 'review_completed' | 'journal_bookmarked'
  title: string
  description: string
  timestamp: string
  metadata?: any
}

interface Journal {
  id: string
  name: string
  organization: { name: string }
  genres: string[]
  isAcceptingSubmissions: boolean
  readingPeriodEnd?: string
}

export function DashboardStats({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      title: 'Active Submissions',
      value: stats.activeSubmissions,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: stats.submissionsThisMonth > 0 ? `+${stats.submissionsThisMonth} this month` : undefined
    },
    {
      title: 'Total Submissions',
      value: stats.totalSubmissions,
      icon: BookOpen,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Acceptance Rate',
      value: `${stats.acceptanceRate}%`,
      icon: TrendingUp,
      color: stats.acceptanceRate > 10 ? 'text-green-600' : 'text-yellow-600',
      bgColor: stats.acceptanceRate > 10 ? 'bg-green-50' : 'bg-yellow-50'
    },
    {
      title: 'Bookmarked Journals',
      value: stats.bookmarkedJournals,
      icon: Bookmark,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div 
            key={index} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-3xl font-bold ${card.color} mt-2`}>
                  {card.value}
                </p>
                {card.trend && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    {card.trend}
                  </p>
                )}
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function RecentActivity({ activities }: { activities: Activity[] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission_created':
        return <FileText className="w-5 h-5 text-blue-600" />
      case 'status_changed':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'review_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'journal_bookmarked':
        return <Bookmark className="w-5 h-5 text-purple-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-600 mt-1">Your latest actions and updates</p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="text-sm text-gray-500 mt-1">
              Start by submitting your work or exploring journals!
            </p>
          </div>
        ) : (
          activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="p-4 flex items-start space-x-4 hover:bg-gray-50">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{formatTimestamp(activity.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length > 5 && (
        <div className="p-4 border-t border-gray-100">
          <Link 
            href="/activity"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            View all activity →
          </Link>
        </div>
      )}
    </div>
  )
}

export function FeaturedJournals({ journals }: { journals: Journal[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Featured Journals</h3>
            <p className="text-sm text-gray-600 mt-1">Currently accepting submissions</p>
          </div>
          <Link 
            href="/directory"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            View all →
          </Link>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {journals.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900">No journals featured</h3>
            <p className="text-sm text-gray-500 mt-1">Check the directory for all available journals!</p>
          </div>
        ) : (
          journals.slice(0, 5).map((journal) => (
            <div key={journal.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-gray-900">{journal.name}</h4>
                  <p className="text-sm text-gray-600">{journal.organization.name}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {journal.genres.slice(0, 3).map((genre, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                      >
                        {genre}
                      </span>
                    ))}
                    {journal.genres.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{journal.genres.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {journal.isAcceptingSubmissions ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Open
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      Closed
                    </span>
                  )}
                </div>
              </div>
              
              {journal.readingPeriodEnd && (
                <div className="flex items-center text-sm text-gray-500 mt-3">
                  <Calendar className="w-4 h-4 mr-1" />
                  Reading period ends {new Date(journal.readingPeriodEnd).toLocaleDateString()}
                </div>
              )}
              
              <div className="mt-4 flex items-center space-x-3">
                <Link
                  href={`/directory/${journal.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View Details
                </Link>
                {journal.isAcceptingSubmissions && (
                  <Link
                    href={`/submissions/new?journal=${journal.id}`}
                    className="text-sm font-medium text-green-600 hover:text-green-800"
                  >
                    Submit →
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function QuickActions() {
  const actions = [
    {
      title: 'Submit New Work',
      description: 'Send your writing to journals',
      href: '/submissions/new',
      icon: FileText,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      textColor: 'text-white'
    },
    {
      title: 'Browse Directory',
      description: 'Discover literary magazines',
      href: '/directory',
      icon: BookOpen,
      color: 'bg-white hover:bg-gray-50 border border-gray-300',
      textColor: 'text-gray-700'
    },
    {
      title: 'View My Submissions',
      description: 'Track your submission status',
      href: '/submissions',
      icon: TrendingUp,
      color: 'bg-white hover:bg-gray-50 border border-gray-300',
      textColor: 'text-gray-700'
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <Link
              key={index}
              href={action.href}
              className={`flex items-center p-4 rounded-lg transition-colors ${action.color}`}
            >
              <Icon className={`w-5 h-5 mr-3 ${action.textColor}`} />
              <div className="flex-1">
                <p className={`font-medium ${action.textColor}`}>{action.title}</p>
                <p className={`text-sm ${action.textColor === 'text-white' ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {action.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
