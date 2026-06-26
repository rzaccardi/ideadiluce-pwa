import type { OdooCallContext } from './odooClient.js'
import type { OdooOrderAdapter, SaleOrderInput } from './odooOrderAdapter.js'
import type { SyncSaleOrderDraftInput } from '../../modules/checkout/checkout-order.types.js'

export function createMockOdooOrderAdapter(): OdooOrderAdapter {
  return {
    async createOrUpdateSaleOrder(_ctx: OdooCallContext, _input: SaleOrderInput) {
      return { odooSaleOrderId: 0 }
    },
    async syncSaleOrderDraft(_ctx: OdooCallContext, input: SyncSaleOrderDraftInput) {
      return { odooSaleOrderId: input.odooSaleOrderId ?? 0 }
    },
    async reconcileSaleOrderLines() {
      /* mock */
    },

    async getOrderStatus(_ctx: OdooCallContext, _odooSaleOrderId: number) {
      return { status: 'draft', paymentStatus: 'pending' }
    },
  }
}
