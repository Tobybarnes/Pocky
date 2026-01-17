'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useTauri } from '@/hooks/useTauri'
import EmojiPicker from './EmojiPicker'
import { AnimatePresence } from 'framer-motion'

interface NativeEmojiPickerProps {
  isOpen: boolean
  onSelect: (emoji: string) => void
  onClose: () => void
  currentEmoji?: string
}

/**
 * A unified emoji picker that uses:
 * - Native macOS emoji picker in Tauri desktop app
 * - Custom emoji picker in web browser
 */
export default function NativeEmojiPicker({
  isOpen,
  onSelect,
  onClose,
  currentEmoji
}: NativeEmojiPickerProps) {
  const { isTauri, openNativeEmojiPicker } = useTauri()
  const hiddenInputRef = useRef<HTMLInputElement>(null)
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  // Handle native picker input
  const handleNativeInput = useCallback((e: Event) => {
    const input = e.target as HTMLInputElement
    const value = input.value
    if (value) {
      // Extract emoji (first character which may be multi-byte)
      const emoji = [...value][0]
      if (emoji) {
        onSelect(emoji)
        onClose()
      }
      input.value = ''
    }
  }, [onSelect, onClose])

  // Open native picker when isOpen becomes true (in Tauri)
  useEffect(() => {
    if (!isOpen) {
      setShowCustomPicker(false)
      return
    }

    if (isTauri) {
      // Focus hidden input and open native picker
      const input = hiddenInputRef.current
      if (input) {
        input.value = ''
        input.focus()
        openNativeEmojiPicker()

        // Add input listener
        input.addEventListener('input', handleNativeInput)

        return () => {
          input.removeEventListener('input', handleNativeInput)
        }
      }
    } else {
      // Show custom picker in web
      setShowCustomPicker(true)
    }
  }, [isOpen, isTauri, openNativeEmojiPicker, handleNativeInput])

  // Handle click outside for web picker
  useEffect(() => {
    if (!showCustomPicker) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showCustomPicker, onClose])

  // Handle blur for native picker (user closed without selecting)
  const handleBlur = useCallback(() => {
    if (isTauri && isOpen) {
      // Give a small delay to allow emoji input to be processed
      setTimeout(() => {
        if (hiddenInputRef.current && !hiddenInputRef.current.value) {
          onClose()
        }
      }, 100)
    }
  }, [isTauri, isOpen, onClose])

  return (
    <>
      {/* Hidden input for native picker in Tauri */}
      {isTauri && (
        <input
          ref={hiddenInputRef}
          type="text"
          style={{
            position: 'absolute',
            opacity: 0,
            width: 1,
            height: 1,
            pointerEvents: isOpen ? 'auto' : 'none',
            zIndex: -1,
          }}
          onBlur={handleBlur}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      {/* Custom picker for web (or fallback) */}
      <AnimatePresence>
        {showCustomPicker && (
          <EmojiPicker
            currentEmoji={currentEmoji}
            onSelect={onSelect}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </>
  )
}
