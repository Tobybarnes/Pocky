'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Project, Area, Task } from '@/types/database'
import { generateEmoji } from '@/utils/emoji'
import EmojiPicker from './EmojiPicker'

export type View = 'today' | 'this_week' | 'next_week' | 'anytime' | 'someday' | 'logbook' | `project:${string}`

type Schedule = 'today' | 'this_week' | 'next_week' | 'anytime' | 'someday'

interface SidebarProps {
  activeView: View
  onViewChange: (view: View) => void
  projects: Project[]
  areas: Area[]
  tasks: Task[]
  onCreateProject: (name: string, areaId?: string) => void
  onDeleteProject: (projectId: string) => void
  onMoveTaskToProject: (taskId: string, projectId: string) => void
  onMoveTaskToSchedule: (taskId: string, schedule: Schedule) => void
  onReorderProjects?: (projects: Project[]) => void
  onUpdateProjectEmoji?: (projectId: string, emoji: string) => void
}

const navItems: { id: View; label: string; icon: string; color?: string; shortcut: string }[] = [
  { id: 'today', label: 'Today', icon: '⭐', color: 'text-amber-500', shortcut: '⌘1' },
  { id: 'this_week', label: 'This Week', icon: '📆', color: 'text-blue-500', shortcut: '⌘2' },
  { id: 'next_week', label: 'Next Week', icon: '📅', color: 'text-purple-500', shortcut: '⌘3' },
  { id: 'anytime', label: 'Anytime', icon: '📋', color: 'text-emerald-500', shortcut: '⌘4' },
  { id: 'someday', label: 'Someday', icon: '📦', color: 'text-amber-300', shortcut: '⌘5' },
  { id: 'logbook', label: 'Logbook', icon: '✅', color: 'text-green-600', shortcut: '⌘6' },
]

// Animated circular progress component
function ProgressCircle({ progress, size = 20 }: { progress: number; size?: number }) {
  const strokeWidth = 2
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  return (
    <svg width={size} height={size} className="transform -rotate-90 flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e5e5"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  )
}

// Collapse toggle button
function CollapseButton({ isCollapsed, onClick }: { isCollapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded hover:bg-stone-200/50 transition-colors"
      aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
    >
      <motion.svg
        animate={{ rotate: isCollapsed ? -90 : 0 }}
        transition={{ duration: 0.2 }}
        className="w-3 h-3 text-stone-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </motion.svg>
    </button>
  )
}

