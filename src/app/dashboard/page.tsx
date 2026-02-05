import { getServerSession } from "next-auth/next"
import { authOptions } from "../../lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/auth/signin")
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
                href="/submissions" 
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                My Submissions
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">{session.user?.name || session.user?.email}</span>
                <Link 
                  href="/api/auth/signout" 
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your submissions.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Submissions</h3>
            <p className="text-3xl font-bold text-indigo-600">0</p>
            <p className="text-sm text-gray-500">Currently under review</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Submissions</h3>
            <p className="text-3xl font-bold text-gray-600">0</p>
            <p className="text-sm text-gray-500">All time</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceptance Rate</h3>
            <p className="text-3xl font-bold text-green-600">0%</p>
            <p className="text-sm text-gray-500">Based on your submissions</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bookmarked Journals</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-500">Your favorites</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                href="/submissions/new"
                className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-center hover:bg-indigo-700 transition-colors"
              >
                Submit New Work
              </Link>
              <Link 
                href="/directory"
                className="block w-full bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-md text-center hover:bg-indigo-50 transition-colors"
              >
                Browse Journals
              </Link>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="text-gray-500 text-center py-8">
              <p>No recent activity</p>
              <p className="text-sm mt-2">Start by exploring journals or submitting your work!</p>
            </div>
          </div>
        </div>

        {/* Featured Journals */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Featured Journals</h3>
            <p className="text-gray-600 mt-1">Discover literary magazines currently accepting submissions</p>
          </div>
          <div className="p-6">
            <div className="text-gray-500 text-center py-8">
              <p>No journals are currently featured</p>
              <p className="text-sm mt-2">Check back soon or browse the full directory!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}