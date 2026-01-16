'use client'

import { useEffect, useRef } from 'react'

export type Schedule = 'today' | 'this_week' | 'next_week' | 'anytime' | 'someday' | null

interface SchedulePickerProps {
  currentSchedule: Schedule
  onSelect: (schedule: Schedule) => void
  onClose: () => void
}

const scheduleOptions: { id: Schedule; label: string; icon: string; color: string }[] = [
  { id: 'today', label: 'Today', icon: '⭐', color: 'text-amber-500' },
  { id: 'this_week', label: 'This Week', icon: '📆', color: 'text-blue-500' },
  { id: 'next_week', label: 'Next Week', icon: '📅', color: 'text-purple-500' },
  { id: 'anytime', label: 'Anytime', icon: '📋', color: 'text-emerald-500' },
  { id: 'someday', label: 'Someday', icon: '📦', color: 'text-amber-300' },
]

export default function SchedulePicker({ currentSchedule, onSelect, onClose }: SchedulePickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-200 py-2 w-[200px] z-50"
      role="listbox"
      aria-label="Schedule options"
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-stone-400 uppercase" aria-hidden="true">
        When
      </div>
      {scheduleOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => {
            onSelect(option.id)
            onClose()
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-stone-50 transition-colors ${
            currentSchedule === option.id ? 'bg-blue-50' : ''
          }`}
          role="option"
          aria-selected={currentSchedule === option.id}
        >
          <span className={option.color} aria-hidden="true">{option.icon}</span>
          <span className="text-stone-700">{option.label}</span>
          {currentSchedule === option.id && (
            <span className="ml-auto text-blue-500" aria-hidden="true">✓</span>
          )}
        </button>
      ))}

      {currentSchedule && (
        <>
          <div className="border-t border-stone-100 my-1" aria-hidden="true" />
          <button
            onClick={() => {
              onSelect(null)
              onClose()
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-stone-50 text-stone-400"
            aria-label="Clear schedule"
          >
            <span aria-hidden="true">✕</span>
            <span>Clear</span>
          </button>
        </>
      )}
    </div>
  )
}
