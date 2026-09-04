import type { OdooCallContext } from './odooClient.js'
import type {
  FindOrCreateCustomerInput,
  OdooBusinessProfile,
  OdooCustomerAdapter,
  OdooCustomerProfile,
  OdooCustomerResult,
} from './odooCustomerAdapter.js'

export function createMockOdooCustomerAdapter(): OdooCustomerAdapter {
  return {
    async findCustomerByEmail(_ctx: OdooCallContext, _email: string) {
      return null
    },
    async getCustomerProfileByEmail(_ctx: OdooCallContext, _email: string) {
      return null
    },
    async getCustomerAccountByEmail(_ctx: OdooCallContext, _email: string) {
      return null
    },
    async getCustomerAccountByPartnerId(_ctx: OdooCallContext, _partnerId: number) {
      return null
    },
    async createCustomer(_ctx: OdooCallContext, _input: FindOrCreateCustomerInput) {
      return { odooPartnerId: 0 }
    },
    async findOrCreateCustomer(_ctx: OdooCallContext, _input: FindOrCreateCustomerInput) {
      return { odooPartnerId: 0 }
    },
    async updateCustomerBusiness(_ctx: OdooCallContext, _partnerId: number, _input: OdooBusinessProfile) {},
    async updateCustomerProfile(
      _ctx: OdooCallContext,
      _partnerId: number,
      _input: {
        firstName?: string
        lastName?: string
        phone?: string | null
        shippingAddress?: Partial<OdooCustomerProfile> | null
      },
    ) {},
    async createDeliveryPartner(
      _ctx: OdooCallContext,
      _parentPartnerId: number,
      _profile: OdooCustomerProfile,
    ): Promise<OdooCustomerResult> {
      return { odooPartnerId: 0 }
    },
    async listShippingDestinations(_ctx: OdooCallContext, _parentPartnerId: number) {
      return []
    },
    async updateDeliveryPartner(
      _ctx: OdooCallContext,
      _partnerId: number,
      _profile: OdooCustomerProfile,
    ) {},
    async archiveDeliveryPartner(_ctx: OdooCallContext, _partnerId: number) {},
    async resolveOrderShippingPartner(
      _ctx: OdooCallContext,
      _parentPartnerId: number,
      _input: {
        shippingAddress?: Partial<OdooCustomerProfile> & { id?: string | null }
        dropshipAddress?: Partial<OdooCustomerProfile> | null
      },
    ) {
      return null
    },
    async syncProfessionalFlagFromPartner(_ctx: OdooCallContext, _partnerId: number) {
      return false
    },
  }
}
