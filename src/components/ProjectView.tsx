'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Task, Project, Heading } from '@/types/database'
import SchedulePicker, { Schedule } from './SchedulePicker'

type SortOption = 'manual' | 'due_date' | 'schedule' | 'title' | 'created'

const sortOptions: { id: SortOption; label: string; icon: string }[] = [
  { id: 'manual', label: 'Manual', icon: '✋' },
  { id: 'due_date', label: 'Due Date', icon: '🚩' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'title', label: 'Title', icon: '🔤' },
  { id: 'created', label: 'Created', icon: '🕐' },
]

const scheduleOrder: Record<string, number> = {
  today: 1,
  this_week: 2,
  next_week: 3,
  anytime: 4,
  someday: 5,
}

interface ProjectViewProps {
  project: Project
  tasks: Task[]
  headings: Heading[]
  onToggleTask: (taskId: string, completed: boolean) => void
  onScheduleTask: (taskId: string, schedule: Schedule) => void
  onAddTask: (headingId?: string) => void
  onAddHeading: (name: string) => void
  onUpdateProject: (updates: Partial<Project>) => void
  onTaskClick: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onReorderTasks?: (tasks: Task[]) => void
  onDeleteProject?: () => void
  highlightedTaskId?: string | null
}

const scheduleDisplay: Record<string, { icon: string; color: string }> = {
  today: { icon: '⭐', color: 'text-amber-500' },
  this_week: { icon: '📆', color: 'text-blue-500' },
  next_week: { icon: '📅', color: 'text-purple-500' },
  anytime: { icon: '📋', color: 'text-emerald-500' },
  someday: { icon: '📦', color: 'text-amber-300' },
}

