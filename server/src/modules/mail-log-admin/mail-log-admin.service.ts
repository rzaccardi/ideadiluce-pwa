import type { Request } from 'express'
import {
  buildOdooMailWebUrl,
  getOdooWebBaseUrlOrNull,
  isOdooConfigured,
  odooExecuteKw,
  toAppError,
  type OdooCallContext,
} from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import { AppError } from '../../types/errors.js'
import {
  buildPwaMailLogDomain,
  isPwaMailRecord,
  mapMailLogDetail,
  mapMailLogListItem,
  mapMailNotificationHint,
  type MailLogAttachmentDTO,
  type MailLogDetailDTO,
  type MailLogListDTO,
  type MailLogNotificationHint,
  type MailLogOdooCapabilities,
} from './mail-log-admin.mapper.js'
import type { mailLogAdminListQuerySchema } from './mail-log-admin.validators.js'
import type { z } from 'zod'

const LIST_FIELDS = [
  'id',
  'subject',
  'email_to',
  'email_from',
  'state',
  'date',
  'create_date',
  'mail_template_id',
  'failure_reason',
  'failure_type',
  'headers',
] as const

const DETAIL_FIELDS = [...LIST_FIELDS, 'body_html', 'body', 'reply_to', 'attachment_ids'] as const

const FIELDS_GET_TTL_MS = 30 * 60 * 1000
let mailMailFieldsCache: { at: number; fields: Set<string> } | null = null

export function resetMailLogAdminFieldsCache() {
  mailMailFieldsCache = null
}

function adminCtx(req?: Request): OdooCallContext {
  return { correlationId: req?.correlationId ?? 'admin-mail-log', req }
}

function asRows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => row != null && typeof row === 'object') : []
}

function pickFields(desired: readonly string[], available: Set<string>): string[] {
  const picked = desired.filter((field) => field === 'id' || available.has(field))
  return picked.length > 0 ? picked : ['id']
}

function capabilitiesFromFields(available: Set<string>): MailLogOdooCapabilities {
  return {
    hasHeaders: available.has('headers'),
    hasMailTemplateId: available.has('mail_template_id'),
    hasFailureType: available.has('failure_type'),
    hasFailureReason: available.has('failure_reason'),
  }
}

async function mailMailAvailableFields(ctx: OdooCallContext): Promise<Set<string>> {
  if (mailMailFieldsCache && Date.now() - mailMailFieldsCache.at < FIELDS_GET_TTL_MS) {
    return mailMailFieldsCache.fields
  }
  const fields = await odooExecuteKw<Record<string, unknown>>(ctx, 'mail.mail', 'fields_get', [], {
    attributes: ['string'],
  })
  const set = new Set(Object.keys(fields ?? {}))
  mailMailFieldsCache = { at: Date.now(), fields: set }
  return set
}

function wrapOdooError(e: unknown, correlationId: string): never {
  if (e instanceof AppError) throw e
  throw toAppError(e, correlationId)
}

function emptyPage(query: { page: number; pageSize: number }): MailLogListDTO {
  return {
    items: [],
    page: query.page,
    pageSize: query.pageSize,
    total: 0,
    totalPages: 1,
    configured: false,
  }
}

function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

async function loadNotificationsByMailIds(
  ctx: OdooCallContext,
  mailIds: number[],
): Promise<Map<number, MailLogNotificationHint>> {
  const map = new Map<number, MailLogNotificationHint>()
  if (mailIds.length === 0) return map
  try {
    const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
      ctx,
      'mail.notification',
      'search_read',
      [[['mail_mail_id', 'in', mailIds]]],
      { fields: ['mail_mail_id', 'notification_status', 'failure_type', 'failure_reason'] },
    )
    for (const row of asRows(rows)) {
      const mapped = mapMailNotificationHint(row)
      if (mapped.mailId == null) continue
      const prev = map.get(mapped.mailId)
      const preferBounce =
        mapped.hint.status === 'bounce' || mapped.hint.status === 'exception' || !prev
      if (preferBounce) map.set(mapped.mailId, mapped.hint)
    }
  } catch {
    /* mail.notification può non essere esposto o mancare dei campi: lo storico resta su mail.mail */
  }
  return map
}

