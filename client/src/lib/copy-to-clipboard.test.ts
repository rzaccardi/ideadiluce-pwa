import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyTextToClipboard } from './copy-to-clipboard'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('copyTextToClipboard', () => {
  it('copia con clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await expect(copyTextToClipboard(' 8718739073586 ')).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('8718739073586')
  })

  it('rifiuta valori vuoti', async () => {
    await expect(copyTextToClipboard('   ')).resolves.toBe('failed')
  })

  it('restituisce failed se clipboard API non è disponibile e non c’è DOM', async () => {
    vi.stubGlobal('navigator', {})

    await expect(copyTextToClipboard('4050300464749')).resolves.toBe('failed')
  })
})
