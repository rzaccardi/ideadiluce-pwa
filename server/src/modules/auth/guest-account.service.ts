import { prisma } from '../../lib/prisma.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { TestCheckoutAddressInput } from '../integrations/integrations.validators.js'
import { provisionOdooAccountAfterOrder } from './odoo-account-sync.service.js'

const customerAdapter = createOdooCustomerAdapter()

type OrderMetadata = {
  createAccount?: boolean
  guestAccountCreated?: boolean
}

function parseShippingAddress(json: unknown): TestCheckoutAddressInput | null {
  if (!json || typeof json !== 'object') return null
  const address = json as Record<string, unknown>
  if (typeof address.line1 !== 'string' || !address.line1.trim()) return null
  return {
    firstName: typeof address.firstName === 'string' ? address.firstName : '',
    lastName: typeof address.lastName === 'string' ? address.lastName : '',
    line1: address.line1,
    streetNumber: typeof address.streetNumber === 'string' ? address.streetNumber : '',
    isSnc: address.isSnc === true,
    line2: typeof address.line2 === 'string' ? address.line2 : undefined,
    city: typeof address.city === 'string' ? address.city : '',
    postalCode: typeof address.postalCode === 'string' ? address.postalCode : '',
    country: typeof address.country === 'string' ? address.country : 'IT',
    phone: typeof address.phone === 'string' ? address.phone : undefined,
    courierNotes: typeof address.courierNotes === 'string' ? address.courierNotes : undefined,
  }
}

/** Crea account PWA + utente portal Odoo; credenziali inviate via email Odoo. */
export async function finalizeGuestAccountForOrder(orderId: string): Promise<void> {
  const order = await prisma.pwaOrder.findUnique({ where: { id: orderId } })
  if (!order || order.userId) return

  const meta = (order.metadataJson ?? {}) as OrderMetadata
  if (!meta.createAccount || meta.guestAccountCreated) return

  const ctx: OdooCallContext = { correlationId: `guest-account:${orderId}` }
  const shipping = parseShippingAddress(order.shippingAddressJson)

  let odooProfile = shipping
  if (!odooProfile) {
    odooProfile = await customerAdapter.getCustomerProfileByEmail(ctx, order.email)
  }

  await provisionOdooAccountAfterOrder(ctx, {
    orderId: order.id,
    email: order.email,
    odooPartnerId: order.odooPartnerId,
    shippingProfile: odooProfile,
    sessionId: order.sessionId,
  })

  const user = await prisma.user.findUnique({ where: { email: order.email.toLowerCase().trim() } })
  await prisma.pwaOrder.update({
    where: { id: order.id },
    data: {
      userId: user?.id ?? order.userId,
      metadataJson: { ...meta, guestAccountCreated: true },
    },
  })
}
