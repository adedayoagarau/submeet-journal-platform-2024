import { getServerSession } from "next-auth/next"
import { authOptions } from "../lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect("/dashboard")
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Submeet
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The submission platform that puts community before profit. 
            Built by editors who actually use these tools.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/auth/signin"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/directory"
              className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Browse Journals
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Writers</h3>
              <p className="text-gray-600">One account works everywhere. Track all your submissions in one place.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Editors</h3>
              <p className="text-gray-600">Professional workflow tools without the enterprise price tag.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">For Everyone</h3>
              <p className="text-gray-600">Built by the community, for the community. Always transparent.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}