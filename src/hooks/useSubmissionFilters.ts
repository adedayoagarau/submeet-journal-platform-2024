import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Filter, SortAsc, SortDesc } from 'lucide-react'

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  status?: string[]
  genre?: string[]
  dateRange?: { start: Date; end: Date }
  wordCountRange?: { min: number; max: number }
  publication?: string[]
}

export function useSubmissionFilters(submissions: any[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'submittedAt',
    direction: 'desc'
  })
  
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({})
  const [searchQuery, setSearchQuery] = useState('')

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          submission.title?.toLowerCase().includes(query) ||
          submission.author?.toLowerCase().includes(query) ||
          submission.genre?.toLowerCase().includes(query) ||
          submission.form?.publication?.name?.toLowerCase().includes(query)
        
        if (!matchesSearch) return false
      }

      // Status filter
      if (filterConfig.status?.length && !filterConfig.status.includes(submission.status)) {
        return false
      }

      // Genre filter
      if (filterConfig.genre?.length && !filterConfig.genre.includes(submission.genre)) {
        return false
      }

      // Date range filter
      if (filterConfig.dateRange) {
        const submittedDate = new Date(submission.submittedAt)
        if (submittedDate < filterConfig.dateRange.start || 
            submittedDate > filterConfig.dateRange.end) {
          return false
        }
      }

      // Word count filter
      if (filterConfig.wordCountRange && submission.wordCount) {
        if (submission.wordCount < filterConfig.wordCountRange.min ||
            submission.wordCount > filterConfig.wordCountRange.max) {
          return false
        }
      }

      // Publication filter
      if (filterConfig.publication?.length) {
        const pubId = submission.form?.publication?.id
        if (!pubId || !filterConfig.publication.includes(pubId)) {
          return false
        }
      }

      return true
    })
  }, [submissions, filterConfig, searchQuery])

  // Sort submissions
  const sortedSubmissions = useMemo(() => {
    const sorted = [...filteredSubmissions]
    
    sorted.sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortConfig.key) {
        case 'submittedAt':
          aVal = new Date(a.submittedAt).getTime()
          bVal = new Date(b.submittedAt).getTime()
          break
        case 'title':
          aVal = a.title?.toLowerCase() || ''
          bVal = b.title?.toLowerCase() || ''
          break
        case 'author':
          aVal = a.author?.toLowerCase() || ''
          bVal = b.author?.toLowerCase() || ''
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'genre':
          aVal = a.genre?.toLowerCase() || ''
          bVal = b.genre?.toLowerCase() || ''
          break
        case 'wordCount':
          aVal = a.wordCount || 0
          bVal = b.wordCount || 0
          break
        case 'publication':
          aVal = a.form?.publication?.name?.toLowerCase() || ''
          bVal = b.form?.publication?.name?.toLowerCase() || ''
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredSubmissions, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const clearFilters = () => {
    setFilterConfig({})
    setSearchQuery('')
  }

  const activeFiltersCount = Object.values(filterConfig).filter(
    v => Array.isArray(v) ? v.length > 0 : v !== undefined
  ).length + (searchQuery ? 1 : 0)

  return {
    sortedSubmissions,
    sortConfig,
    filterConfig,
    searchQuery,
    activeFiltersCount,
    handleSort,
    setFilterConfig,
    setSearchQuery,
    clearFilters
  }
}

export function SortButton({ 
  label, 
  sortKey, 
  currentSort, 
  onSort 
}: { 
  label: string
  sortKey: string
  currentSort: SortConfig
  onSort: (key: string) => void
}) {
  const isActive = currentSort.key === sortKey
  
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-indigo-100 text-indigo-700' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span>{label}</span>
      {isActive && (
        currentSort.direction === 'asc' ? 
          <SortAsc className="w-4 h-4" /> : 
          <SortDesc className="w-4 h-4" />
      )}
    </button>
  )
}

export function FilterDropdown({
  label,
  options,
  selected,
  onChange
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
          selected.length > 0
            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
            {selected.length}
          </span>
        )}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selected, option.value])
                    } else {
                      onChange(selected.filter(v => v !== option.value))
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'withdrawn', label: 'Withdrawn' }
]

export const genreOptions = [
  { value: 'Fiction', label: 'Fiction' },
  { value: 'Non-Fiction', label: 'Non-Fiction' },
  { value: 'Poetry', label: 'Poetry' },
  { value: 'Short Story', label: 'Short Story' },
  { value: 'Essay', label: 'Essay' },
  { value: 'Memoir', label: 'Memoir' },
  { value: 'Science Fiction', label: 'Science Fiction' },
  { value: 'Fantasy', label: 'Fantasy' },
  { value: 'Literary Fiction', label: 'Literary Fiction' },
  { value: 'Creative Non-fiction', label: 'Creative Non-fiction' }
]
