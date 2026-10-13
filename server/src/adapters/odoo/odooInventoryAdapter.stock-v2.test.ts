import { describe, expect, it, vi, beforeEach } from 'vitest'

const { odooExecuteKw, envState, odooConfigured, odooLive, apiV2, odooApiGetStock } = vi.hoisted(
  () => ({
    odooExecuteKw: vi.fn(),
    envState: { ODOO_ENABLED: true },
    odooConfigured: { value: true },
    odooLive: { value: true },
    apiV2: { value: true },
    odooApiGetStock: vi.fn(),
  }),
)

vi.mock('../../config/env.js', () => ({
  env: envState,
}))

vi.mock('./odooClient.js', () => ({
  isOdooConfigured: () => odooConfigured.value,
  isOdooLiveConfigured: () => odooLive.value,
  odooExecuteKw: (...args: unknown[]) => odooExecuteKw(...args),
}))

vi.mock('../odoo-api/odooApiClient.js', () => ({
  isOdooApiV2Configured: () => apiV2.value,
}))

vi.mock('../odoo-api/odooApi.resources.js', () => ({
  odooApiGetStock: (...args: unknown[]) => odooApiGetStock(...args),
}))

import { fetchVariantStockByIds } from './odooInventoryAdapter.js'

describe('fetchVariantStockByIds - API v2 stock fields', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
    odooApiGetStock.mockReset()
    envState.ODOO_ENABLED = true
    odooConfigured.value = true
    odooLive.value = true
    apiV2.value = true
  })

  it('mappa free_qty, lead_time_max, can_backorder, sale_ok, is_storable senza supplierinfo', async () => {
    odooApiGetStock.mockResolvedValue([
      {
        id: 7871,
        free_qty: 16,
        lead_time_max: 2,
        can_backorder: true,
        sale_ok: true,
        is_storable: true,
        max_qty: null,
      },
      {
        id: 2244,
        free_qty: 0,
        lead_time_max: null,
        can_backorder: false,
        sale_ok: true,
        is_storable: true,
        max_qty: 0,
      },
    ])

    const map = await fetchVariantStockByIds({ correlationId: 't' }, [7871, 2244])

    expect(odooApiGetStock).toHaveBeenCalledWith([7871, 2244], 't')
    expect(odooExecuteKw).not.toHaveBeenCalled()

    const a = map.get(7871)!
    expect(a.stockQty).toBe(16)
    expect(a.leadTimeDays).toBe(2)
    expect(a.hasSuppliers).toBe(true)
    expect(a.orderable).toBe(true)
    expect(a.saleOk).toBe(true)
    expect(a.isStorable).toBe(true)

    const b = map.get(2244)!
    expect(b.stockQty).toBe(0)
    expect(b.leadTimeDays).toBeNull()
    expect(b.hasSuppliers).toBe(false)
    expect(b.orderable).toBe(false)
  })

  it('non usa qty_available come fallback di free_qty', async () => {
    odooApiGetStock.mockResolvedValue([
      {
        id: 80,
        qty_available: 27,
        free_qty: undefined,
        lead_time_max: 7,
        can_backorder: true,
        sale_ok: true,
        is_storable: true,
      },
    ])

    const map = await fetchVariantStockByIds({ correlationId: 't' }, [80])
    const snap = map.get(80)!
    expect(snap.stockQty).toBeNull()
    expect(snap.leadTimeDays).toBe(7)
    expect(snap.orderable).toBe(true)
  })

  it('sale_ok false e is_storable false', async () => {
    odooApiGetStock.mockResolvedValue([
      {
        id: 1,
        free_qty: 5,
        lead_time_max: null,
        can_backorder: false,
        sale_ok: false,
        is_storable: true,
      },
      {
        id: 2,
        free_qty: 0,
        lead_time_max: null,
        can_backorder: false,
        sale_ok: true,
        is_storable: false,
      },
    ])

    const map = await fetchVariantStockByIds({ correlationId: 't' }, [1, 2])
    expect(map.get(1)!.saleOk).toBe(false)
    expect(map.get(1)!.orderable).toBe(false)
    expect(map.get(2)!.isStorable).toBe(false)
  })

  it('lead_time_max 0 + can_backorder true è valido', async () => {
    odooApiGetStock.mockResolvedValue([
      {
        id: 9,
        free_qty: 0,
        lead_time_max: 0,
        can_backorder: true,
        sale_ok: true,
        is_storable: true,
      },
    ])

    const snap = (await fetchVariantStockByIds({ correlationId: 't' }, [9])).get(9)!
    expect(snap.leadTimeDays).toBe(0)
    expect(snap.orderable).toBe(true)
  })

  it('can_backorder derivato da lead_time_max se booleano assente', async () => {
    odooApiGetStock.mockResolvedValue([
      { id: 3, free_qty: 1, lead_time_max: 4, sale_ok: true, is_storable: true },
      { id: 4, free_qty: 1, lead_time_max: null, sale_ok: true, is_storable: true },
    ])

    const map = await fetchVariantStockByIds({ correlationId: 't' }, [3, 4])
    expect(map.get(3)!.orderable).toBe(true)
    expect(map.get(3)!.leadTimeDays).toBe(4)
    expect(map.get(4)!.orderable).toBe(false)
  })
})