async function loadAttachments(
  ctx: OdooCallContext,
  ids: unknown,
): Promise<MailLogAttachmentDTO[]> {
  if (!Array.isArray(ids) || ids.length === 0) return []
  const numeric = ids.filter((id): id is number => typeof id === 'number' && id > 0)
  if (numeric.length === 0) return []
  const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
    ctx,
    'ir.attachment',
    'read',
    [numeric],
    { fields: ['id', 'name', 'mimetype'] },
  )
  return rows.map((row) => ({
    id: Number(row.id),
    name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : `allegato-${row.id}`,
    mimetype: typeof row.mimetype === 'string' ? row.mimetype : null,
  }))
}

export const mailLogAdminService = {
  async list(
    query: z.infer<typeof mailLogAdminListQuerySchema>,
    req?: Request,
  ): Promise<MailLogListDTO> {
    if (!env.ODOO_ENABLED || !isOdooConfigured()) {
      return emptyPage(query)
    }

    const ctx = adminCtx(req)
    try {
      const available = await mailMailAvailableFields(ctx)
      const caps = capabilitiesFromFields(available)
      if (!caps.hasHeaders && !caps.hasMailTemplateId) {
        throw new AppError(
          'MAIL_LOG_UNSUPPORTED',
          'mail.mail lacks headers and mail_template_id',
          'Questa versione di Odoo non espone i campi per riconoscere le email del sito.',
          503,
          false,
        )
      }

      const domain = buildPwaMailLogDomain(query, caps)
      const offset = (query.page - 1) * query.pageSize
      const [totalRaw, rowsRaw] = await Promise.all([
        odooExecuteKw<number>(ctx, 'mail.mail', 'search_count', [domain], {}),
        odooExecuteKw<unknown>(ctx, 'mail.mail', 'search_read', [domain], {
          fields: pickFields(LIST_FIELDS, available),
          limit: query.pageSize,
          offset,
          order: 'id desc',
        }),
      ])

      const total = typeof totalRaw === 'number' && Number.isFinite(totalRaw) ? totalRaw : 0
      const pwaRows = asRows(rowsRaw).filter(isPwaMailRecord)
      const notifications = await loadNotificationsByMailIds(
        ctx,
        pwaRows.map((row) => Number(row.id)).filter((id) => Number.isFinite(id) && id > 0),
      )

      return {
        items: pwaRows.map((row) => mapMailLogListItem(row, notifications.get(Number(row.id)))),
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: totalPages(total, query.pageSize),
        configured: true,
      }
    } catch (e) {
      wrapOdooError(e, ctx.correlationId)
    }
  },

  async getById(id: number, req?: Request): Promise<MailLogDetailDTO> {
    if (!env.ODOO_ENABLED || !isOdooConfigured()) {
      throw new AppError(
        'ODOO_NOT_CONFIGURED',
        'Odoo not configured',
        'Odoo non configurato: lo storico email è in Odoo.',
        503,
        false,
      )
    }

    const ctx = adminCtx(req)
    try {
      const available = await mailMailAvailableFields(ctx)
      const rows = asRows(
        await odooExecuteKw<unknown>(
          ctx,
          'mail.mail',
          'search_read',
          [[['id', '=', id]]],
          { fields: pickFields(DETAIL_FIELDS, available), limit: 1 },
        ),
      )
      const row = rows[0]
      if (!row || !isPwaMailRecord(row)) {
        throw new AppError('MAIL_LOG_NOT_FOUND', 'Mail not found', 'Email non trovata.', 404, false)
      }

      const base = getOdooWebBaseUrlOrNull()
      const odooUrl = base ? buildOdooMailWebUrl(base, id) : null
      const [attachments, notifications] = await Promise.all([
        loadAttachments(ctx, row.attachment_ids),
        loadNotificationsByMailIds(ctx, [id]),
      ])
      return mapMailLogDetail(row, attachments, odooUrl, notifications.get(id))
    } catch (e) {
      wrapOdooError(e, ctx.correlationId)
    }
  },
}
