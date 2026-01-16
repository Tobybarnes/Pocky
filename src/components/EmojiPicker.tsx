'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { emojiCategories, frequentEmojis, searchEmojis } from '@/utils/emoji'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  currentEmoji?: string
}

export default function EmojiPicker({ onSelect, onClose, currentEmoji }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Frequent')
  const [searchQuery, setSearchQuery] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Focus search on open
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const categoryIcons: Record<string, string> = {
    'Frequent': '⭐',
    'Smileys': '😀',
    'Gestures': '👋',
    'Objects': '💼',
    'Nature': '🌱',
    'Food': '🍕',
    'Activities': '⚽',
    'Travel': '✈️',
    'Symbols': '❤️',
  }

  const categories = ['Frequent', ...Object.keys(emojiCategories)]

  const getEmojisToShow = () => {
    if (searchQuery) {
      // Search using keyword-based search
      return searchEmojis(searchQuery)
    }
    if (activeCategory === 'Frequent') {
      return frequentEmojis
    }
    return emojiCategories[activeCategory as keyof typeof emojiCategories] || []
  }

  const emojisToShow = getEmojisToShow()

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 bg-white rounded-xl shadow-xl border border-stone-200 w-80 overflow-hidden"
      style={{ top: '100%', left: 0, marginTop: 8 }}
    >
      {/* Search */}
      <div className="p-2 border-b border-stone-100">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search emojis..."
          className="w-full px-3 py-2 text-sm bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-800"
        />
      </div>

      {/* Category tabs */}
      {!searchQuery && (
        <div className="flex gap-1 p-2 border-b border-stone-100 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors ${
                activeCategory === category
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-stone-100'
              }`}
              title={category}
            >
              {categoryIcons[category] || '📁'}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="p-2 h-64 overflow-y-auto">
        {emojisToShow.length > 0 ? (
          <div className="grid grid-cols-8 gap-1">
            {emojisToShow.map((emoji, index) => (
              <motion.button
                key={`${emoji}-${index}`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onSelect(emoji)
                  onClose()
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xl hover:bg-stone-100 transition-colors ${
                  currentEmoji === emoji ? 'bg-blue-100 ring-2 ring-blue-400' : ''
                }`}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="text-center text-stone-400 py-8">No emojis found</p>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 text-xs text-stone-400">
        Click an emoji to select it
      </div>
    </motion.div>
  )
}
