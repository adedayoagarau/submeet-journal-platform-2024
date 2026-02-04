'use client'

import { useState } from 'react'
import { useSession } from "next-auth/react"

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'file' | 'select' | 'checkbox'
  label: string
  required: boolean
  options?: string[]
  accept?: string
  maxLength?: number
}

export default function FormBuilder({ onSave }: { onSave: (fields: FormField[]) => void }) {
  const [fields, setFields] = useState<FormField[]>([])
  const [draggedField, setDraggedField] = useState<string | null>(null)

  const fieldTypes = [
    { type: 'text', label: 'Text Field', icon: '📝' },
    { type: 'textarea', label: 'Long Text', icon: '📄' },
    { type: 'file', label: 'File Upload', icon: '📎' },
    { type: 'select', label: 'Dropdown', icon: '📋' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  ]

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: `New ${type} field`,
      required: false,
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
      accept: type === 'file' ? '.doc,.docx,.pdf,.txt,.rtf' : undefined,
    }
    setFields([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ))
  }

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id))
  }

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields]
    const [movedField] = newFields.splice(fromIndex, 1)
    newFields.splice(toIndex, 0, movedField)
    setFields(newFields)
  }

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedField(fieldId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedField) return

    const draggedIndex = fields.findIndex(f => f.id === draggedField)
    const targetIndex = fields.findIndex(f => f.id === targetId)
    
    if (draggedIndex !== targetIndex) {
      moveField(draggedIndex, targetIndex)
    }
    setDraggedField(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Builder</h3>
        <p className="text-sm text-gray-600">Drag and drop fields to build your submission form</p>
      </div>
      
      <div className="p-6">
        {/* Field Type Selector */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add Field</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {fieldTypes.map((fieldType) => (
              <button
                key={fieldType.type}
                onClick={() => addField(fieldType.type as FormField['type'])}
                className="flex flex-col items-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <span className="text-2xl mb-1">{fieldType.icon}</span>
                <span className="text-sm font-medium text-gray-700">{fieldType.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              draggable
              onDragStart={(e) => handleDragStart(e, field.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, field.id)}
              className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-indigo-300 cursor-move"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{fieldTypes.find(ft => ft.type === field.type)?.icon}</span>
                  <span className="font-medium text-gray-700">{fieldTypes.find(ft => ft.type === field.type)?.label}</span>
                  {field.required && <span className="text-red-500 text-sm">*</span>}
                </div>
                <button
                  onClick={() => removeField(field.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Field label"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                </div>
                
                {field.type === 'file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accepted file types</label>
                    <input
                      type="text"
                      value={field.accept || ''}
                      onChange={(e) => updateField(field.id, { accept: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder=".doc,.docx,.pdf"
                    />
                  </div>
                )}
                
                {field.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                    <textarea
                      value={field.options?.join('\n') || ''}
                      onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Option 1\nOption 2\nOption 3"
                    />
                  </div>
                )}
                
                {(field.type === 'text' || field.type === 'textarea') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max length (optional)</label>
                    <input
                      type="number"
                      value={field.maxLength || ''}
                      onChange={(e) => updateField(field.id, { maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="500"
                      min="1"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No fields added yet</p>
              <p className="text-sm mt-2">Click on a field type above to add your first field</p>
            </div>
          )}
        </div>
        
        {fields.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {fields.length} field{fields.length !== 1 ? 's' : ''} added
            </p>
            <button
              onClick={() => onSave(fields)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              Save Form
            </button>
          </div>
        )}
      </div>
    </div>
  )
}