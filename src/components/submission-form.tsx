'use client'

import { useState } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'file' | 'select' | 'checkbox'
  label: string
  required: boolean
  options?: string[]
  accept?: string
  maxLength?: number
}

interface FormData {
  [key: string]: string | File[]
}

export default function SubmissionForm({ 
  formId, 
  fields, 
  publicationName 
}: { 
  formId: string
  fields: FormField[]
  publicationName: string
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({})
  const [files, setFiles] = useState<{ [key: string]: File[] }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }))
    }
  }

  const handleFileChange = (fieldId: string, selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles)
    setFiles(prev => ({ ...prev, [fieldId]: fileArray }))
    setFormData(prev => ({ ...prev, [fieldId]: fileArray }))
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    
    fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`
      }
      
      if (field.type === 'file' && field.required && (!files[field.id] || files[field.id].length === 0)) {
        newErrors[field.id] = `${field.label} is required`
      }
      
      if (field.maxLength && formData[field.id] && (formData[field.id] as string).length > field.maxLength) {
        newErrors[field.id] = `${field.label} must be less than ${field.maxLength} characters`
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      alert('Please sign in to submit')
      return
    }
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Create submission
      const submissionResponse = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          title: formData.title || 'Untitled',
          genre: formData.genre,
          wordCount: formData.wordCount ? parseInt(formData.wordCount) : null,
          coverLetter: formData.coverLetter,
          authorBio: formData.authorBio,
          // Other form data
        }),
      })
      
      if (!submissionResponse.ok) {
        throw new Error('Failed to create submission')
      }
      
      const { submission } = await submissionResponse.json()
      
      // Upload files if any
      if (Object.keys(files).length > 0) {
        const fileUploadPromises = Object.entries(files).map(async ([fieldId, fileList]) => {
          const uploadPromises = fileList.map(async (file) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('submissionId', submission.id)
            formData.append('fieldId', fieldId)
            
            return fetch('/api/upload', {
              method: 'POST',
              body: formData,
            })
          })
          
          return Promise.all(uploadPromises)
        })
        
        await Promise.all(fileUploadPromises)
      }
      
      router.push(`/submissions/${submission.id}?success=true`)
      
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.id,
      name: field.id,
      required: field.required,
      className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        errors[field.id] ? 'border-red-500' : 'border-gray-300'
      }`,
    }

    switch (field.type) {
      case 'text':
        return (
          <div>
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              {...commonProps}
              maxLength={field.maxLength}
              value={formData[field.id] as string || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
            {errors[field.id] && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
          </div>
        )
        
      case 'textarea':
        return (
          <div>
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              {...commonProps}
              maxLength={field.maxLength}
              rows={4}
              value={formData[field.id] as string || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
            {errors[field.id] && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
          </div>
        )
        
      case 'file':
        return (
          <div>
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="file"
              {...commonProps}
              multiple
              accept={field.accept}
              onChange={(e) => handleFileChange(field.id, e.target.files!)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors[field.id] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {field.accept && (
              <p className="text-xs text-gray-500 mt-1">
                Accepted file types: {field.accept}
              </p>
            )}
            {files[field.id] && files[field.id].length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Selected files:</p>
                <ul className="text-sm text-gray-600 mt-1">
                  {files[field.id].map((file, index) => (
                    <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                  ))}
                </ul>
              </div>
            )}
            {errors[field.id] && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
          </div>
        )
        
      case 'select':
        return (
          <div>
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              {...commonProps}
              value={formData[field.id] as string || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            {errors[field.id] && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
          </div>
        )
        
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.id}
              name={field.id}
              required={field.required}
              className="mr-2"
              onChange={(e) => handleInputChange(field.id, e.target.checked ? 'true' : '')}
            />
            <label htmlFor={field.id} className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {errors[field.id] && <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>}
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Submit to {publicationName}</h2>
          <p className="text-indigo-100 mt-1">Please fill out all required fields</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {fields.map((field) => (
            <div key={field.id}>
              {renderField(field)}
            </div>
          ))}
          
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="text-red-500">*</span> Required fields
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}