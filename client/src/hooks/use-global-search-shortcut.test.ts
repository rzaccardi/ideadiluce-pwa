import { describe, expect, it } from 'vitest'
import { getGlobalSearchShortcutLabel } from '@/hooks/use-global-search-shortcut'

describe('getGlobalSearchShortcutLabel', () => {
  it('restituisce una etichetta shortcut non vuota', () => {
    const label = getGlobalSearchShortcutLabel()
    expect(['⌘K', 'Ctrl+K']).toContain(label)
  })
})
