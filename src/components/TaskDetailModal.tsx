'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Task, Project } from '@/types/database'
import { Schedule } from './SchedulePicker'

interface TaskDetailModalProps {
  task: Task
  projects: Project[]
  onUpdate: (updates: Partial<Task>) => void
  onDelete: () => void
  onConvertToProject: () => void
  onClose: () => void
}

const scheduleOptions: { id: Schedule; label: string; icon: string; color: string }[] = [
  { id: 'today', label: 'Today', icon: '⭐', color: 'text-amber-500' },
  { id: 'this_week', label: 'This Week', icon: '📆', color: 'text-blue-500' },
  { id: 'next_week', label: 'Next Week', icon: '📅', color: 'text-purple-500' },
  { id: 'anytime', label: 'Anytime', icon: '📋', color: 'text-emerald-500' },
  { id: 'someday', label: 'Someday', icon: '📦', color: 'text-amber-300' },
]

// Helper to get dates (weeks start on Monday)
function getDateForSchedule(scheduleId: Schedule): string {
  const today = new Date()
  // Calculate days until Sunday (end of week when week starts on Monday)
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  const daysUntilSunday = (7 - today.getDay()) % 7

  switch (scheduleId) {
    case 'today':
      return today.toISOString().split('T')[0]
    case 'this_week': {
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + daysUntilSunday)
      return endOfWeek.toISOString().split('T')[0]
    }
    case 'next_week': {
      const nextWeekEnd = new Date(today)
      nextWeekEnd.setDate(today.getDate() + daysUntilSunday + 7)
      return nextWeekEnd.toISOString().split('T')[0]
    }
    default:
      return ''
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function TaskDetailModal({
  task,
  projects,
  onUpdate,
  onDelete,
  onConvertToProject,
  onClose
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes || '')
  const [schedule, setSchedule] = useState<Schedule>(task.schedule as Schedule)
  const [scheduledDate, setScheduledDate] = useState(task.scheduled_date || '')
  const [deadline, setDeadline] = useState(task.deadline || '')
  const [projectId, setProjectId] = useState(task.project_id || '')
  const [showWhenPicker, setShowWhenPicker] = useState(false)
  const [showCompleteMenu, setShowCompleteMenu] = useState(false)
  const whenRef = useRef<HTMLDivElement>(null)

  // Close when picker on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (whenRef.current && !whenRef.current.contains(e.target as Node)) {
        setShowWhenPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleScheduleSelect = (scheduleId: Schedule) => {
    setSchedule(scheduleId)
    if (scheduleId && scheduleId !== 'anytime' && scheduleId !== 'someday') {
      setScheduledDate(getDateForSchedule(scheduleId))
    }
    setShowWhenPicker(false)
  }

  const handleDateSelect = (date: string) => {
    setScheduledDate(date)
    // Auto-determine schedule based on date (weeks start on Monday)
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get the Monday of the current week
    const dayOfWeek = today.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Sunday = 6 days from Monday
    const thisWeekMonday = new Date(today)
    thisWeekMonday.setDate(today.getDate() - daysFromMonday)

    // Get end of this week (Sunday) and next week (following Sunday)
    const thisWeekSunday = new Date(thisWeekMonday)
    thisWeekSunday.setDate(thisWeekMonday.getDate() + 6)
    const nextWeekSunday = new Date(thisWeekMonday)
    nextWeekSunday.setDate(thisWeekMonday.getDate() + 13)

    const diffDays = Math.ceil((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      setSchedule('today')
    } else if (selectedDate >= thisWeekMonday && selectedDate <= thisWeekSunday) {
      setSchedule('this_week')
    } else if (selectedDate > thisWeekSunday && selectedDate <= nextWeekSunday) {
      setSchedule('next_week')
    } else {
      setSchedule('anytime')
    }
    setShowWhenPicker(false)
  }

  const handleSave = () => {
    onUpdate({
      title,
      notes: notes || null,
      schedule,
      scheduled_date: scheduledDate || null,
      deadline: deadline || null,
      project_id: projectId || null,
    })
    onClose()
  }

  const handleComplete = () => {
    onUpdate({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    onClose()
  }

  const handleCancel = () => {
    onUpdate({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
    })
    onClose()
  }

  const clearSchedule = () => {
    setSchedule('anytime')
    setScheduledDate('')
    setShowWhenPicker(false)
  }

  // Get display text for When button
  const getWhenDisplay = () => {
    if (schedule) {
      const option = scheduleOptions.find(o => o.id === schedule)
      if (option) {
        return {
          icon: option.icon,
          label: scheduledDate ? `${option.label} · ${formatDate(scheduledDate)}` : option.label,
          color: option.color
        }
      }
    }
    return { icon: '📅', label: 'When', color: 'text-stone-400' }
  }

  const whenDisplay = getWhenDisplay()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-start gap-4">
            <button
              onClick={handleComplete}
              className="flex-shrink-0 -m-2 p-2 mt-1 flex items-center justify-center"
              aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
              aria-pressed={task.status === 'completed'}
            >
              <span className={`w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center ${
                task.status === 'completed'
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-stone-300 hover:border-blue-400'
              }`}>
                {task.status === 'completed' && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </button>
            <div className="flex-1">
              <label htmlFor="detail-task-title" className="sr-only">Task title</label>
              <input
                id="detail-task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1"
                placeholder="Task title"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Notes */}
          <div>
            <label htmlFor="detail-task-notes" className="sr-only">Task notes</label>
            <textarea
              id="detail-task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={2}
              className="w-full text-sm text-stone-700 placeholder:text-stone-400 resize-none bg-stone-50 rounded-lg p-3 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* When Picker */}
          <div className="relative" ref={whenRef}>
            <button
              onClick={() => setShowWhenPicker(!showWhenPicker)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all w-full ${
                schedule
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
              aria-expanded={showWhenPicker}
              aria-haspopup="listbox"
              aria-label={`Schedule: ${whenDisplay.label}`}
            >
              <span className={`text-lg ${whenDisplay.color}`} aria-hidden="true">{whenDisplay.icon}</span>
              <span className={`text-sm font-medium ${schedule ? 'text-blue-700' : 'text-stone-500'}`}>
                {whenDisplay.label}
              </span>
              <svg className="w-4 h-4 ml-auto text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* When Dropdown */}
            {showWhenPicker && (
              <div
                className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 z-50 overflow-hidden"
                role="listbox"
                aria-label="Schedule options"
              >
                {/* Schedule Options */}
                <div className="p-2">
                  {scheduleOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleScheduleSelect(option.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        schedule === option.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                      role="option"
                      aria-selected={schedule === option.id}
                    >
                      <span className={`text-lg ${option.color}`} aria-hidden="true">{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                      {schedule === option.id && (
                        <svg className="w-4 h-4 ml-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-stone-100" />

                {/* Date Picker */}
                <div className="p-3">
                  <label className="text-xs font-medium text-stone-500 mb-2 block" id="schedule-date-label">Or pick a date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    className="w-full text-sm text-stone-700 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-labelledby="schedule-date-label"
                  />
                </div>

                {/* Clear */}
                {schedule && (
                  <>
                    <div className="border-t border-stone-100" />
                    <button
                      onClick={clearSchedule}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-stone-500 hover:bg-stone-50"
                      aria-label="Clear schedule"
                    >
                      <span aria-hidden="true">✕</span>
                      <span>Clear</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-stone-200 bg-white">
            <span className="text-lg" aria-hidden="true">🚩</span>
            <span className="text-sm text-stone-500" id="deadline-label">Deadline</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="ml-auto text-sm text-stone-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              aria-labelledby="deadline-label"
            />
          </div>

          {/* Project */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-stone-200 bg-white">
            <span className="text-lg" aria-hidden="true">📁</span>
            <span className="text-sm text-stone-500" id="project-label">Project</span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="ml-auto text-sm text-stone-700 bg-transparent text-right focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              aria-labelledby="project-label"
            >
              <option value="">None</option>
              {projects
                .filter((project) => project.status !== 'completed')
                .map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Divider */}
          <div className="border-t border-stone-100 my-2" />

          {/* Actions */}
          <div className="space-y-1">
            {/* Complete submenu */}
            <div className="relative">
              <button
                onClick={() => setShowCompleteMenu(!showCompleteMenu)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 rounded-lg"
                aria-expanded={showCompleteMenu}
                aria-haspopup="menu"
              >
                <span className="text-green-500" aria-hidden="true">✓</span>
                <span>Complete</span>
                <span className="ml-auto text-stone-400" aria-hidden="true">›</span>
              </button>

              {showCompleteMenu && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-10" role="menu">
                  <button
                    onClick={handleComplete}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                    role="menuitem"
                  >
                    <span className="text-green-500" aria-hidden="true">✓</span>
                    Mark as Completed
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
                    role="menuitem"
                  >
                    <span className="text-red-500" aria-hidden="true">✕</span>
                    Mark as Canceled
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onDelete}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg"
            >
              <span aria-hidden="true">🗑️</span>
              <span>Delete Task</span>
            </button>

            {/* Convert to Project button */}
            <button
              onClick={onConvertToProject}
              className="w-full mt-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Convert to Project
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-100">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
          >
            Save Changes
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
