'use client'

import { useEffect } from 'react'

type Options = {
  onOpen: () => void
  enabled?: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

export function useGlobalSearchShortcut({ onOpen, enabled = true }: Options) {
  useEffect(() => {
    if (!enabled) return

    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      if (key !== 'k') return
      if (!(event.metaKey || event.ctrlKey)) return
      if (isEditableTarget(event.target)) return
      event.preventDefault()
      onOpen()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, onOpen])
}

export function getGlobalSearchShortcutLabel(): string {
  if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform)) {
    return '⌘K'
  }
  return 'Ctrl+K'
}
