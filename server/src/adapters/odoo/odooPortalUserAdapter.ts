import { env } from '../../config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from './odooClient.js'
import { normalizeOdooCreateId } from './odooId.js'
import { isOdooApiV2Configured, OdooApiV2Error } from '../odoo-api/odooApiClient.js'
import { odooApiAuthRegister } from '../odoo-api/odooApi.resources.js'

type PortalUserRow = { id: number; partner_id: [number, string] | number | false }

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

  // Preferisci REST: POST /api/v2/auth/register (niente res.users.create / mail nativa XML-RPC).
  if (isOdooApiV2Configured()) {
    try {
      const registered = await odooApiAuthRegister(
        { customer_id: input.partnerId, password: input.password },
        ctx.correlationId,
      )
      return { odooUserId: registered.user_id, created: registered.created !== false }
    } catch (e) {
      if (e instanceof OdooApiV2Error && e.httpStatus === 409) {
        const again = await findOdooPortalUserByEmail(ctx, input.email)
        if (again) {
          await odooExecuteKw(
            ctx,
            'res.users',
            'write',
            [[again.odooUserId], { password: input.password, partner_id: input.partnerId }],
            {},
          )
          return { odooUserId: again.odooUserId, created: false }
        }
      }
      throw e
    }
  }

  const groupId = await portalGroupId(ctx)
  // Fallback XML-RPC: senza no_reset_password Odoo 18 invia l'invito auth_signup.
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
    { context: { no_reset_password: true } },
  )
  return { odooUserId: normalizeOdooCreateId(created), created: true }
}

/** Aggiorna login/email del portal user Odoo legato al partner (dopo cambio email PWA). */
export async function updateOdooPortalUserLogin(
  ctx: OdooCallContext,
  input: { partnerId: number; oldEmail: string; newEmail: string },
): Promise<void> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return

  const newLogin = input.newEmail.toLowerCase().trim()
  const oldLogin = input.oldEmail.toLowerCase().trim()
  if (!newLogin || newLogin === oldLogin) return

  const byOld = await findOdooPortalUserByEmail(ctx, oldLogin)
  let odooUserId = byOld && byOld.odooPartnerId === input.partnerId ? byOld.odooUserId : null

  if (odooUserId == null) {
    const rows = await odooExecuteKw<PortalUserRow[]>(
      ctx,
      'res.users',
      'search_read',
      [[['partner_id', '=', input.partnerId]]],
      { fields: ['id', 'partner_id'], limit: 1 },
    )
    const row = rows[0]
    if (row) odooUserId = row.id
  }

  if (odooUserId == null) return

  const conflict = await findOdooPortalUserByEmail(ctx, newLogin)
  if (conflict && conflict.odooUserId !== odooUserId) {
    throw new Error(`Odoo portal login già in uso: ${newLogin}`)
  }

  await odooExecuteKw(
    ctx,
    'res.users',
    'write',
    [[odooUserId], { login: newLogin, email: newLogin }],
    {},
  )
}
