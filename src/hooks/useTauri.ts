'use client'

import { useState, useEffect, useCallback } from 'react'

// Check if we're running in a Tauri environment
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

export function useTauri() {
  const [isTauri, setIsTauri] = useState(false)

  useEffect(() => {
    setIsTauri(isTauriEnvironment())
  }, [])

  // Open the native macOS emoji picker via Tauri command
  const openNativeEmojiPicker = useCallback(async () => {
    if (!isTauri) return false

    try {
      // Dynamically import Tauri API only when needed
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('open_emoji_picker')
      return true
    } catch (error) {
      console.error('Failed to open native emoji picker:', error)
      return false
    }
  }, [isTauri])

  return {
    isTauri,
    openNativeEmojiPicker,
  }
}
