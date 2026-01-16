'use client'

import { useState, useRef, useEffect } from 'react'

interface TaskInputProps {
  onSubmit: (title: string) => void
  onCancel: () => void
  placeholder?: string
}

export default function TaskInput({ onSubmit, onCancel, placeholder = "New task" }: TaskInputProps) {
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onSubmit(title.trim())
      setTitle('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="w-5 h-5 rounded-full border-2 border-stone-300 flex-shrink-0" aria-hidden="true" />
      <label htmlFor="task-input" className="sr-only">Task title</label>
      <input
        ref={inputRef}
        id="task-input"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 rounded"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-sm text-stone-500 hover:text-stone-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </form>
  )
}
