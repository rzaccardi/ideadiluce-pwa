import type { Request } from 'express'
import {
  buildOdooMailWebUrl,
  getOdooWebBaseUrlOrNull,
  isOdooConfigured,
  odooExecuteKw,
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

function adminCtx(req?: Request): OdooCallContext {
  return { correlationId: req?.correlationId ?? 'admin-mail-log', req }
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
    for (const row of rows) {
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
    const domain = buildPwaMailLogDomain(query)
    const offset = (query.page - 1) * query.pageSize
    const [total, rows] = await Promise.all([
      odooExecuteKw<number>(ctx, 'mail.mail', 'search_count', [domain], {}),
      odooExecuteKw<Array<Record<string, unknown>>>(ctx, 'mail.mail', 'search_read', [domain], {
        fields: [...LIST_FIELDS],
        limit: query.pageSize,
        offset,
        order: 'id desc',
      }),
    ])

    const pwaRows = rows.filter(isPwaMailRecord)
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
    const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
      ctx,
      'mail.mail',
      'search_read',
      [[['id', '=', id]]],
      { fields: [...DETAIL_FIELDS], limit: 1 },
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
  },
}
