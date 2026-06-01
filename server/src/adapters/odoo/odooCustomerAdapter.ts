import { env } from '../../config/env.js'
import { isOdooConfigured } from './odooClient.js'
import type { OdooCallContext } from './odooClient.js'
import { createMockOdooCustomerAdapter } from './odooCustomerMock.js'
import { createLiveOdooCustomerAdapter } from './odooCustomerLive.js'

export type FindOrCreateCustomerInput = {
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}

export type OdooCustomerProfile = {
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
  phone?: string
}

export type OdooCustomerResult = {
  odooPartnerId: number
}

export interface OdooCustomerAdapter {
  findCustomerByEmail(ctx: OdooCallContext, email: string): Promise<OdooCustomerResult | null>
  getCustomerProfileByEmail(ctx: OdooCallContext, email: string): Promise<OdooCustomerProfile | null>
  createCustomer(ctx: OdooCallContext, input: FindOrCreateCustomerInput): Promise<OdooCustomerResult>
  findOrCreateCustomer(ctx: OdooCallContext, input: FindOrCreateCustomerInput): Promise<OdooCustomerResult>
}

export function createOdooCustomerAdapter(): OdooCustomerAdapter {
  if (env.ODOO_ENABLED && isOdooConfigured()) {
    return createLiveOdooCustomerAdapter()
  }
  return createMockOdooCustomerAdapter()
}
