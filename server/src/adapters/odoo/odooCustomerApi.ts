import type { OdooCallContext } from './odooClient.js'
import type {
  FindOrCreateCustomerInput,
  OdooBusinessProfile,
  OdooCustomerAdapter,
  OdooCustomerProfile,
  OdooCustomerResult,
  OdooShippingDestination,
} from './odooCustomerAdapter.js'
import { AppError } from '../../types/errors.js'
import {
  odooShippingAddressId,
  parseOdooShippingAddressId,
  shippingAddressesMatch,
} from './odoo-partner-shipping.js'
import { OdooApiV2Error, toOdooApiV2AppError } from '../odoo-api/odooApiClient.js'
import {
  odooApiCreateCustomerAddress,
  odooApiGetCustomer,
  odooApiUpsertCustomer,
  odooApiValidateCustomer,
} from '../odoo-api/odooApi.resources.js'
import {
  buildOdooApiAddressWrite,
  buildOdooApiCustomerWrite,
  firstBlockingIssue,
  odooApiAddressToProfile,
  odooApiCustomerToAccount,
} from '../odoo-api/odooApi.mapping.js'
import type { OdooApiCustomer, OdooApiCustomerWrite } from '../odoo-api/odooApi.types.js'

function wrap(err: unknown, ctx: OdooCallContext): never {
  if (err instanceof AppError) throw err
  if (err instanceof OdooApiV2Error) throw toOdooApiV2AppError(err, ctx.correlationId)
  throw err
}

async function upsertWithValidate(
  ctx: OdooCallContext,
  payload: OdooApiCustomerWrite,
): Promise<OdooApiCustomer> {
  try {
    const validation = await odooApiValidateCustomer(payload, ctx.correlationId)
    const blocking = firstBlockingIssue(validation.issues)
    if (blocking) {
      throw new AppError(
        'ODOO_API_VALIDATION',
        blocking,
        blocking,
        422,
        false,
        { issues: validation.issues, correlationId: ctx.correlationId },
      )
    }
  } catch (e) {
    if (e instanceof AppError) throw e
    /* validate è best-effort: il POST resta la fonte di verità */
  }
  return odooApiUpsertCustomer(payload, ctx.correlationId)
}

function destinationsFromCustomer(customer: OdooApiCustomer): OdooShippingDestination[] {
  const main = customer.main_address
  const out: OdooShippingDestination[] = []
  if (main) {
    out.push({
      odooPartnerId: main.id,
      kind: 'parent',
      label: main.name || customer.name || customer.email,
      profile: odooApiAddressToProfile(main, customer.email),
    })
  } else {
    out.push({
      odooPartnerId: customer.id,
      kind: 'parent',
      label: customer.name || customer.email,
      profile: odooApiCustomerToAccount(customer).profile,
    })
  }
  for (const addr of customer.addresses ?? []) {
    out.push({
      odooPartnerId: addr.id,
      kind: addr.type === 'delivery' ? 'delivery' : 'contact',
      label: addr.name || customer.name || customer.email,
      profile: odooApiAddressToProfile(addr, customer.email),
    })
  }
  return out
}

