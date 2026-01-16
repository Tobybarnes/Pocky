'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar, { View } from '@/components/Sidebar'
import TaskList from '@/components/TaskList'
import ProjectView from '@/components/ProjectView'
import TaskModal from '@/components/TaskModal'
import TaskDetailModal from '@/components/TaskDetailModal'
import { Task, Project, Area, Heading } from '@/types/database'
import { seedTasks, seedProjects } from '@/lib/seedData'
import { generateEmoji } from '@/utils/emoji'

// Keyboard shortcuts configuration
const keyboardShortcuts = [
  { key: '1', label: 'Today', action: 'today' },
  { key: '2', label: 'This Week', action: 'this_week' },
  { key: '3', label: 'Next Week', action: 'next_week' },
  { key: '4', label: 'Anytime', action: 'anytime' },
  { key: '5', label: 'Someday', action: 'someday' },
  { key: '6', label: 'Logbook', action: 'logbook' },
  { key: 'n', label: 'New Task', action: 'new_task' },
  { key: 'p', label: 'New Project', action: 'new_project' },
  { key: 'f', label: 'Search', action: 'search' },
  { key: '?', label: 'Show Shortcuts', action: 'help' },
]

// Keyboard shortcuts help modal
function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      >
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md pointer-events-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-800">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Navigation</div>
            {keyboardShortcuts.filter(s => ['1','2','3','4','5','6'].includes(s.key)).map(shortcut => (
              <div key={shortcut.key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-stone-50">
                <span className="text-stone-700">{shortcut.label}</span>
                <kbd className="px-2 py-1 bg-stone-100 rounded text-sm font-mono text-stone-600">
                  {'\u2318'}{shortcut.key}
                </kbd>
              </div>
            ))}

            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mt-4 mb-2">Actions</div>
            {keyboardShortcuts.filter(s => ['n','p','f','?'].includes(s.key)).map(shortcut => (
              <div key={shortcut.key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-stone-50">
                <span className="text-stone-700">{shortcut.label}</span>
                <kbd className="px-2 py-1 bg-stone-100 rounded text-sm font-mono text-stone-600">
                  {'\u2318'}{shortcut.key.toUpperCase()}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-stone-200">
            <p className="text-sm text-stone-400 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-stone-100 rounded text-xs font-mono">Esc</kbd> to close
            </p>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// Spotlight-style search modal
function SpotlightSearch({
  tasks,
  projects,
  onSelect,
  onClose
}: {
  tasks: Task[]
  projects: Project[]
  onSelect: (task: Task, projectId: string | null) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filter tasks based on query
  const filteredTasks = query.trim()
    ? tasks.filter(task =>
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.notes?.toLowerCase().includes(query.toLowerCase())
      )
    : []

  // Group results by project
  const groupedResults = filteredTasks.reduce((acc, task) => {
    const projectId = task.project_id || '__no_project__'
    if (!acc[projectId]) {
      acc[projectId] = []
    }
    acc[projectId].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  // Flatten for keyboard navigation
  const flatResults = filteredTasks

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
        e.preventDefault()
        const task = flatResults[selectedIndex]
        onSelect(task, task.project_id)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flatResults, selectedIndex, onSelect, onClose])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const getProjectName = (projectId: string | null) => {
    if (!projectId || projectId === '__no_project__') return 'No Project'
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project'
  }

  const scheduleIcons: Record<string, string> = {
    today: '⭐',
    this_week: '📆',
    next_week: '📅',
    anytime: '📋',
    someday: '📦',
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-x-0 top-[20%] flex justify-center z-50 px-4"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-200/50">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-stone-200/50">
            <svg className="w-6 h-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1 text-lg bg-transparent outline-none text-stone-800 placeholder:text-stone-400"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-stone-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {query && filteredTasks.length === 0 ? (
              <div className="px-4 py-8 text-center text-stone-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No tasks found for &quot;{query}&quot;</p>
              </div>
            ) : (
              Object.entries(groupedResults).map(([projectId, projectTasks]) => (
                <div key={projectId}>
                  <div className="px-4 py-2 bg-stone-50 text-xs font-semibold text-stone-500 uppercase tracking-wider sticky top-0">
                    {getProjectName(projectId)}
                  </div>
                  {projectTasks.map((task) => {
                    const globalIndex = flatResults.findIndex(t => t.id === task.id)
                    const isSelected = globalIndex === selectedIndex
                    return (
                      <motion.button
                        key={task.id}
                        onClick={() => onSelect(task, task.project_id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-stone-50'
                        }`}
                        whileHover={{ x: 2 }}
                      >
                        <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                          task.status === 'completed'
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-stone-300'
                        }`}>
                          {task.status === 'completed' && (
                            <svg className="w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${
                            task.status === 'completed' ? 'text-stone-400 line-through' : 'text-stone-800'
                          }`}>
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="text-sm text-stone-400 truncate">{task.notes}</p>
                          )}
                        </div>
                        {task.schedule && (
                          <span className="text-lg flex-shrink-0">
                            {scheduleIcons[task.schedule] || '📋'}
                          </span>
                        )}
                        {isSelected && (
                          <kbd className="px-2 py-0.5 bg-stone-200 rounded text-xs text-stone-500 flex-shrink-0">
                            ↵
                          </kbd>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {filteredTasks.length > 0 && (
            <div className="px-4 py-2 border-t border-stone-200/50 bg-stone-50 flex items-center justify-between text-xs text-stone-400">
              <span>{filteredTasks.length} result{filteredTasks.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-3">
                <span><kbd className="px-1.5 py-0.5 bg-white rounded shadow-sm">↑↓</kbd> navigate</span>
                <span><kbd className="px-1.5 py-0.5 bg-white rounded shadow-sm">↵</kbd> select</span>
                <span><kbd className="px-1.5 py-0.5 bg-white rounded shadow-sm">esc</kbd> close</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

const viewConfig: Record<string, { title: string; icon: string }> = {
  today: { title: 'Today', icon: '⭐' },
  this_week: { title: 'This Week', icon: '📆' },
  next_week: { title: 'Next Week', icon: '📅' },
  anytime: { title: 'Anytime', icon: '📋' },
  someday: { title: 'Someday', icon: '📦' },
  logbook: { title: 'Logbook', icon: '✅' },
}

// Local storage keys
const TASKS_KEY = 'pocky_tasks'
const PROJECTS_KEY = 'pocky_projects'
const AREAS_KEY = 'pocky_areas'
const HEADINGS_KEY = 'pocky_headings'

export default function Home() {
  const [activeView, setActiveView] = useState<View>('today')
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [headings, setHeadings] = useState<Heading[]>([])
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [addingTaskHeadingId, setAddingTaskHeadingId] = useState<string | undefined>()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [isAddingProjectViaShortcut, setIsAddingProjectViaShortcut] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)

  // Load data from localStorage on mount, or seed with initial data
  useEffect(() => {
    const savedTasks = localStorage.getItem(TASKS_KEY)
    const savedProjects = localStorage.getItem(PROJECTS_KEY)
    const savedAreas = localStorage.getItem(AREAS_KEY)
    const savedHeadings = localStorage.getItem(HEADINGS_KEY)

    // Force reload seed data with Reminders import (set to false after first load)
    const FORCE_RESEED = false
    if (FORCE_RESEED || (!savedTasks && !savedProjects)) {
      setTasks(seedTasks)
      setProjects(seedProjects)
      localStorage.setItem(TASKS_KEY, JSON.stringify(seedTasks))
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(seedProjects))
    } else {
      if (savedTasks) setTasks(JSON.parse(savedTasks))
      if (savedProjects) setProjects(JSON.parse(savedProjects))
    }

    if (savedAreas) setAreas(JSON.parse(savedAreas))
    if (savedHeadings) setHeadings(JSON.parse(savedHeadings))

    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
    }
  }, [tasks, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
    }
  }, [projects, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(AREAS_KEY, JSON.stringify(areas))
    }
  }, [areas, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(HEADINGS_KEY, JSON.stringify(headings))
    }
  }, [headings, isLoaded])

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    // Handle Escape key
    if (e.key === 'Escape') {
      setShowShortcutsHelp(false)
      setShowSearch(false)
      setSelectedTask(null)
      setIsAddingTask(false)
      setHighlightedTaskId(null)
      return
    }

    // Only handle shortcuts with Command/Meta key
    if (!e.metaKey) return

    const key = e.key.toLowerCase()

    // Navigation shortcuts
    if (key === '1') {
      e.preventDefault()
      setActiveView('today')
    } else if (key === '2') {
      e.preventDefault()
      setActiveView('this_week')
    } else if (key === '3') {
      e.preventDefault()
      setActiveView('next_week')
    } else if (key === '4') {
      e.preventDefault()
      setActiveView('anytime')
    } else if (key === '5') {
      e.preventDefault()
      setActiveView('someday')
    } else if (key === '6') {
      e.preventDefault()
      setActiveView('logbook')
    }
    // Action shortcuts
    else if (key === 'n') {
      e.preventDefault()
      setIsAddingTask(true)
    } else if (key === 'p') {
      e.preventDefault()
      setIsAddingProjectViaShortcut(true)
    } else if (key === 'f') {
      e.preventDefault()
      setShowSearch(true)
    } else if (key === '/' || e.key === '?') {
      e.preventDefault()
      setShowShortcutsHelp(prev => !prev)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Filter tasks based on current view
  const filteredTasks = tasks.filter(task => {
    if (activeView.startsWith('project:')) {
      const projectId = activeView.replace('project:', '')
      // Include all tasks for project view (completed will be shown in collapsible section)
      return task.project_id === projectId
    }

    switch (activeView) {
      case 'today':
        return task.schedule === 'today' && task.status !== 'completed'
      case 'this_week':
        return task.schedule === 'this_week' && task.status !== 'completed'
      case 'next_week':
        return task.schedule === 'next_week' && task.status !== 'completed'
      case 'anytime':
        return task.schedule === 'anytime' && task.status !== 'completed'
      case 'someday':
        return task.schedule === 'someday' && task.status !== 'completed'
      case 'logbook':
        return task.status === 'completed'
      default:
        return false
    }
  }).sort((a, b) => {
    // Sort logbook by most recently completed/updated first
    if (activeView === 'logbook') {
      const aDate = a.completed_at || a.updated_at
      const bDate = b.completed_at || b.updated_at
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    }
    return 0
  })

  // Get headings for current project
  const currentProjectId = activeView.startsWith('project:') ? activeView.replace('project:', '') : null
  const projectHeadings = currentProjectId
    ? headings.filter(h => h.project_id === currentProjectId)
    : []

  function handleCreateProject(name: string, areaId?: string) {
    const newProject: Project = {
      id: crypto.randomUUID(),
      user_id: 'demo',
      area_id: areaId || null,
      name,
      emoji: generateEmoji(name),
      notes: null,
      position: projects.length,
      status: 'active',
      deadline: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    }
    setProjects([...projects, newProject])
    setActiveView(`project:${newProject.id}`)
  }

  function handleUpdateProjectEmoji(projectId: string, emoji: string) {
    setProjects(projects.map(project =>
      project.id === projectId
        ? { ...project, emoji, updated_at: new Date().toISOString() }
        : project
    ))
  }

  function handleAddTask(taskData: { title: string; notes: string; deadline: string | null }) {
    const isProjectView = activeView.startsWith('project:')
    const projectId = isProjectView ? activeView.replace('project:', '') : null

    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: 'demo',
      project_id: projectId,
      heading_id: addingTaskHeadingId || null,
      title: taskData.title,
      emoji: generateEmoji(taskData.title),
      notes: taskData.notes || null,
      status: 'active',
      schedule: activeView === 'today' ? 'today' :
                activeView === 'this_week' ? 'this_week' :
                activeView === 'next_week' ? 'next_week' :
                activeView === 'anytime' ? 'anytime' :
                activeView === 'someday' ? 'someday' : 'anytime',
      scheduled_date: null,
      deadline: taskData.deadline,
      position: tasks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    }
    setTasks([...tasks, newTask])
    setIsAddingTask(false)
    setAddingTaskHeadingId(undefined)
  }

  function handleUpdateTaskEmoji(taskId: string, emoji: string) {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, emoji, updated_at: new Date().toISOString() }
        : task
    ))
  }

  function handleAddHeading(name: string) {
    if (!currentProjectId) return

    const newHeading: Heading = {
      id: crypto.randomUUID(),
      project_id: currentProjectId,
      name,
      position: projectHeadings.length,
      created_at: new Date().toISOString(),
    }
    setHeadings([...headings, newHeading])
  }

  function handleUpdateProject(updates: Partial<Project>) {
    if (!currentProjectId) return

    setProjects(projects.map(p =>
      p.id === currentProjectId
        ? { ...p, ...updates, updated_at: new Date().toISOString() }
        : p
    ))
  }

  function handleToggleTask(taskId: string, completed: boolean) {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            status: completed ? 'completed' : 'active',
            completed_at: completed ? new Date().toISOString() : null,
          }
        : task
    ))
  }

  function handleScheduleTask(taskId: string, schedule: 'today' | 'this_week' | 'next_week' | 'anytime' | 'someday' | null) {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            schedule: schedule || 'anytime', // Default to anytime if null
          }
        : task
    ))
  }

  function handleUpdateTask(taskId: string, updates: Partial<Task>) {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, ...updates, updated_at: new Date().toISOString() }
        : task
    ))
  }

  function handleDeleteTask(taskId: string) {
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  function handleReorderTasks(reorderedTasks: Task[]) {
    setTasks(prev => {
      // Get IDs of reordered tasks
      const reorderedIds = new Set(reorderedTasks.map(t => t.id))
      // Keep tasks that weren't in the reorder
      const otherTasks = prev.filter(t => !reorderedIds.has(t.id))
      return [...otherTasks, ...reorderedTasks]
    })
  }

  function handleDeleteProject(projectId: string) {
    // Delete the project
    setProjects(projects.filter(p => p.id !== projectId))
    // Also delete all tasks in this project
    setTasks(tasks.filter(t => t.project_id !== projectId))
    // Also delete all headings in this project
    setHeadings(headings.filter(h => h.project_id !== projectId))
    // Navigate away if we're viewing this project
    if (activeView === `project:${projectId}`) {
      setActiveView('today')
    }
  }

  function handleMoveTaskToProject(taskId: string, projectId: string) {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, project_id: projectId, heading_id: null, updated_at: new Date().toISOString() }
        : task
    ))
  }

  function handleMoveTaskToSchedule(taskId: string, schedule: 'today' | 'this_week' | 'next_week' | 'anytime' | 'someday') {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, schedule, updated_at: new Date().toISOString() }
        : task
    ))
  }

  function handleSnoozeAllToNextWeek() {
    // Move all tasks from this_week to next_week
    setTasks(tasks.map(task =>
      task.schedule === 'this_week' && task.status !== 'completed'
        ? { ...task, schedule: 'next_week', updated_at: new Date().toISOString() }
        : task
    ))
  }

  function handleReorderProjects(reorderedProjects: Project[]) {
    setProjects(prev => {
      // Get IDs of reordered projects
      const reorderedIds = new Set(reorderedProjects.map(p => p.id))
      // Keep projects that weren't in the reorder (e.g., those with area_id)
      const otherProjects = prev.filter(p => !reorderedIds.has(p.id))
      return [...reorderedProjects, ...otherProjects]
    })
  }

  function handleConvertToProject(task: Task) {
    // Create a new project from the task
    const newProject: Project = {
      id: crypto.randomUUID(),
      user_id: 'demo',
      area_id: null,
      name: task.title,
      emoji: task.emoji || generateEmoji(task.title),
      notes: task.notes,
      position: projects.length,
      status: 'active',
      deadline: task.deadline,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    }
    setProjects([...projects, newProject])
    // Remove the task
    setTasks(tasks.filter(t => t.id !== task.id))
    // Navigate to the new project
    setActiveView(`project:${newProject.id}`)
    setSelectedTask(null)
  }

  function handleSearchSelect(task: Task, projectId: string | null) {
    setShowSearch(false)
    if (projectId) {
      // Navigate to the project and highlight the task
      setActiveView(`project:${projectId}`)
      setHighlightedTaskId(task.id)
      // Clear highlight after 2 seconds
      setTimeout(() => setHighlightedTaskId(null), 2000)
    } else {
      // For tasks without a project, go to the appropriate schedule view
      if (task.schedule) {
        setActiveView(task.schedule as View)
      }
      setHighlightedTaskId(task.id)
      setTimeout(() => setHighlightedTaskId(null), 2000)
    }
  }

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-stone-400">Loading...</p>
      </div>
    )
  }

  // Check if we're viewing a project
  const isProjectView = activeView.startsWith('project:')
  const currentProject = isProjectView
    ? projects.find(p => p.id === currentProjectId)
    : null

  // Get view config for non-project views
  const config = !isProjectView ? viewConfig[activeView] : null

  return (
    <div className="flex h-screen">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        projects={projects}
        areas={areas}
        tasks={tasks}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onMoveTaskToProject={handleMoveTaskToProject}
        onMoveTaskToSchedule={handleMoveTaskToSchedule}
        onReorderProjects={handleReorderProjects}
        onUpdateProjectEmoji={handleUpdateProjectEmoji}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {isProjectView && currentProject ? (
          <ProjectView
            project={currentProject}
            tasks={filteredTasks}
            headings={projectHeadings}
            onToggleTask={handleToggleTask}
            onScheduleTask={handleScheduleTask}
            onAddTask={(headingId) => {
              setAddingTaskHeadingId(headingId)
              setIsAddingTask(true)
            }}
            onAddHeading={handleAddHeading}
            onUpdateProject={handleUpdateProject}
            onTaskClick={setSelectedTask}
            onDeleteTask={handleDeleteTask}
            onReorderTasks={handleReorderTasks}
            onDeleteProject={() => handleDeleteProject(currentProject.id)}
            highlightedTaskId={highlightedTaskId}
            onUpdateTaskEmoji={handleUpdateTaskEmoji}
            onUpdateProjectEmoji={handleUpdateProjectEmoji}
          />
        ) : (
          <TaskList
            title={config?.title || 'Tasks'}
            icon={config?.icon || '📋'}
            tasks={filteredTasks}
            projects={projects}
            onToggleTask={handleToggleTask}
            onScheduleTask={handleScheduleTask}
            onAddTask={() => setIsAddingTask(true)}
            onTaskClick={setSelectedTask}
            onDeleteTask={handleDeleteTask}
            highlightedTaskId={highlightedTaskId}
            onUpdateTaskEmoji={handleUpdateTaskEmoji}
            showSnoozeButton={activeView === 'this_week'}
            onSnoozeAll={handleSnoozeAllToNextWeek}
          />
        )}

        {isAddingTask && (
          <TaskModal
            onSubmit={handleAddTask}
            onCancel={() => {
              setIsAddingTask(false)
              setAddingTaskHeadingId(undefined)
            }}
          />
        )}

        <AnimatePresence>
          {selectedTask && (
            <TaskDetailModal
              task={selectedTask}
              projects={projects}
              onUpdate={(updates) => handleUpdateTask(selectedTask.id, updates)}
              onDelete={() => {
                handleDeleteTask(selectedTask.id)
                setSelectedTask(null)
              }}
              onConvertToProject={() => handleConvertToProject(selectedTask)}
              onClose={() => setSelectedTask(null)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Quick Project Create Modal (via keyboard shortcut) */}
      <AnimatePresence>
        {isAddingProjectViaShortcut && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50"
              onClick={() => setIsAddingProjectViaShortcut(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md pointer-events-auto">
                <h2 className="text-xl font-bold text-stone-800 mb-4">New Project</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const input = e.currentTarget.elements.namedItem('projectName') as HTMLInputElement
                    if (input.value.trim()) {
                      handleCreateProject(input.value.trim())
                      setIsAddingProjectViaShortcut(false)
                    }
                  }}
                >
                  <input
                    name="projectName"
                    type="text"
                    placeholder="Project name"
                    className="w-full px-4 py-3 text-lg rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-800"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingProjectViaShortcut(false)}
                      className="flex-1 px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help Modal */}
      <AnimatePresence>
        {showShortcutsHelp && (
          <KeyboardShortcutsModal onClose={() => setShowShortcutsHelp(false)} />
        )}
      </AnimatePresence>

      {/* Spotlight Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <SpotlightSearch
            tasks={tasks}
            projects={projects}
            onSelect={handleSearchSelect}
            onClose={() => setShowSearch(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
