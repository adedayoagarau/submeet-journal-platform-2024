'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Submission {
  id: string
  title: string
  author: string
  email: string
  genre: string
  wordCount: number
  status: 'pending' | 'under_review' | 'shortlisted' | 'accepted' | 'declined'
  submittedAt: string
  coverLetter?: string
  bio?: string
  isSimultaneous: boolean
  files: {
    id: string
    fileName: string
    fileType: 'manuscript' | 'cover_letter' | 'bio'
    uploadedAt: string
  }[]
}

interface Reader {
  id: string
  name: string
  email: string
  specialization: string[]
  currentWorkload: number
  maxWorkload: number
}

export default function SubmissionsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [readers, setReaders] = useState<Reader[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterGenre, setFilterGenre] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('submittedAt')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // Mock data for demo
  const mockSubmissions: Submission[] = [
    {
      id: '1',
      title: 'The Last Garden',
      author: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      genre: 'Literary Fiction',
      wordCount: 3200,
      status: 'pending',
      submittedAt: '2026-02-01T10:30:00Z',
      coverLetter: 'Dear Editor, I am submitting my short story "The Last Garden" for your consideration...',
      bio: 'Sarah Johnson is a writer based in Portland, Oregon. Her work has appeared in...',
      isSimultaneous: false,
      files: [
        { id: '1', fileName: 'last_garden_manuscript.pdf', fileType: 'manuscript', uploadedAt: '2026-02-01T10:25:00Z' },
        { id: '2', fileName: 'johnson_bio.txt', fileType: 'bio', uploadedAt: '2026-02-01T10:28:00Z' }
      ]
    },
    {
      id: '2',
      title: 'Midnight in Lagos',
      author: 'Adebayo Oluwafemi',
      email: 'adebayo.o@email.com',
      genre: 'Short Story',
      wordCount: 2800,
      status: 'under_review',
      submittedAt: '2026-01-28T14:15:00Z',
      coverLetter: 'I am excited to submit this piece that explores the vibrant nightlife of Lagos...',
      isSimultaneous: true,
      files: [
        { id: '3', fileName: 'midnight_lagos.docx', fileType: 'manuscript', uploadedAt: '2026-01-28T14:10:00Z' }
      ]
    },
    {
      id: '3',
      title: 'The Algorithm of Love',
      author: 'Maria Chen',
      email: 'maria.c@email.com',
      genre: 'Science Fiction',
      wordCount: 4100,
      status: 'pending',
      submittedAt: '2026-01-25T09:45:00Z',
      coverLetter: 'This speculative fiction piece examines relationships in the age of AI...',
      isSimultaneous: false,
      files: [
        { id: '4', fileName: 'algorithm_love.pdf', fileType: 'manuscript', uploadedAt: '2026-01-25T09:40:00Z' }
      ]
    }
  ]

  const mockReaders: Reader[] = [
    {
      id: '1',
      name: 'Dr. Emily Rodriguez',
      email: 'emily@literaryjournal.com',
      specialization: ['Literary Fiction', 'Creative Non-fiction'],
      currentWorkload: 3,
      maxWorkload: 5
    },
    {
      id: '2',
      name: 'Prof. James Wilson',
      email: 'james@literaryjournal.com',
      specialization: ['Science Fiction', 'Fantasy'],
      currentWorkload: 2,
      maxWorkload: 4
    },
    {
      id: '3',
      name: 'Dr. Lisa Thompson',
      email: 'lisa@literaryjournal.com',
      specialization: ['Poetry', 'Short Stories'],
      currentWorkload: 1,
      maxWorkload: 3
    }
  ]

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Load submissions data
    setSubmissions(mockSubmissions)
    setReaders(mockReaders)
    setLoading(false)
  }, [session, status, router])

  const filteredSubmissions = submissions.filter(submission => {
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus
    const matchesGenre = filterGenre === 'all' || submission.genre === filterGenre
    const matchesSearch = searchTerm === '' || 
      submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.author.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesGenre && matchesSearch
  })

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    switch (sortBy) {
      case 'submittedAt':
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      case 'title':
        return a.title.localeCompare(b.title)
      case 'author':
        return a.author.localeCompare(b.author)
      case 'wordCount':
        return b.wordCount - a.wordCount
      default:
        return 0
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'under_review': return 'bg-blue-100 text-blue-800'
      case 'shortlisted': return 'bg-purple-100 text-purple-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'declined': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAssignReader = (submissionId: string, readerId: string) => {
    // Implement reader assignment logic
    console.log(`Assigning submission ${submissionId} to reader ${readerId}`)
    alert('Reader assignment functionality will be implemented soon!')
  }

  const handleStatusChange = (submissionId: string, newStatus: string) => {
    // Implement status change logic
    console.log(`Changing status of submission ${submissionId} to ${newStatus}`)
    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId ? { ...sub, status: newStatus as any } : sub
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Submission Management</h1>
            <p className="mt-2 text-gray-600">Review, assign, and manage literary submissions</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Genres</option>
                <option value="Literary Fiction">Literary Fiction</option>
                <option value="Short Story">Short Story</option>
                <option value="Science Fiction">Science Fiction</option>
                <option value="Poetry">Poetry</option>
                <option value="Creative Non-fiction">Creative Non-fiction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="submittedAt">Date Submitted</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="wordCount">Word Count</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Submissions ({sortedSubmissions.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{submission.title}</div>
                        <div className="text-sm text-gray-500">{submission.genre} • {submission.wordCount.toLocaleString()} words</div>
                        {submission.isSimultaneous && (
                          <div className="text-xs text-orange-600 mt-1">⚠️ Simultaneous submission</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{submission.author}</div>
                        <div className="text-sm text-gray-500">{submission.email}</div>
                        <div className="text-sm text-gray-500">{new Date(submission.submittedAt).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>📄 {submission.files.length} file(s)</div>
                        {submission.coverLetter && (
                          <div className="mt-1 text-xs text-gray-600">
                            {submission.coverLetter.substring(0, 100)}...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={submission.status}
                        onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(submission.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          View Details
                        </button>
                        {submission.status === 'pending' && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignReader(submission.id, e.target.value)
                                e.target.value = ''
                              }
                            }}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            defaultValue=""
                          >
                            <option value="">Assign Reader</option>
                            {readers.map((reader) => (
                              <option key={reader.id} value={reader.id}>
                                {reader.name} ({reader.currentWorkload}/{reader.maxWorkload})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Submission Details</h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Submission Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {selectedSubmission.title}</div>
                    <div><strong>Author:</strong> {selectedSubmission.author}</div>
                    <div><strong>Email:</strong> {selectedSubmission.email}</div>
                    <div><strong>Genre:</strong> {selectedSubmission.genre}</div>
                    <div><strong>Word Count:</strong> {selectedSubmission.wordCount.toLocaleString()}</div>
                    <div><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedSubmission.status)}`}>
                        {selectedSubmission.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Files</h4>
                  <div className="space-y-2">
                    {selectedSubmission.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium text-sm">{file.fileName}</div>
                          <div className="text-xs text-gray-500">{file.fileType}</div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-900 text-sm">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedSubmission.coverLetter && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Cover Letter</h4>
                  <div className="bg-gray-50 p-4 rounded text-sm max-h-40 overflow-y-auto">
                    {selectedSubmission.coverLetter}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Send to Readers
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}