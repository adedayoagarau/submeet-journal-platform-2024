'use client'

import { useEffect, useState } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
      name: string
      organization: {
        name: string
      }
    }
  }
  submissionFiles: Array<{
    id: string
    originalName: string
    fileSizeBytes: number
    mimeType: string
    fileType: string
    uploadedAt: string
  }>
  decision?: {
    id: string
    decisionType: string
    decisionText?: string
    sentAt?: string
  }
}

export default function SubmissionDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchSubmission()
  }, [session, params.id])

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/submissions/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Submission not found')
        } else {
          setError('Failed to load submission')
        }
        setIsLoading(false)
        return
      }
      
      const data = await response.json()
      setSubmission(data.submission)
      setIsLoading(false)
      
    } catch (error) {
      console.error('Error fetching submission:', error)
      setError('Failed to load submission')
      setIsLoading(false)
    }
  }

  const handleFileDownload = async (fileId: string) => {
    try {
      const response = await fetch(`/api/upload?fileId=${fileId}&submissionId=${params.id}`)
      
      if (!response.ok) {
        alert('Failed to download file')
        return
      }
      
      const { downloadUrl } = await response.json()
      window.open(downloadUrl, '_blank')
      
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    }
  }

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this submission? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/submissions/${params.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Writer requested withdrawal'
        })
      })
      
      if (!response.ok) {
        alert('Failed to withdraw submission')
        return
      }
      
      router.push('/submissions?withdrawn=true')
      
    } catch (error) {
      console.error('Error withdrawing submission:', error)
      alert('Failed to withdraw submission')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submission...</p>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The submission you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => router.push('/submissions')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Submissions
          </button>
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
              <button
                onClick={() => router.push('/submissions')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                ← Back to Submissions
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Submission Details</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{submission.title}</h2>
                <p className="text-gray-600 mt-1">
                  Submitted to {submission.form.publication.name} ({submission.form.publication.organization.name})
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                  {getStatusLabel(submission.status)}
                </span>
                {submission.status === 'pending' && (
                  <button
                    onClick={handleWithdraw}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Submitted</p>
                <p className="font-medium">{new Date(submission.submittedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Genre</p>
                <p className="font-medium">{submission.genre || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-500">Word Count</p>
                <p className="font-medium">{submission.wordCount || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">{new Date(submission.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Files */}
        {submission.submissionFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Submitted Files</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {submission.submissionFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 p-2 rounded">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{file.originalName}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.fileSizeBytes)} • {file.mimeType}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFileDownload(file.id)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Decision */}
        {submission.decision && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Editorial Decision</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  submission.decision.decisionType === 'accept' ? 'bg-green-100 text-green-800' :
                  submission.decision.decisionType === 'decline' ? 'bg-red-100 text-red-800' :
                  submission.decision.decisionType === 'revise_resubmit' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {submission.decision.decisionType === 'accept' ? 'Accepted' :
                   submission.decision.decisionType === 'decline' ? 'Declined' :
                   submission.decision.decisionType === 'revise_resubmit' ? 'Revise & Resubmit' :
                   'Shortlisted'}
                </span>
                {submission.decision.sentAt && (
                  <span className="text-sm text-gray-500">
                    Sent {new Date(submission.decision.sentAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              {submission.decision.decisionText && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{submission.decision.decisionText}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Submission Actions</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {submission.status === 'pending' ? 'You can withdraw this submission if needed.' :
                   submission.status === 'under_review' ? 'This submission is currently being reviewed.' :
                   'This submission has been processed.'}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/submissions')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Back to Submissions
                </button>
                {submission.status === 'pending' && (
                  <button
                    onClick={handleWithdraw}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Withdraw Submission
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}