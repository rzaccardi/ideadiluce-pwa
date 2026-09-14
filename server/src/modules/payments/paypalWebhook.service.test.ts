import { describe, expect, it } from 'vitest'
import { pwaOrderIdFromPaypalCapture } from './paypalWebhook.service.js'

describe('pwaOrderIdFromPaypalCapture', () => {
  it('legge custom_id, invoice_id pwa- e codice 6 char', () => {
    expect(pwaOrderIdFromPaypalCapture({ custom_id: 'clxyz123' })).toBe('clxyz123')
    expect(pwaOrderIdFromPaypalCapture({ invoice_id: 'pwa-ord-1' })).toBe('ord-1')
    expect(pwaOrderIdFromPaypalCapture({ invoice_id: '4CSVKG' })).toBe('4CSVKG')
    expect(pwaOrderIdFromPaypalCapture({})).toBeNull()
  })
})
