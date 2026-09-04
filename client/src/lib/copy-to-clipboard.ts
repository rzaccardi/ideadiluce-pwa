export type CopyTextResult = 'copied' | 'prompted' | 'failed'

export async function copyTextToClipboard(text: string): Promise<CopyTextResult> {
  const value = text.trim()
  if (!value) return 'failed'

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return 'copied'
    }
  } catch {
    /* fallback below */
  }

  if (typeof document === 'undefined') return 'failed'

  try {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, value.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (ok) return 'copied'
  } catch {
    /* last resort below */
  }

  try {
    window.prompt('Copia il codice:', value)
    return 'prompted'
  } catch {
    return 'failed'
  }
}
