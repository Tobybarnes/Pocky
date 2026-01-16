'use client'

import { useState, useRef, useEffect } from 'react'

interface TaskModalProps {
  onSubmit: (task: { title: string; notes: string; deadline: string | null }) => void
  onCancel: () => void
  initialTitle?: string
  initialNotes?: string
  initialDeadline?: string | null
}

export default function TaskModal({
  onSubmit,
  onCancel,
  initialTitle = '',
  initialNotes = '',
  initialDeadline = null
}: TaskModalProps) {
  const [title, setTitle] = useState(initialTitle)
  const [notes, setNotes] = useState(initialNotes)
  const [deadline, setDeadline] = useState(initialDeadline || '')
  const [showDeadline, setShowDeadline] = useState(!!initialDeadline)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onSubmit({
        title: title.trim(),
        notes: notes.trim(),
        deadline: deadline || null
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Input area */}
          <div className="p-6 space-y-4">
            {/* Title */}
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full border-2 border-stone-300 flex-shrink-0 mt-1" aria-hidden="true" />
              <div className="flex-1">
                <label htmlFor="modal-task-title" className="sr-only">Task title</label>
                <input
                  ref={inputRef}
                  id="modal-task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What do you want to do?"
                  className="w-full text-lg text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1"
                  autoFocus
                />
              </div>
            </div>

            {/* Notes */}
            <div className="pl-10">
              <label htmlFor="modal-task-notes" className="sr-only">Task notes</label>
              <textarea
                id="modal-task-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
                className="w-full text-sm text-stone-600 placeholder:text-stone-400 resize-none bg-stone-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Deadline */}
            <div className="pl-10 flex items-center gap-2">
              {showDeadline ? (
                <div className="flex items-center gap-2">
                  <label htmlFor="modal-deadline" className="text-sm text-stone-500">Deadline:</label>
                  <input
                    id="modal-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="text-sm text-stone-700 border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeadline(false)
                      setDeadline('')
                    }}
                    className="text-stone-400 hover:text-stone-600"
                    aria-label="Remove deadline"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeadline(true)}
                  className="text-sm text-stone-400 hover:text-stone-600 flex items-center gap-1"
                >
                  <span>🚩</span>
                  <span>Add deadline</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
