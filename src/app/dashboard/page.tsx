import { getServerSession } from "next-auth/next"
import { authOptions } from "../../lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/prisma"
import { DashboardStats, RecentActivity, FeaturedJournals, QuickActions } from "../../components/dashboard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  // Fetch user data with all relations
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      submissions: {
        include: {
          form: {
            include: {
              publication: {
                include: {
                  organization: true
                }
              }
            }
          },
          decision: true
        },
        orderBy: { submittedAt: 'desc' }
      },
      journalBookmarks: {
        include: {
          publication: true
        }
      },
      userActivity: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      userPublicationRoles: {
        include: {
          publication: true
        }
      }
    }
  })

  if (!user) {
    redirect("/auth/signin")
  }

  // Calculate stats
  const activeSubmissions = user.submissions.filter(
    s => ['pending', 'under_review', 'shortlisted'].includes(s.status)
  ).length

  const totalSubmissions = user.submissions.length

  const acceptedSubmissions = user.submissions.filter(
    s => s.status === 'accepted'
  ).length

  const acceptanceRate = totalSubmissions > 0 
    ? Math.round((acceptedSubmissions / totalSubmissions) * 100) 
    : 0

  const submissionsThisMonth = user.submissions.filter(s => {
    const submittedDate = new Date(s.submittedAt)
    const now = new Date()
    return submittedDate.getMonth() === now.getMonth() && 
           submittedDate.getFullYear() === now.getFullYear()
  }).length

  const totalWords = user.submissions.reduce((acc, s) => acc + (s.wordCount || 0), 0)

  // Fetch featured journals
  const featuredJournals = await prisma.publication.findMany({
    where: { 
      isAcceptingSubmissions: true 
    },
    include: {
      organization: true
    },
    take: 5,
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Format activities
  const activities = user.userActivity.map(activity => ({
    id: activity.id,
    type: activity.activityType,
    title: getActivityTitle(activity),
    description: getActivityDescription(activity),
    timestamp: activity.createdAt.toISOString()
  }))

  // Check if user is a reader/editor
  const isReader = user.userPublicationRoles.some(
    role => ['reader', 'editor', 'admin'].includes(role.role)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-indigo-600">
                Submeet
              </a>
              <div className="hidden md:flex ml-10 space-x-8">
                <a href="/dashboard" className="text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="/submissions" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  My Submissions
                </a>
                <a href="/directory" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Directory
                </a>
                {isReader && (
                  <a href="/reader" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                    Reader
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.name || user.email}</span>
              <a 
                href="/api/auth/signout" 
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name?.split(' ')[0] || 'Writer'}
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your literary journey
          </p>
        </div>

        {/* Stats */}
        <DashboardStats 
          stats={{
            activeSubmissions,
            totalSubmissions,
            acceptanceRate,
            bookmarkedJournals: user.journalBookmarks.length,
            pendingReviews: 0, // Calculate from reviews
            totalWords,
            submissionsThisMonth,
            averageResponseTime: 0 // Calculate from submission data
          }} 
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions & Activity */}
          <div className="lg:col-span-1 space-y-6">
            <QuickActions />
            <RecentActivity activities={activities} />
          </div>

          {/* Right Column - Featured Journals & Recent Submissions */}
          <div className="lg:col-span-2 space-y-6">
            <FeaturedJournals 
              journals={featuredJournals.map(j => ({
                id: j.id,
                name: j.name,
                organization: { name: j.organization.name },
                genres: j.genres,
                isAcceptingSubmissions: j.isAcceptingSubmissions,
                readingPeriodEnd: j.readingPeriodEnd?.toISOString()
              }))} 
            />

            {/* Recent Submissions Preview */}
            {user.submissions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
                      <p className="text-sm text-gray-600 mt-1">Your latest work</p>
                    </div>
                    <a 
                      href="/submissions"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      View all →
                    </a>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {user.submissions.slice(0, 3).map((submission) => (
                    <div key={submission.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{submission.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {submission.form.publication.name} • {submission.genre}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          submission.status === 'declined' ? 'bg-red-100 text-red-800' :
                          submission.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getActivityTitle(activity: any): string {
  switch (activity.activityType) {
    case 'submission_created':
      return 'New Submission'
    case 'status_changed':
      return 'Status Update'
    case 'review_completed':
      return 'Review Completed'
    case 'journal_bookmarked':
      return 'Journal Bookmarked'
    default:
      return 'Activity'
  }
}

function getActivityDescription(activity: any): string {
  const metadata = activity.metadata as any
  switch (activity.activityType) {
    case 'submission_created':
      return `You submitted "${metadata?.title || 'a piece'}" to ${metadata?.publication || 'a journal'}`
    case 'status_changed':
      return `Submission status changed to ${metadata?.newStatus || 'updated'}`
    case 'review_completed':
      return `Reader completed review of your submission`
    case 'journal_bookmarked':
      return `You bookmarked ${metadata?.publication || 'a journal'}`
    default:
      return 'Activity recorded'
  }
}
