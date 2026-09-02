import { odooExecuteKw, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'

const PICKING_DESIRED_FIELDS = [
  'id',
  'name',
  'origin',
  'state',
  'scheduled_date',
  'date_done',
  'carrier_id',
  'carrier_tracking_ref',
  'carrier_tracking_url',
  'picking_type_code',
  'sale_id',
] as const

export type OdooOutgoingPicking = {
  id: number
  name: string | null
  origin: string | null
  state: string | null
  scheduledDate: string | null
  dateDone: string | null
  carrierName: string | null
  trackingRef: string | null
  trackingUrl: string | null
}

function many2OneName(value: unknown): string | null {
  return Array.isArray(value) && typeof value[1] === 'string' ? value[1] : null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

let pickingFieldsCache: Set<string> | null = null

async function pickingFields(ctx: OdooCallContext): Promise<Set<string>> {
  if (pickingFieldsCache) return pickingFieldsCache
  const fields = await odooExecuteKw<Record<string, unknown>>(ctx, 'stock.picking', 'fields_get', [], {
    attributes: ['string'],
    context: { lang: env.ODOO_CATALOG_LANG },
  })
  pickingFieldsCache = new Set(Object.keys(fields))
  return pickingFieldsCache
}

export async function listOutgoingPickings(
  ctx: OdooCallContext,
  input: { saleOrderId: number; saleOrderName?: string | null },
): Promise<OdooOutgoingPicking[]> {
  const available = await pickingFields(ctx)
  const fields = PICKING_DESIRED_FIELDS.filter((field) => available.has(field))
  if (fields.length === 0) return []

  const domain: unknown[] = []
  if (available.has('picking_type_code')) {
    domain.push(['picking_type_code', '=', 'outgoing'])
  }
  const originClauses: unknown[] = []
  if (available.has('sale_id')) {
    originClauses.push(['sale_id', '=', input.saleOrderId])
  }
  if (input.saleOrderName?.trim()) {
    originClauses.push(['origin', 'ilike', input.saleOrderName.trim()])
  }
  if (originClauses.length === 2) {
    domain.push('|', originClauses[0], originClauses[1])
  } else if (originClauses.length === 1) {
    domain.push(originClauses[0])
  } else {
    return []
  }

  const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
    ctx,
    'stock.picking',
    'search_read',
    [domain],
    {
      fields,
      limit: 10,
      order: 'date_done desc, scheduled_date desc, id desc',
      context: { lang: env.ODOO_CATALOG_LANG },
    },
  )

  return rows.map((row) => ({
    id: Number(row.id),
    name: text(row.name),
    origin: text(row.origin),
    state: text(row.state),
    scheduledDate: text(row.scheduled_date),
    dateDone: text(row.date_done),
    carrierName: many2OneName(row.carrier_id),
    trackingRef: text(row.carrier_tracking_ref),
    trackingUrl: text(row.carrier_tracking_url),
  }))
}

export function primaryOutgoingPicking(pickings: OdooOutgoingPicking[]): OdooOutgoingPicking | null {
  if (pickings.length === 0) return null
  return (
    pickings.find((p) => p.state === 'done' && p.trackingRef) ??
    pickings.find((p) => Boolean(p.trackingRef)) ??
    pickings.find((p) => p.state === 'done') ??
    pickings[0] ??
    null
  )
}
