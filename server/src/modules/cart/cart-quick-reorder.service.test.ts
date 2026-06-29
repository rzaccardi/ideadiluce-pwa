import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Request } from 'express'
import { AppError } from '../../types/errors.js'

const resolveProductCodes = vi.fn()
const reorderLines = vi.fn()

vi.mock('../catalog/catalog-code-resolver.service.js', () => ({
  resolveProductCodes: (...args: unknown[]) => resolveProductCodes(...args),
}))

vi.mock('./cart.service.js', () => ({
  cartService: {
    reorderLines: (...args: unknown[]) => reorderLines(...args),
  },
}))

import { cartQuickReorderService } from './cart-quick-reorder.service.js'

function mockReq(user?: { id: string; customerSegment: 'RETAIL' | 'BUSINESS' | 'PROFESSIONAL' }) {
  return {
    correlationId: 'test-correlation',
    sessionRecord: user ? { user: { id: user.id, customerSegment: user.customerSegment, isProfessional: false } } : undefined,
  } as Request
}

describe('cartQuickReorderService access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rifiuta utenti non autenticati', async () => {
    await expect(
      cartQuickReorderService.resolveCodes(mockReq(), { text: '4050300464749 ×1' }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    })
  })

  it('consente utenti retail autenticati', async () => {
    resolveProductCodes.mockResolvedValueOnce({
      matched: [{ code: '4050300464749', quantity: 1, productRef: '1178', variantRef: '1184', productName: 'OSRAM', matchType: 'odoo_barcode' }],
      unmatched: [],
    })

    const result = await cartQuickReorderService.resolveCodes(
      mockReq({ id: 'user-retail', customerSegment: 'RETAIL' }),
      { text: '4050300464749 ×1' },
    )

    expect(result.matched).toHaveLength(1)
    expect(resolveProductCodes).toHaveBeenCalledOnce()
  })
})

describe('cartQuickReorderService.quickReorder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('propaga errore se nessun codice riconosciuto', async () => {
    resolveProductCodes.mockResolvedValueOnce({ matched: [], unmatched: [{ code: 'X', quantity: 1, reason: 'n/a' }] })

    await expect(
      cartQuickReorderService.quickReorder(
        mockReq({ id: 'user-retail', customerSegment: 'RETAIL' }),
        { text: 'X' },
      ),
    ).rejects.toMatchObject({ code: 'NO_MATCHES', statusCode: 404 })
  })

  it('aggiunge al carrello le righe riconosciute', async () => {
    resolveProductCodes.mockResolvedValueOnce({
      matched: [
        {
          code: '4050300464749',
          quantity: 2,
          productRef: '1178',
          variantRef: '1184',
          productName: 'OSRAM T5',
          matchType: 'odoo_barcode',
        },
        {
          code: '8718739073586',
          quantity: 1,
          productRef: '7369',
          variantRef: '8484',
          productName: 'SPL LED',
          matchType: 'odoo_barcode',
        },
      ],
      unmatched: [{ code: 'UNKNOWN', quantity: 1, reason: 'Codice non riconosciuto nel catalogo.' }],
    })

    reorderLines.mockResolvedValueOnce({
      added: 2,
      skipped: [],
      cart: { id: 'cart-1', items: [], reservation: { expired: false } },
    })

    const result = await cartQuickReorderService.quickReorder(
      mockReq({ id: 'user-retail', customerSegment: 'RETAIL' }),
      { text: '4050300464749 ×2\n8718739073586\nUNKNOWN' },
    )

    expect(reorderLines).toHaveBeenCalledWith(
      expect.anything(),
      [
        { productRef: '1178', variantRef: '1184', quantity: 2 },
        { productRef: '7369', variantRef: '8484', quantity: 1 },
      ],
    )
    expect(result.added).toBe(2)
    expect(result.unmatched).toHaveLength(1)
  })

  it('valida input vuoto', async () => {
    await expect(
      cartQuickReorderService.quickReorder(
        mockReq({ id: 'user-retail', customerSegment: 'RETAIL' }),
        { text: '   ' },
      ),
    ).rejects.toBeInstanceOf(AppError)
  })
})
