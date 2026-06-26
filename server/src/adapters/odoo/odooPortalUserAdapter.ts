import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from './odooClient.js'
import { normalizeOdooCreateId } from './odooId.js'

type PortalUserRow = { id: number; partner_id: [number, string] | number | false }

export type OdooPasswordResetResult = 'sent' | 'not_found' | 'mail_failed'

function isOdooPasswordResetNotFoundError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('no account found') ||
    lower.includes('nessun account') ||
    lower.includes('multiple accounts') ||
    lower.includes('più account') ||
    lower.includes('archived user') ||
    lower.includes('utente archiviat') ||
    lower.includes('cannot perform this action on an archived')
  )
}

function isOdooPasswordResetMailError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    (lower.includes('mail') || lower.includes('email')) &&
    (lower.includes('send') ||
      lower.includes('deliver') ||
      lower.includes('server') ||
      lower.includes('config') ||
      lower.includes('invia') ||
      lower.includes('consegn'))
  )
}

/** Richiede reset password nativo Odoo (`auth_signup` → email con link `/web/reset_password`). */
export async function requestOdooPasswordReset(
  ctx: OdooCallContext,
  email: string,
): Promise<OdooPasswordResetResult> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return 'not_found'

  const login = email.toLowerCase().trim()
  const portal = await findOdooPortalUserByEmail(ctx, login)
  if (!portal) {
    logger.info('odoo.password_reset_not_found', { correlationId: ctx.correlationId, email: login })
    return 'not_found'
  }

  try {
    await odooExecuteKw(ctx, 'res.users', 'action_reset_password', [[portal.odooUserId]], {})
    logger.info('odoo.password_reset_requested', {
      correlationId: ctx.correlationId,
      email: login,
      odooUserId: portal.odooUserId,
    })
    return 'sent'
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (isOdooPasswordResetNotFoundError(msg)) {
      logger.info('odoo.password_reset_not_found', { correlationId: ctx.correlationId, email: login })
      return 'not_found'
    }
    if (isOdooPasswordResetMailError(msg)) {
      logger.warn('odoo.password_reset_mail_failed', {
        correlationId: ctx.correlationId,
        email: login,
        error: msg,
      })
      return 'mail_failed'
    }
    logger.error('odoo.password_reset_failed', {
      correlationId: ctx.correlationId,
      email: login,
      error: msg,
    })
    throw e
  }
}

async function portalGroupId(ctx: OdooCallContext): Promise<number> {
  try {
    const ref = await odooExecuteKw<[string, number]>(
      ctx,
      'ir.model.data',
      'check_object_reference',
      ['base', 'group_portal'],
    )
    if (Array.isArray(ref) && typeof ref[1] === 'number') return ref[1]
  } catch {
    /* fallback search */
  }
  const ids = await odooExecuteKw<number[]>(
    ctx,
    'res.groups',
    'search',
    [[['full_name', 'ilike', 'Portal']]],
    { limit: 1 },
  )
  const id = ids[0]
  if (id == null) throw new Error('Gruppo portal Odoo non trovato')
  return id
}

export async function findOdooPortalUserByEmail(
  ctx: OdooCallContext,
  email: string,
): Promise<{ odooUserId: number; odooPartnerId: number } | null> {
  const login = email.toLowerCase().trim()
  const rows = await odooExecuteKw<PortalUserRow[]>(
    ctx,
    'res.users',
    'search_read',
    [[ '|', ['login', '=', login], ['email', '=', login] ]],
    { fields: ['id', 'partner_id'], limit: 1 },
  )
  const row = rows[0]
  if (!row) return null
  const partnerId = Array.isArray(row.partner_id) ? row.partner_id[0] : row.partner_id
  if (typeof partnerId !== 'number') return null
  return { odooUserId: row.id, odooPartnerId: partnerId }
}

export async function ensureOdooPortalUser(
  ctx: OdooCallContext,
  input: {
    email: string
    partnerId: number
    name: string
    password: string
  },
): Promise<{ odooUserId: number; created: boolean }> {
  const existing = await findOdooPortalUserByEmail(ctx, input.email)
  if (existing) {
    await odooExecuteKw(
      ctx,
      'res.users',
      'write',
      [[existing.odooUserId], { password: input.password, partner_id: input.partnerId }],
      {},
    )
    return { odooUserId: existing.odooUserId, created: false }
  }

  const groupId = await portalGroupId(ctx)
  const created = await odooExecuteKw<unknown>(
    ctx,
    'res.users',
    'create',
    [
      {
        name: input.name,
        login: input.email.toLowerCase().trim(),
        email: input.email.toLowerCase().trim(),
        partner_id: input.partnerId,
        groups_id: [[6, 0, [groupId]]],
        password: input.password,
      },
    ],
    {},
  )
  return { odooUserId: normalizeOdooCreateId(created), created: true }
}
