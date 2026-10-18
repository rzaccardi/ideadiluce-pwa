import { describe, expect, it } from 'vitest'
import { listMailTemplatePreviews } from './mail-templates-admin.service.js'

describe('listMailTemplatePreviews', () => {
  it('espone i template con dati di esempio e la firma Idea di Luce', () => {
    const items = listMailTemplatePreviews()
    expect(items.length).toBeGreaterThan(0)
    const order = items.find((item) => item.key === 'order_confirmation')
    expect(order?.subject).toContain('G6B82C')
    expect(order?.bodyHtml).toContain('wordmark-white.png')
    expect(order?.bodyHtml).toContain('Idea di Luce')
    expect(order?.bodyHtml).not.toContain('TLB ITALY')
    expect(order?.bodyHtml).not.toContain('{{order_number}}')
  })
})
