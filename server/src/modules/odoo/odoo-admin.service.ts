import type { Request } from 'express'
import { odooExecuteKw, isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import type {
  OdooPaginatedDTO,
  OdooPricelistAssignmentDTO,
  OdooPricelistDTO,
  OdooQuotationDetailDTO,
  OdooSaleDocumentDTO,
  OdooStatusDTO,
} from '../../types/odoo.dto.js'
import { odooIntegrationService } from '../integrations/odoo-integration.service.js'
import { odooSalesService } from './odoo-sales.service.js'
import { odooSyncQueueService } from './odoo-sync-queue.service.js'
import type {
  odooAdminListQuerySchema,
  odooAdminPricelistAssignmentSchema,
  odooAdminPricelistQuerySchema,
  odooSyncQueueListQuerySchema,
} from './odoo-admin.validators.js'
import type { z } from 'zod'

const PWA_CUSTOM_FIELDS = [
  'x_pwa_checkout_status',
  'x_pwa_payment_status',
  'x_pwa_payment_method',
  'x_pwa_cart_token',
  'x_pwa_session_id',
  'x_pwa_abandoned_at',
  'x_pwa_last_payment_error',
  'x_pwa_provider_transaction_id',
  'client_order_ref',
] as const

function adminCtx(req?: Request): OdooCallContext {
  return { correlationId: req?.correlationId ?? 'admin-odoo', req }
}

function emptyPage<T>(query: { page: number; pageSize: number }): OdooPaginatedDTO<T> {
  return {
    items: [],
    page: query.page,
    pageSize: query.pageSize,
    total: 0,
    totalPages: 1,
    configured: false,
  }
}

async function readCustomFieldsAvailable(ctx: OdooCallContext): Promise<string[]> {
  const fields = await odooExecuteKw<Record<string, unknown>>(
    ctx,
    'sale.order',
    'fields_get',
    [],
    { attributes: ['string'] },
  )
  const available = new Set(Object.keys(fields))
  return PWA_CUSTOM_FIELDS.filter((f) => available.has(f))
}

export const odooAdminService = {
  async getStatus(req?: Request): Promise<OdooStatusDTO> {
    const notes: string[] = []
    const mode = 'odoo18-xmlrpc' as const

    if (!env.ODOO_ENABLED) {
      notes.push('ODOO_ENABLED è false — nessuna chiamata remota.')
      return { enabled: false, configured: false, mode, notes, pingOk: false }
    }

    if (!isOdooConfigured()) {
      notes.push(
        'ODOO_ENABLED ma configurazione XML-RPC incompleta: servono ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD.',
      )
      return { enabled: true, configured: false, mode, notes, pingOk: false }
    }

    const ping = await odooIntegrationService.ping(req?.correlationId ?? 'admin-odoo-status')
    notes.push(...ping.notes)

    let customFieldsAvailable: string[] | undefined
    try {
      customFieldsAvailable = await readCustomFieldsAvailable(adminCtx(req))
      const missing = PWA_CUSTOM_FIELDS.filter((f) => !customFieldsAvailable!.includes(f))
      if (missing.length > 0) {
        notes.push(`Campi custom assenti su sale.order: ${missing.join(', ')}`)
      }
    } catch (e) {
      notes.push(`fields_get fallito: ${e instanceof Error ? e.message : String(e)}`)
    }

    return {
      enabled: true,
      configured: true,
      mode,
      notes,
      pingOk: Boolean(ping.ok),
      customFieldsAvailable,
    }
  },

  listQuotations(
    query: z.infer<typeof odooAdminListQuerySchema>,
    req?: Request,
  ): Promise<OdooPaginatedDTO<OdooSaleDocumentDTO>> {
    if (!isOdooConfigured()) {
      return Promise.resolve(emptyPage<OdooSaleDocumentDTO>(query))
    }
    return odooSalesService.listQuotations(adminCtx(req), query) as Promise<
      OdooPaginatedDTO<OdooSaleDocumentDTO>
    >
  },

  listOrders(
    query: z.infer<typeof odooAdminListQuerySchema>,
    req?: Request,
  ): Promise<OdooPaginatedDTO<OdooSaleDocumentDTO>> {
    if (!isOdooConfigured()) {
      return Promise.resolve(emptyPage<OdooSaleDocumentDTO>(query))
    }
    return odooSalesService.listConfirmedOrders(adminCtx(req), query) as Promise<
      OdooPaginatedDTO<OdooSaleDocumentDTO>
    >
  },

  async getQuotationDetail(
    quotationId: number,
    req?: Request,
  ): Promise<OdooQuotationDetailDTO | null> {
    if (!isOdooConfigured()) return null
    return odooSalesService.getQuotationDetail(adminCtx(req), quotationId)
  },

  listPricelists(
    query: z.infer<typeof odooAdminPricelistQuerySchema>,
    req?: Request,
  ): Promise<OdooPaginatedDTO<OdooPricelistDTO>> {
    if (!isOdooConfigured()) {
      return Promise.resolve(emptyPage<OdooPricelistDTO>(query))
    }
    return odooSalesService.listPricelists(adminCtx(req), query) as Promise<
      OdooPaginatedDTO<OdooPricelistDTO>
    >
  },

  async assignPricelist(
    body: z.infer<typeof odooAdminPricelistAssignmentSchema>,
    req?: Request,
  ): Promise<OdooPricelistAssignmentDTO> {
    if (!env.ODOO_ENABLED || !isOdooConfigured()) {
      throw new AppError(
        'ODOO_NOT_CONFIGURED',
        'Odoo not configured',
        'Odoo non configurato: impossibile assegnare il listino.',
        503,
        false,
      )
    }

    const ctx = adminCtx(req)
    const resolved = await odooSalesService.resolvePartnerIdForUserOrEmail(ctx, {
      partnerId: body.partnerId,
      email: body.email,
      userId: body.userId,
    })

    const assignment = await odooSalesService.assignPricelistToPartner(
      ctx,
      resolved.partnerId,
      body.pricelistId,
    )

    let localUserUpdated = false
    if (body.userId) {
      await prisma.user.update({
        where: { id: body.userId },
        data: { odooPricelistId: body.pricelistId },
      })
      localUserUpdated = true
    } else if (resolved.userId) {
      await prisma.user.update({
        where: { id: resolved.userId },
        data: { odooPricelistId: body.pricelistId },
      })
      localUserUpdated = true
    }

    return {
      ...assignment,
      userId: body.userId ?? resolved.userId ?? null,
      email: resolved.email ?? body.email ?? null,
      localUserUpdated,
    }
  },

  listSyncQueue(query: z.infer<typeof odooSyncQueueListQuerySchema>) {
    return odooSyncQueueService.list(query)
  },

  retrySyncQueueItem(id: string, req?: Request) {
    return odooSyncQueueService.retryById(id, req)
  },
}
