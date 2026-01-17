'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Task, Project } from '@/types/database'
import SchedulePicker, { Schedule } from './SchedulePicker'
import NativeEmojiPicker from './NativeEmojiPicker'
import { generateEmoji } from '@/utils/emoji'

interface TaskListProps {
  title: string
  icon: string
  tasks: Task[]
  projects: Project[]
  onToggleTask: (taskId: string, completed: boolean) => void
  onScheduleTask: (taskId: string, schedule: Schedule) => void
  onAddTask: () => void
  onTaskClick: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  highlightedTaskId?: string | null
  onUpdateTaskEmoji?: (taskId: string, emoji: string) => void
  onSnoozeAll?: () => void
  showSnoozeButton?: boolean
  onMoveTaskToProject?: (taskId: string, projectId: string) => void
  onMoveTaskToSchedule?: (taskId: string, schedule: 'today' | 'this_week' | 'next_week' | 'anytime' | 'someday') => void
}

const scheduleDisplay: Record<string, { icon: string; color: string }> = {
  today: { icon: '⭐', color: 'text-amber-500' },
  this_week: { icon: '📆', color: 'text-blue-500' },
  next_week: { icon: '📅', color: 'text-purple-500' },
  anytime: { icon: '📋', color: 'text-emerald-500' },
  someday: { icon: '📦', color: 'text-amber-300' },
}