export default function Sidebar({
  activeView,
  onViewChange,
  projects,
  areas,
  tasks,
  onCreateProject,
  onDeleteProject,
  onMoveTaskToProject,
  onMoveTaskToSchedule,
  onReorderProjects,
  onUpdateProjectEmoji
}: SidebarProps) {
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; projectId: string } | null>(null)
  const [dragOverProject, setDragOverProject] = useState<string | null>(null)
  const [dragOverSchedule, setDragOverSchedule] = useState<string | null>(null)
  const [projectsCollapsed, setProjectsCollapsed] = useState(false)
  const [scheduleCollapsed, setScheduleCollapsed] = useState(false)
  const [emojiPickerProjectId, setEmojiPickerProjectId] = useState<string | null>(null)

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedProjectsCollapsed = localStorage.getItem('pocky_projects_collapsed')
    const savedScheduleCollapsed = localStorage.getItem('pocky_schedule_collapsed')
    if (savedProjectsCollapsed) setProjectsCollapsed(JSON.parse(savedProjectsCollapsed))
    if (savedScheduleCollapsed) setScheduleCollapsed(JSON.parse(savedScheduleCollapsed))
  }, [])

  // Save collapsed state
  useEffect(() => {
    localStorage.setItem('pocky_projects_collapsed', JSON.stringify(projectsCollapsed))
  }, [projectsCollapsed])

  useEffect(() => {
    localStorage.setItem('pocky_schedule_collapsed', JSON.stringify(scheduleCollapsed))
  }, [scheduleCollapsed])

  const handleProjectContextMenu = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, projectId })
  }

  const handleDeleteProject = () => {
    if (contextMenu) {
      onDeleteProject(contextMenu.projectId)
      setContextMenu(null)
    }
  }

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim())
      setNewProjectName('')
      setIsAddingProject(false)
    }
  }

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId)
    if (projectTasks.length === 0) return 0
    const completed = projectTasks.filter(t => t.status === 'completed').length
    return Math.round((completed / projectTasks.length) * 100)
  }

  // Only show active projects (not completed)
  const activeProjects = projects.filter(p => p.status !== 'completed')
  const standaloneProjects = activeProjects.filter(p => !p.area_id).sort((a, b) => a.position - b.position)

  const handleReorder = (reorderedProjects: Project[]) => {
    if (onReorderProjects) {
      const updatedProjects = reorderedProjects.map((p, index) => ({
        ...p,
        position: index
      }))
      onReorderProjects(updatedProjects)
    }
  }

  return (
    <aside className="w-64 bg-stone-100 h-screen flex flex-col border-r border-stone-200">
      {/* Logo */}
      <button
        onClick={() => onViewChange('today')}
        className="p-4 pt-6 flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <img src="/logo.png" alt="Pocky" className="w-8 h-8" />
        <h1 className="text-xl font-semibold text-stone-800">Pocky</h1>
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {/* Projects Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Projects
            </h2>
            <CollapseButton
              isCollapsed={projectsCollapsed}
              onClick={() => setProjectsCollapsed(!projectsCollapsed)}
            />
          </div>

          <AnimatePresence>
            {!projectsCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {standaloneProjects.length > 0 ? (
                  <Reorder.Group
                    axis="y"
                    values={standaloneProjects}
                    onReorder={handleReorder}
                    className="space-y-2"
                  >
                    {standaloneProjects.map((project) => (
                      <Reorder.Item
                        key={project.id}
                        value={project}
                        className="list-none"
                      >
                        <motion.div
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDragOverProject(project.id)
                          }}
                          onDragLeave={() => setDragOverProject(null)}
                          onDrop={(e) => {
                            e.preventDefault()
                            const taskId = e.dataTransfer.getData('taskId')
                            if (taskId) {
                              onMoveTaskToProject(taskId, project.id)
                            }
                            setDragOverProject(null)
                          }}
                          animate={dragOverProject === project.id ? {
                            scale: 1.02,
                            paddingTop: 16,
                            paddingBottom: 16,
                            marginTop: 8,
                            marginBottom: 8,
                          } : { scale: 1, paddingTop: 8, paddingBottom: 8, marginTop: 0, marginBottom: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          style={dragOverProject === project.id ? {
                            boxShadow: '0 0 12px rgba(59, 130, 246, 0.25)'
                          } : undefined}
                          className={`w-full flex items-center gap-2 px-3 rounded-xl text-left border transition-colors relative ${
                            activeView === `project:${project.id}`
                              ? 'bg-white border-stone-200 shadow-sm text-stone-900'
                              : 'bg-stone-100 border-stone-200/50 text-stone-600 hover:bg-stone-50 hover:border-stone-200'
                          }`}
                        >
                          {/* Emoji button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEmojiPickerProjectId(emojiPickerProjectId === project.id ? null : project.id)
                            }}
                            className="flex-shrink-0 text-xl hover:scale-110 transition-transform"
                            title="Click to change emoji"
                          >
                            {project.emoji || generateEmoji(project.name)}
                          </button>

                          {/* Emoji Picker */}
                          <AnimatePresence>
                            {emojiPickerProjectId === project.id && onUpdateProjectEmoji && (
                              <EmojiPicker
                                currentEmoji={project.emoji || generateEmoji(project.name)}
                                onSelect={(emoji) => {
                                  onUpdateProjectEmoji(project.id, emoji)
                                  setEmojiPickerProjectId(null)
                                }}
                                onClose={() => setEmojiPickerProjectId(null)}
                              />
                            )}
                          </AnimatePresence>

                          {/* Project name - clickable for navigation */}
                          <button
                            onClick={() => onViewChange(`project:${project.id}`)}
                            onContextMenu={(e) => handleProjectContextMenu(e, project.id)}
                            className="flex-1 font-medium truncate text-stone-700 text-left"
                          >
                            {project.name}
                          </button>

                          {dragOverProject === project.id && (
                            <span className="text-xs text-stone-400">+</span>
                          )}
                        </motion.div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                ) : (
                  !isAddingProject && (
                    <p className="px-3 text-sm text-stone-400 italic">
                      No projects yet
                    </p>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Schedule Navigation */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Schedule
            </h2>
            <CollapseButton
              isCollapsed={scheduleCollapsed}
              onClick={() => setScheduleCollapsed(!scheduleCollapsed)}
            />
          </div>

          <AnimatePresence>
            {!scheduleCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <ul className="space-y-2">
                  {navItems.map((item) => {
                    const isDroppable = item.id !== 'logbook'
                    return (
                    <li key={item.id}>
                      <motion.button
                        onClick={() => onViewChange(item.id)}
                        onDragOver={isDroppable ? (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDragOverSchedule(item.id)
                        } : undefined}
                        onDragLeave={isDroppable ? () => setDragOverSchedule(null) : undefined}
                        onDrop={isDroppable ? (e) => {
                          e.preventDefault()
                          const taskId = e.dataTransfer.getData('taskId')
                          if (taskId && item.id !== 'logbook') {
                            onMoveTaskToSchedule(taskId, item.id as Schedule)
                          }
                          setDragOverSchedule(null)
                        } : undefined}
                        animate={dragOverSchedule === item.id ? {
                          scale: 1.02,
                          paddingTop: 16,
                          paddingBottom: 16,
                          marginTop: 4,
                          marginBottom: 4,
                        } : { scale: 1, paddingTop: 8, paddingBottom: 8, marginTop: 0, marginBottom: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        whileTap={{ scale: 0.98 }}
                        style={dragOverSchedule === item.id ? {
                          boxShadow: '0 0 12px rgba(59, 130, 246, 0.25)'
                        } : undefined}
                        className={`w-full flex items-center gap-3 px-3 rounded-xl text-left border transition-colors group ${
                          activeView === item.id
                            ? 'bg-white border-stone-200 shadow-sm text-stone-900'
                            : 'bg-stone-100 border-stone-200/50 text-stone-600 hover:bg-stone-50 hover:border-stone-200'
                        }`}
                      >
                        <span className={item.color}>{item.icon}</span>
                        <span className="font-medium flex-1">{item.label}</span>
                        {dragOverSchedule === item.id ? (
                          <span className="text-xs text-stone-400">+</span>
                        ) : (
                          <span className="text-xs text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">{item.shortcut}</span>
                        )}
                      </motion.button>
                    </li>
                  )})}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-stone-200">
        {isAddingProject ? (
          <form onSubmit={handleSubmitProject} className="space-y-2">
            <label htmlFor="new-project-name" className="sr-only">Project name</label>
            <input
              id="new-project-name"
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-800"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingProject(false)
                  setNewProjectName('')
                }}
                className="flex-1 px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newProjectName.trim()}
                className="flex-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddingProject(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors group"
          >
            <span>+</span>
            <span className="text-sm">New Project</span>
            <span className="ml-auto text-xs text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">⌘P</span>
          </motion.button>
        )}
      </div>

      {/* Context Menu for Projects */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
              onKeyDown={(e) => e.key === 'Escape' && setContextMenu(null)}
              role="button"
              tabIndex={-1}
              aria-label="Close menu"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 bg-white rounded-lg shadow-xl border border-stone-200 py-1 w-40"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              role="menu"
              aria-label="Project options"
            >
              <motion.button
                whileHover={{ backgroundColor: 'rgba(254, 226, 226, 0.5)' }}
                onClick={handleDeleteProject}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500"
                role="menuitem"
              >
                <span aria-hidden="true">🗑️</span>
                Delete Project
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </aside>
  )
}
