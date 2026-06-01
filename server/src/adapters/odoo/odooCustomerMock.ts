import type { OdooCallContext } from './odooClient.js'
import type { FindOrCreateCustomerInput, OdooCustomerAdapter } from './odooCustomerAdapter.js'

export function createMockOdooCustomerAdapter(): OdooCustomerAdapter {
  return {
    async findCustomerByEmail(_ctx: OdooCallContext, _email: string) {
      return null
    },
    async getCustomerProfileByEmail(_ctx: OdooCallContext, _email: string) {
      return null
    },
    async createCustomer(_ctx: OdooCallContext, _input: FindOrCreateCustomerInput) {
      return { odooPartnerId: 0 }
    },
    async findOrCreateCustomer(_ctx: OdooCallContext, _input: FindOrCreateCustomerInput) {
      return { odooPartnerId: 0 }
    },
  }
}