export default function TaskList({ title, icon, tasks, projects, onToggleTask, onScheduleTask, onAddTask, onTaskClick, onDeleteTask, highlightedTaskId, onUpdateTaskEmoji, onSnoozeAll, showSnoozeButton, onMoveTaskToProject, onMoveTaskToSchedule }: TaskListProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [emojiPickerTaskId, setEmojiPickerTaskId] = useState<string | null>(null)
  const taskRefs = useRef<Map<string, HTMLLIElement>>(new Map())
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; taskId: string } | null>(null)
  const ghostRef = useRef<HTMLElement | null>(null)

  // Reset dragging state when tasks change (e.g., after a move)
  useEffect(() => {
    setDraggingTaskId(null)
  }, [tasks])

  // Touch drag handlers for iOS
  const createGhost = useCallback((element: HTMLElement, x: number, y: number) => {
    const ghost = element.cloneNode(true) as HTMLElement
    ghost.style.position = 'fixed'
    ghost.style.left = `${x - 100}px`
    ghost.style.top = `${y - 30}px`
    ghost.style.width = `${Math.min(element.offsetWidth, 300)}px`
    ghost.style.opacity = '0.9'
    ghost.style.transform = 'scale(1.02) rotate(1deg)'
    ghost.style.boxShadow = '0 10px 40px rgba(0,0,0,0.25)'
    ghost.style.pointerEvents = 'none'
    ghost.style.zIndex = '9999'
    ghost.style.borderRadius = '12px'
    ghost.style.background = 'white'
    ghost.id = 'drag-ghost'
    document.body.appendChild(ghost)
    return ghost
  }, [])

  const removeGhost = useCallback(() => {
    if (ghostRef.current) {
      ghostRef.current.remove()
      ghostRef.current = null
    }
    const existing = document.getElementById('drag-ghost')
    if (existing) existing.remove()
  }, [])

  const findDropTarget = useCallback((x: number, y: number) => {
    const ghost = document.getElementById('drag-ghost')
    if (ghost) ghost.style.display = 'none'

    const elementUnder = document.elementFromPoint(x, y)

    if (ghost) ghost.style.display = ''

    if (!elementUnder) return null

    const projectEl = elementUnder.closest('[data-drop-project]')
    if (projectEl) {
      return { type: 'project' as const, id: projectEl.getAttribute('data-drop-project')! }
    }

    const scheduleEl = elementUnder.closest('[data-drop-schedule]')
    if (scheduleEl) {
      return { type: 'schedule' as const, id: scheduleEl.getAttribute('data-drop-schedule')! }
    }

    return null
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent, taskId: string) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, taskId }

    longPressTimerRef.current = setTimeout(() => {
      const element = taskRefs.current.get(taskId)
      if (!element) return

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }

      setDraggingTaskId(taskId)
      ghostRef.current = createGhost(element, touch.clientX, touch.clientY)
    }, 250)
  }, [createGhost])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]

    // Cancel long press if moved before drag started
    if (!draggingTaskId && longPressTimerRef.current && touchStartRef.current) {
      const dx = Math.abs(touch.clientX - touchStartRef.current.x)
      const dy = Math.abs(touch.clientY - touchStartRef.current.y)
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      return
    }

    if (!draggingTaskId) return

    e.preventDefault()

    // Move ghost
    if (ghostRef.current) {
      ghostRef.current.style.left = `${touch.clientX - 100}px`
      ghostRef.current.style.top = `${touch.clientY - 30}px`
    }

    // Highlight drop targets
    document.querySelectorAll('.touch-drag-highlight').forEach(el => {
      el.classList.remove('touch-drag-highlight')
      ;(el as HTMLElement).style.transform = ''
      ;(el as HTMLElement).style.boxShadow = ''
    })

    const target = findDropTarget(touch.clientX, touch.clientY)
    if (target) {
      const selector = target.type === 'project'
        ? `[data-drop-project="${target.id}"]`
        : `[data-drop-schedule="${target.id}"]`
      const el = document.querySelector(selector)
      if (el) {
        el.classList.add('touch-drag-highlight')
        ;(el as HTMLElement).style.transform = 'scale(1.02)'
        ;(el as HTMLElement).style.boxShadow = '0 0 12px rgba(59, 130, 246, 0.4)'
      }
    }
  }, [draggingTaskId, findDropTarget])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (!draggingTaskId || !touchStartRef.current) {
      touchStartRef.current = null
      return
    }

    const touch = e.changedTouches[0]
    const target = findDropTarget(touch.clientX, touch.clientY)

    if (target) {
      if (target.type === 'project' && onMoveTaskToProject) {
        onMoveTaskToProject(draggingTaskId, target.id)
      } else if (target.type === 'schedule' && onMoveTaskToSchedule) {
        onMoveTaskToSchedule(draggingTaskId, target.id as 'today' | 'this_week' | 'next_week' | 'anytime' | 'someday')
      }
    }

    // Cleanup
    removeGhost()
    document.querySelectorAll('.touch-drag-highlight').forEach(el => {
      el.classList.remove('touch-drag-highlight')
      ;(el as HTMLElement).style.transform = ''
      ;(el as HTMLElement).style.boxShadow = ''
    })

    setDraggingTaskId(null)
    touchStartRef.current = null
  }, [draggingTaskId, findDropTarget, onMoveTaskToProject, onMoveTaskToSchedule, removeGhost])

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    removeGhost()
    setDraggingTaskId(null)
    touchStartRef.current = null
  }, [removeGhost])

  return (
    <div className="flex-1 bg-white overflow-auto">
      {/* Header */}
      <header className="p-8 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <span>{icon}</span>
            {title}
          </h1>
          {showSnoozeButton && onSnoozeAll && tasks.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSnoozeAll}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
            >
              <span>📅</span>
              <span>Move all to Next Week</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* Task List */}
      <div className="px-8">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-stone-400 py-8 text-center"
            >
              No tasks here yet
            </motion.p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task, index) => {
                const isHighlighted = highlightedTaskId === task.id
                return (
                <motion.li
                  key={task.id}
                  ref={(el) => {
                    if (el) taskRefs.current.set(task.id, el)
                    else taskRefs.current.delete(task.id)
                  }}
                  layout
                  layoutId={`tasklist-${task.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: isHighlighted ? [1, 1.02, 1] : 1
                  }}
                  exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                  transition={{
                    layout: { type: 'spring', stiffness: 350, damping: 25 },
                    duration: 0.3,
                    delay: index * 0.02
                  }}
                  draggable
                  onDragStart={(e) => {
                    setDraggingTaskId(task.id)
                    // @ts-expect-error - React DragEvent type mismatch
                    e.dataTransfer.setData('taskId', task.id)
                    // @ts-expect-error - React DragEvent type mismatch
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => setDraggingTaskId(null)}
                  onTouchStart={(e) => handleTouchStart(e, task.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchCancel}
                  className={`flex items-start gap-3 p-4 rounded-xl bg-white border border-stone-200 group cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset transition-all hover:shadow-md hover:border-stone-300 ${
                    isHighlighted ? 'bg-yellow-50 ring-2 ring-yellow-400 border-yellow-400' : ''
                  } ${draggingTaskId === task.id ? 'opacity-50 scale-[0.98] shadow-lg ring-2 ring-blue-400' : ''}`}
                  onClick={() => !draggingTaskId && onTaskClick(task)}
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
                  {/* Checkbox with animation */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleTask(task.id, task.status !== 'completed')
                    }}
                    className="flex-shrink-0 -m-2 p-2 flex items-center justify-center"
                    aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                    aria-pressed={task.status === 'completed'}
                  >
                    <motion.span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        task.status === 'completed'
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-stone-300 hover:border-blue-400'
                      }`}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <AnimatePresence>
                        {task.status === 'completed' && (
                          <motion.svg
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </motion.span>
                  </button>

                  {/* Schedule Badge - Left side, always visible */}
                  <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
                    </motion.button>

                    {/* Schedule Picker Dropdown */}
                    <AnimatePresence>
                      {selectedTaskId === task.id && (
                        <SchedulePicker
                          currentSchedule={task.schedule as Schedule}
                          onSelect={(schedule) => onScheduleTask(task.id, schedule)}
                          onClose={() => setSelectedTaskId(null)}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Task Emoji */}
                  <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEmojiPickerTaskId(emojiPickerTaskId === task.id ? null : task.id)}
                      className="text-lg"
                      title="Click to change emoji"
                    >
                      {task.emoji || generateEmoji(task.title)}
                    </motion.button>

                    {onUpdateTaskEmoji && (
                      <NativeEmojiPicker
                        isOpen={emojiPickerTaskId === task.id}
                        currentEmoji={task.emoji || generateEmoji(task.title)}
                        onSelect={(emoji) => {
                          onUpdateTaskEmoji(task.id, emoji)
                          setEmojiPickerTaskId(null)
                        }}
                        onClose={() => setEmojiPickerTaskId(null)}
                      />
                    )}
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-stone-800 transition-all duration-300 ${task.status === 'completed' ? 'line-through text-stone-400' : ''}`}>
                      {task.title}
                    </p>
                    {task.project_id && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        {projects.find(p => p.id === task.project_id)?.name}
                      </p>
                    )}
                    {task.notes && (
                      <p className="text-sm text-stone-400 truncate mt-0.5">{task.notes}</p>
                    )}
                    {task.deadline && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span>🚩</span>
                        {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Delete Button - appears on hover */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(254, 202, 202, 0.5)' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteTask(task.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center text-stone-300 hover:text-red-500 rounded transition-opacity"
                    aria-label="Delete task"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </motion.button>
                </motion.li>
              )})}
            </ul>
          )}
        </AnimatePresence>

        {/* Add Task Button */}
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-3 py-3 text-stone-400 hover:text-blue-500 transition-colors mt-4"
        >
          <span className="text-xl">+</span>
          <span>New Task</span>
        </button>
      </div>
    </div>
  )
}
