/** Partner Odoo: creazione, profilo e campi fiscali B2B. */
import { env } from '../../config/env.js'
import { isOdooConfigured } from './odooClient.js'
import type { OdooCallContext } from './odooClient.js'
import { createMockOdooCustomerAdapter } from './odooCustomerMock.js'
import { createLiveOdooCustomerAdapter } from './odooCustomerLive.js'

export type OdooBusinessProfile = {
  companyName?: string | null
  vatNumber?: string | null
  fiscalCode?: string | null
  pec?: string | null
  sdiCode?: string | null
  isCompany?: boolean
  viesName?: string | null
  viesAddress?: string | null
  viesRequestDate?: string | null
}

export type FindOrCreateCustomerInput = {
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  business?: OdooBusinessProfile | null
  billingAddress?: Partial<OdooCustomerProfile> | null
}

export type OdooCustomerProfile = {
  firstName: string
  lastName: string
  line1: string
  streetNumber: string
  isSnc: boolean
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
  updateCustomerBusiness(
    ctx: OdooCallContext,
    partnerId: number,
    input: OdooBusinessProfile,
  ): Promise<void>
  createDeliveryPartner(
    ctx: OdooCallContext,
    parentPartnerId: number,
    profile: OdooCustomerProfile,
  ): Promise<OdooCustomerResult>
  updateCustomerProfile(
    ctx: OdooCallContext,
    partnerId: number,
    input: {
      firstName?: string
      lastName?: string
      phone?: string | null
      shippingAddress?: Partial<OdooCustomerProfile> | null
    },
  ): Promise<void>
  syncProfessionalFlagFromPartner(ctx: OdooCallContext, partnerId: number): Promise<boolean>
}

export function createOdooCustomerAdapter(): OdooCustomerAdapter {
  if (env.ODOO_ENABLED && isOdooConfigured()) {
    return createLiveOdooCustomerAdapter()
  }
  return createMockOdooCustomerAdapter()
}