export function createApiV2OdooCustomerAdapter(): OdooCustomerAdapter {
  return {
    async findCustomerByEmail(_ctx, _email) {
      return null
    },

    async getCustomerProfileByEmail(ctx, email) {
      try {
        const account = await this.getCustomerAccountByEmail(ctx, email)
        return account?.profile ?? null
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async getCustomerAccountByEmail(_ctx, _email) {
      return null
    },

    async getCustomerAccountByPartnerId(ctx, partnerId) {
      try {
        const customer = await odooApiGetCustomer(partnerId, ctx.correlationId)
        return odooApiCustomerToAccount(customer)
      } catch (e) {
        if (e instanceof OdooApiV2Error && e.httpStatus === 404) return null
        wrap(e, ctx)
      }
    },

    async createCustomer(ctx, input) {
      try {
        const customer = await upsertWithValidate(ctx, buildOdooApiCustomerWrite(input))
        return { odooPartnerId: customer.id }
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async findOrCreateCustomer(ctx, input) {
      try {
        const customer = await upsertWithValidate(ctx, buildOdooApiCustomerWrite(input))
        return { odooPartnerId: customer.id }
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async updateCustomerBusiness(ctx, partnerId, input: OdooBusinessProfile) {
      try {
        const current = await odooApiGetCustomer(partnerId, ctx.correlationId)
        await upsertWithValidate(ctx, {
          ...buildOdooApiCustomerWrite({
            email: current.email,
            firstName: current.name,
            business: input,
          }),
          email: current.email,
        })
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async createDeliveryPartner(ctx, parentPartnerId, profile) {
      try {
        const created = await odooApiCreateCustomerAddress(
          parentPartnerId,
          buildOdooApiAddressWrite(profile),
          ctx.correlationId,
        )
        return { odooPartnerId: created.id }
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async listShippingDestinations(ctx, parentPartnerId) {
      try {
        const customer = await odooApiGetCustomer(parentPartnerId, ctx.correlationId)
        return destinationsFromCustomer(customer)
      } catch (e) {
        if (e instanceof OdooApiV2Error && e.httpStatus === 404) return []
        wrap(e, ctx)
      }
    },

    async updateDeliveryPartner(ctx, partnerId, profile) {
      try {
        await odooApiCreateCustomerAddress(
          partnerId,
          buildOdooApiAddressWrite(profile),
          ctx.correlationId,
        )
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async archiveDeliveryPartner() {
      /* API v2 non espone delete indirizzi */
    },

    async resolveOrderShippingPartner(ctx, parentPartnerId, input) {
      try {
        if (input.dropshipAddress && input.dropshipAddress.line1 && input.dropshipAddress.city) {
          const created = await this.createDeliveryPartner(
            ctx,
            parentPartnerId,
            input.dropshipAddress as OdooCustomerProfile,
          )
          return created
        }
        const fromId = parseOdooShippingAddressId(input.shippingAddress?.id)
        if (fromId) return { odooPartnerId: fromId }

        const dest = await this.listShippingDestinations(ctx, parentPartnerId)
        const wanted = input.shippingAddress
        if (wanted?.line1 && wanted.city) {
          const match = dest.find((d) =>
            shippingAddressesMatch(d.profile, wanted as Partial<OdooCustomerProfile>),
          )
          if (match) return { odooPartnerId: match.odooPartnerId }
          return this.createDeliveryPartner(ctx, parentPartnerId, wanted as OdooCustomerProfile)
        }
        return { odooPartnerId: parentPartnerId }
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async updateCustomerProfile(ctx, partnerId, input) {
      try {
        const current = await odooApiGetCustomer(partnerId, ctx.correlationId)
        const payload = buildOdooApiCustomerWrite({
          email: current.email,
          firstName: input.firstName ?? current.name,
          lastName: input.lastName,
          phone: input.phone,
          billingAddress: input.shippingAddress
            ? {
                firstName: input.firstName ?? '',
                lastName: input.lastName ?? '',
                line1: input.shippingAddress.line1 ?? '',
                streetNumber: input.shippingAddress.streetNumber ?? '',
                isSnc: input.shippingAddress.isSnc ?? false,
                line2: input.shippingAddress.line2,
                city: input.shippingAddress.city ?? '',
                postalCode: input.shippingAddress.postalCode ?? '',
                country: input.shippingAddress.country ?? 'IT',
                phone: input.phone ?? input.shippingAddress.phone,
              }
            : undefined,
        })
        await upsertWithValidate(ctx, { ...payload, email: current.email })
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async syncProfessionalFlagFromPartner(ctx, partnerId) {
      try {
        const customer = await odooApiGetCustomer(partnerId, ctx.correlationId)
        return Boolean(customer.is_company || customer.vat)
      } catch (e) {
        if (e instanceof OdooApiV2Error && e.httpStatus === 404) return false
        wrap(e, ctx)
      }
    },
  }
}

export function odooShippingIdFromResult(result: OdooCustomerResult): string {
  return odooShippingAddressId(result.odooPartnerId)
}

export type { FindOrCreateCustomerInput }
