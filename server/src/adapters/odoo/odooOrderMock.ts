import type { OdooCallContext } from './odooClient.js'
import type { OdooOrderAdapter, SaleOrderInput } from './odooOrderAdapter.js'

export function createMockOdooOrderAdapter(): OdooOrderAdapter {
  return {
    async createOrUpdateSaleOrder(_ctx: OdooCallContext, _input: SaleOrderInput) {
      return { odooSaleOrderId: 0 }
    },
    async reconcileSaleOrderLines() {
      /* mock */
    },

    async getOrderStatus(_ctx: OdooCallContext, _odooSaleOrderId: number) {
      return { status: 'draft', paymentStatus: 'pending' }
    },
  }
}