export default function ProjectView({
  project,
  tasks,
  headings,
  onToggleTask,
  onScheduleTask,
  onAddTask,
  onAddHeading,
  onUpdateProject,
  onTaskClick,
  onDeleteTask,
  onReorderTasks,
  onDeleteProject,
  highlightedTaskId
}: ProjectViewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [isAddingHeading, setIsAddingHeading] = useState(false)
  const [newHeadingName, setNewHeadingName] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState(project.notes || '')
  const [showCompleted, setShowCompleted] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('manual')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Local state for manual ordering (to work with framer-motion Reorder)
  const [localTaskOrder, setLocalTaskOrder] = useState<string[]>([])

  // Load sort preference from localStorage
  useEffect(() => {
    const savedSort = localStorage.getItem(`pocky_project_sort_${project.id}`)
    if (savedSort) setSortBy(savedSort as SortOption)
  }, [project.id])

  // Save sort preference
  useEffect(() => {
    localStorage.setItem(`pocky_project_sort_${project.id}`, sortBy)
  }, [sortBy, project.id])

  // Sync local task order with tasks prop (when tasks change externally)
  useEffect(() => {
    const activeTasks = tasks.filter(t => t.status !== 'completed')
    const sortedByPosition = [...activeTasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    const newOrder = sortedByPosition.map(t => t.id)
    setLocalTaskOrder(newOrder)
  }, [tasks])

  // Sort function for non-manual modes
  const sortTasks = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortBy) {
        case 'manual':
          // For manual mode, use localTaskOrder
          const aIndex = localTaskOrder.indexOf(a.id)
          const bIndex = localTaskOrder.indexOf(b.id)
          // Put items not in order at the end
          if (aIndex === -1 && bIndex === -1) return 0
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        case 'due_date':
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        case 'schedule':
          const aOrder = a.schedule ? scheduleOrder[a.schedule] || 99 : 99
          const bOrder = b.schedule ? scheduleOrder[b.schedule] || 99 : 99
          return aOrder - bOrder
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })
  }

  // Separate active and completed tasks
  const activeTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  // Group active tasks by heading and apply sorting
  const tasksWithoutHeading = sortTasks(activeTasks.filter(t => !t.heading_id))
  const tasksByHeading = headings.map(heading => ({
    heading,
    tasks: sortTasks(activeTasks.filter(t => t.heading_id === heading.id))
  }))

  // Handle task reordering (for manual sort mode)
  const handleTaskReorder = (reorderedTasks: Task[]) => {
    if (sortBy === 'manual') {
      // Update local order immediately for smooth visual feedback
      const newOrder = reorderedTasks.map(t => t.id)
      setLocalTaskOrder(prev => {
        // Replace only the IDs that were reordered, keeping other IDs in place
        const reorderedIds = new Set(newOrder)
        const otherIds = prev.filter(id => !reorderedIds.has(id))
        // Insert reordered IDs in the right position
        const firstReorderedIndex = prev.findIndex(id => reorderedIds.has(id))
        if (firstReorderedIndex === -1) {
          return [...otherIds, ...newOrder]
        }
        return [
          ...prev.slice(0, firstReorderedIndex).filter(id => !reorderedIds.has(id)),
          ...newOrder,
          ...prev.slice(firstReorderedIndex).filter(id => !reorderedIds.has(id))
        ]
      })

      // Persist to parent with updated positions
      if (onReorderTasks) {
        const updatedTasks = reorderedTasks.map((t, index) => ({
          ...t,
          position: index
        }))
        onReorderTasks(updatedTasks)
      }
    }
  }

  const handleAddHeading = () => {
    if (newHeadingName.trim()) {
      onAddHeading(newHeadingName.trim())
      setNewHeadingName('')
      setIsAddingHeading(false)
    }
  }

  const handleSaveNotes = () => {
    onUpdateProject({ notes })
    setIsEditingNotes(false)
  }

  const TaskItem = ({ task }: { task: Task }) => {
    const isHighlighted = highlightedTaskId === task.id
    const isBeingDragged = draggingTaskId === task.id
    return (
    <div
      draggable
      onDragStart={(e) => {
        console.log('ProjectView drag start:', task.id)
        setDraggingTaskId(task.id)
        e.dataTransfer.setData('taskId', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragEnd={() => setDraggingTaskId(null)}
      className={`flex items-start gap-3 p-4 rounded-xl bg-white border border-stone-200 group cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset transition-all hover:shadow-md hover:border-stone-300 select-none ${
        isHighlighted ? 'bg-yellow-50 ring-2 ring-yellow-400 border-yellow-400' : ''
      } ${isBeingDragged ? 'opacity-50 scale-[0.98] ring-2 ring-blue-400' : ''}`}
      onClick={() => onTaskClick(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onTaskClick(task)
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        onTaskClick(task)
      }}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}${task.status === 'completed' ? ' (completed)' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleTask(task.id, task.status !== 'completed')
        }}
        className="flex-shrink-0 -m-2 p-2 flex items-center justify-center"
        aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
        aria-pressed={task.status === 'completed'}
      >
        <span className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
          task.status === 'completed'
            ? 'bg-blue-500 border-blue-500'
            : 'border-stone-300 hover:border-blue-400'
        }`}>
          {task.status === 'completed' && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      </button>

      {/* Schedule Badge */}
      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
          className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
            task.schedule
              ? `${scheduleDisplay[task.schedule]?.color} bg-stone-100 hover:bg-stone-200`
              : 'text-stone-300 bg-stone-50 hover:bg-stone-100 hover:text-stone-500'
          }`}
          aria-label={task.schedule ? `Scheduled: ${task.schedule.replace('_', ' ')}` : 'Schedule task'}
          aria-expanded={selectedTaskId === task.id}
          aria-haspopup="listbox"
        >
          {task.schedule ? (
            <span className="text-sm" aria-hidden="true">{scheduleDisplay[task.schedule]?.icon}</span>
          ) : (
            <span className="text-sm" aria-hidden="true">📅</span>
          )}
        </button>

        {selectedTaskId === task.id && (
          <SchedulePicker
            currentSchedule={task.schedule as Schedule}
            onSelect={(schedule) => onScheduleTask(task.id, schedule)}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-stone-800 ${task.status === 'completed' ? 'line-through text-stone-400' : ''}`}>
          {task.title}
        </p>
        {task.notes && (
          <p className="text-sm text-stone-400 truncate">{task.notes}</p>
        )}
        {task.deadline && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <span>🚩</span>
            {new Date(task.deadline).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Delete Button - appears on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDeleteTask(task.id)
        }}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
        aria-label="Delete task"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )}

  return (
    <div className="flex-1 bg-white overflow-auto">
      {/* Header */}
      <header className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <span className="text-blue-500">◉</span>
            {project.name}
          </h1>

          <div className="flex items-center gap-2">
            {/* Sort Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                aria-label="Sort tasks"
                aria-expanded={showSortMenu}
                aria-haspopup="listbox"
              >
                <span>{sortOptions.find(o => o.id === sortBy)?.icon}</span>
                <span>{sortOptions.find(o => o.id === sortBy)?.label}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

            <AnimatePresence>
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-stone-200 py-1 w-40"
                    role="listbox"
                    aria-label="Sort options"
                  >
                    {sortOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id)
                          setShowSortMenu(false)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          sortBy === option.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-stone-600 hover:bg-stone-50'
                        }`}
                        role="option"
                        aria-selected={sortBy === option.id}
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                        {sortBy === option.id && (
                          <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
            </div>

            {/* Delete Project Button */}
            {onDeleteProject && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Delete project"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Project Notes */}
        <div className="mt-4">
          {isEditingNotes ? (
            <div className="space-y-2">
              <label htmlFor="project-notes" className="sr-only">Project notes</label>
              <textarea
                id="project-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add project notes..."
                rows={3}
                className="w-full text-sm text-stone-600 placeholder:text-stone-400 resize-none bg-stone-50 rounded-lg p-3 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setNotes(project.notes || '')
                    setIsEditingNotes(false)
                  }}
                  className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-sm text-stone-400 hover:text-stone-600"
            >
              {project.notes || 'Add notes...'}
            </button>
          )}
        </div>
      </header>

      {/* Task List */}
      <div className="px-8">
        {/* Tasks without heading */}
        <div className="space-y-3">
          {tasksWithoutHeading.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>

        {/* Add task button (no heading) */}
        {tasksWithoutHeading.length > 0 || headings.length === 0 ? (
          <button
            onClick={() => onAddTask()}
            className="flex items-center gap-2 px-3 py-3 text-stone-400 hover:text-blue-500 transition-colors"
          >
            <span className="text-xl">+</span>
            <span>New Task</span>
          </button>
        ) : null}

        {/* Headings with tasks */}
        {tasksByHeading.map(({ heading, tasks: headingTasks }) => (
          <div key={heading.id} className="mt-6">
            {/* Heading title */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-blue-600">{heading.name}</h2>
              <button
                className="text-stone-300 hover:text-stone-500"
                aria-label={`Options for ${heading.name}`}
              >
                <span aria-hidden="true">•••</span>
              </button>
            </div>

            {/* Tasks in this heading */}
            <div className="space-y-3">
              {headingTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>

            {/* Add task to heading */}
            <button
              onClick={() => onAddTask(heading.id)}
              className="flex items-center gap-2 px-3 py-2 text-stone-400 hover:text-blue-500 transition-colors text-sm"
            >
              <span>+</span>
              <span>Add task</span>
            </button>
          </div>
        ))}

        {/* Add Heading */}
        <div className="mt-8 mb-8">
          {isAddingHeading ? (
            <div className="flex items-center gap-2">
              <label htmlFor="new-heading-name" className="sr-only">Heading name</label>
              <input
                id="new-heading-name"
                type="text"
                value={newHeadingName}
                onChange={(e) => setNewHeadingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddHeading()
                  if (e.key === 'Escape') {
                    setIsAddingHeading(false)
                    setNewHeadingName('')
                  }
                }}
                placeholder="Heading name"
                className="flex-1 text-lg font-semibold text-blue-600 placeholder:text-blue-300 border-b-2 border-blue-200 pb-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-sm"
                autoFocus
              />
              <button
                onClick={handleAddHeading}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingHeading(false)
                  setNewHeadingName('')
                }}
                className="px-3 py-1 text-sm text-stone-500 hover:text-stone-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingHeading(true)}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
            >
              <span>+</span>
              <span>Add Heading</span>
            </button>
          )}
        </div>

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div className="mt-8 mb-8 border-t border-stone-200 pt-4">
            <motion.button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors"
              aria-expanded={showCompleted}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.svg
                animate={{ rotate: showCompleted ? 90 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </motion.svg>
              <span className="font-medium">Completed</span>
              <span className="text-sm text-stone-400">({completedTasks.length})</span>
            </motion.button>

            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-3">
                    {completedTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <TaskItem task={task} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md pointer-events-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-800">Delete Project?</h2>
                    <p className="text-sm text-stone-500">This action cannot be undone</p>
                  </div>
                </div>

                <p className="text-stone-600 mb-6">
                  Are you sure you want to delete <strong>{project.name}</strong> and all {tasks.length} task{tasks.length !== 1 ? 's' : ''}?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 text-stone-600 hover:bg-stone-100 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDeleteProject?.()
                      setShowDeleteConfirm(false)
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
