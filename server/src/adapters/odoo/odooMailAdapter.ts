import { env } from '../../config/env.js'
import { sendMail } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { normalizeOdooCreateId } from './odooId.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from './odooClient.js'
import {
  PWA_MAIL_TEMPLATES,
  buildPwaMailHeaders,
  renderPwaMailPlaceholders,
  textToMailHtml,
  type PwaMailTemplateKey,
} from './odoo-mail.templates.js'

export { PWA_ADMIN_MAIL_TO, type PwaMailTemplateKey } from './odoo-mail.templates.js'

export type OdooMailInput = {
  emailTo: string
  subject: string
  bodyText: string
  bodyHtml?: string
}

export type PwaMailAttachment = {
  filename: string
  content: Buffer
  mimetype?: string
}

export type PwaMailInput = {
  templateKey: PwaMailTemplateKey
  emailTo: string
  vars?: Record<string, string>
  replyTo?: string
  attachments?: PwaMailAttachment[]
}

const templateIdCache = new Map<PwaMailTemplateKey, number>()
let partnerModelIdCache: number | null = null

export function resetOdooMailTemplateCache(): void {
  templateIdCache.clear()
  partnerModelIdCache = null
}

function mailContext(ctx?: OdooCallContext): OdooCallContext {
  return ctx ?? { correlationId: `pwa-mail-${Date.now()}` }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

async function partnerModelId(ctx: OdooCallContext): Promise<number> {
  if (partnerModelIdCache != null) return partnerModelIdCache
  const rows = await odooExecuteKw<Array<{ id: number }>>(
    ctx,
    'ir.model',
    'search_read',
    [[['model', '=', 'res.partner']]],
    { fields: ['id'], limit: 1 },
  )
  const id = rows[0]?.id
  if (id == null) throw new Error('Modello res.partner non trovato in Odoo')
  partnerModelIdCache = id
  return id
}

async function findTemplateId(ctx: OdooCallContext, name: string): Promise<number | null> {
  const rows = await odooExecuteKw<Array<{ id: number }>>(
    ctx,
    'mail.template',
    'search_read',
    [[['name', '=', name]]],
    { fields: ['id'], limit: 1 },
  )
  return rows[0]?.id ?? null
}

async function createTemplate(ctx: OdooCallContext, key: PwaMailTemplateKey): Promise<number> {
  const def = PWA_MAIL_TEMPLATES[key]
  const modelId = await partnerModelId(ctx)
  const created = await odooExecuteKw<unknown>(
    ctx,
    'mail.template',
    'create',
    [
      {
        name: def.name,
        model_id: modelId,
        subject: def.subject,
        body_html: def.bodyHtml,
        auto_delete: false,
      },
    ],
    {},
  )
  return normalizeOdooCreateId(created)
}

async function ensureTemplateId(ctx: OdooCallContext, key: PwaMailTemplateKey): Promise<number> {
  const cached = templateIdCache.get(key)
  if (cached != null) return cached

  const def = PWA_MAIL_TEMPLATES[key]
  const existing = await findTemplateId(ctx, def.name)
  const id = existing ?? (await createTemplate(ctx, key))
  templateIdCache.set(key, id)
  return id
}

async function readTemplateContent(
  ctx: OdooCallContext,
  templateId: number,
  key: PwaMailTemplateKey,
): Promise<{ subject: string; bodyHtml: string }> {
  const rows = await odooExecuteKw<Array<{ subject: string | false; body_html: string | false }>>(
    ctx,
    'mail.template',
    'search_read',
    [[['id', '=', templateId]]],
    { fields: ['subject', 'body_html'], limit: 1 },
  )
  const def = PWA_MAIL_TEMPLATES[key]
  const row = rows[0]
  return {
    subject: (typeof row?.subject === 'string' && row.subject.trim()) || def.subject,
    bodyHtml: (typeof row?.body_html === 'string' && row.body_html.trim()) || def.bodyHtml,
  }
}

async function createAttachments(ctx: OdooCallContext, files: PwaMailAttachment[]): Promise<number[]> {
  const ids: number[] = []
  for (const file of files) {
    const created = await odooExecuteKw<unknown>(
      ctx,
      'ir.attachment',
      'create',
      [
        {
          name: file.filename,
          datas: file.content.toString('base64'),
          type: 'binary',
          mimetype: file.mimetype || 'application/octet-stream',
        },
      ],
      {},
    )
    ids.push(normalizeOdooCreateId(created))
  }
  return ids
}

async function sendViaOdooMail(
  ctx: OdooCallContext,
  input: {
    emailTo: string
    subject: string
    bodyHtml: string
    bodyText: string
    templateKey: PwaMailTemplateKey
    replyTo?: string
    attachmentIds?: number[]
  },
): Promise<void> {
  const vals: Record<string, unknown> = {
    email_to: input.emailTo,
    subject: input.subject,
    body_html: input.bodyHtml,
    body: input.bodyText,
    auto_delete: false,
    headers: buildPwaMailHeaders(input.templateKey),
  }
  if (input.replyTo) vals.reply_to = input.replyTo
  if (input.attachmentIds?.length) vals.attachment_ids = [[6, 0, input.attachmentIds]]

  const created = await odooExecuteKw<unknown>(ctx, 'mail.mail', 'create', [vals], {})
  const mailId = normalizeOdooCreateId(created)
  await odooExecuteKw(ctx, 'mail.mail', 'send', [[mailId]], {})
  await assertOdooMailAccepted(ctx, mailId)
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const t = value.trim()
  return t ? t : null
}

export function formatOdooMailFailure(row: {
  failure_reason?: unknown
  failure_type?: unknown
}): string {
  const reason = textOrNull(row.failure_reason)
  if (reason) return reason
  const type = textOrNull(row.failure_type)
  if (type) return `Invio Odoo fallito (${type})`
  return 'Invio Odoo fallito: il server di posta ha rifiutato il messaggio'
}

class OdooMailDeliveryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OdooMailDeliveryError'
  }
}

/** Rilegge `mail.mail` dopo `send`: Odoo marca `sent` se SMTP accetta, `exception` se rifiuta. */
async function assertOdooMailAccepted(ctx: OdooCallContext, mailId: number): Promise<void> {
  let row: { state?: unknown; failure_reason?: unknown; failure_type?: unknown } | null = null
  try {
    const rows = await odooExecuteKw<Array<Record<string, unknown>>>(
      ctx,
      'mail.mail',
      'read',
      [[mailId]],
      { fields: ['state', 'failure_reason', 'failure_type'] },
    )
    row = rows[0] ?? null
  } catch (e) {
    logger.warn('odoo.mail_state_read_failed', {
      correlationId: ctx.correlationId,
      mailId,
      error: e instanceof Error ? e.message : String(e),
    })
    return
  }
  const state = textOrNull(row?.state)
  if (state === 'exception' || state === 'cancel') {
    throw new OdooMailDeliveryError(formatOdooMailFailure(row ?? {}))
  }
}

async function fallbackSmtp(input: {
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
  attachments?: PwaMailAttachment[]
}): Promise<void> {
  await sendMail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
    attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  })
}

async function sendViaSmtpFallback(input: PwaMailInput, to: string, vars: Record<string, string>): Promise<void> {
  const def = PWA_MAIL_TEMPLATES[input.templateKey]
  const subject = renderPwaMailPlaceholders(def.subject, vars, 'text')
  const html = renderPwaMailPlaceholders(def.bodyHtml, vars, 'html')
  await fallbackSmtp({
    to,
    subject,
    text: vars.body_text || stripHtml(html),
    html,
    replyTo: input.replyTo,
    attachments: input.attachments,
  })
}

/**
 * Invia una email transazionale tramite Odoo (`mail.template` + `mail.mail`).
 * Se Odoo è giù o in modalità emergenza, usa SMTP di fallback.
 */
export async function sendPwaMail(ctx: OdooCallContext | undefined, input: PwaMailInput): Promise<void> {
  const to = input.emailTo.toLowerCase().trim()
  const vars = input.vars ?? {}
  const def = PWA_MAIL_TEMPLATES[input.templateKey]
  const callCtx = mailContext(ctx)

  const { isEmergencyMode, isSmtpFallbackEnabled } = await import(
    '../../modules/odoo/odoo-resilience.settings.js'
  )
  const skipOdoo = !env.ODOO_ENABLED || !isOdooConfigured() || (await isEmergencyMode())

  if (skipOdoo) {
    await sendViaSmtpFallback(input, to, vars)
    return
  }

  try {
    const templateId = await ensureTemplateId(callCtx, input.templateKey)
    const stored = await readTemplateContent(callCtx, templateId, input.templateKey)
    const subject = renderPwaMailPlaceholders(stored.subject, vars, 'text')
    const bodyHtml = renderPwaMailPlaceholders(stored.bodyHtml, vars, 'html')
    const bodyText = vars.body_text || stripHtml(bodyHtml)
    const attachmentIds = input.attachments?.length
      ? await createAttachments(callCtx, input.attachments)
      : undefined

    await sendViaOdooMail(callCtx, {
      emailTo: to,
      subject,
      bodyHtml,
      bodyText,
      templateKey: input.templateKey,
      replyTo: input.replyTo,
      attachmentIds,
    })
  } catch (e) {
    if (e instanceof OdooMailDeliveryError) {
      logger.error('odoo.mail_send_rejected', {
        correlationId: callCtx.correlationId,
        to,
        templateKey: input.templateKey,
        error: e.message,
      })
      if (await isSmtpFallbackEnabled()) {
        logger.warn('odoo.mail_smtp_fallback', {
          correlationId: callCtx.correlationId,
          to,
          templateKey: input.templateKey,
        })
        await sendViaSmtpFallback(input, to, vars)
        return
      }
      throw e
    }
    logger.warn('odoo.mail_template_send_failed', {
      correlationId: callCtx.correlationId,
      to,
      templateKey: input.templateKey,
      error: e instanceof Error ? e.message : String(e),
    })
    try {
      const subject = renderPwaMailPlaceholders(def.subject, vars, 'text')
      const bodyHtml = renderPwaMailPlaceholders(def.bodyHtml, vars, 'html')
      await sendViaOdooMail(callCtx, {
        emailTo: to,
        subject,
        bodyHtml,
        bodyText: vars.body_text || stripHtml(bodyHtml),
        templateKey: input.templateKey,
        replyTo: input.replyTo,
      })
    } catch (inner) {
      logger.error('odoo.mail_send_failed', {
        correlationId: callCtx.correlationId,
        to,
        templateKey: input.templateKey,
        error: inner instanceof Error ? inner.message : String(inner),
      })
      if (await isSmtpFallbackEnabled()) {
        logger.warn('odoo.mail_smtp_fallback', {
          correlationId: callCtx.correlationId,
          to,
          templateKey: input.templateKey,
        })
        await sendViaSmtpFallback(input, to, vars)
        return
      }
      throw inner
    }
  }
}

/** Invia email transazionale tramite Odoo (`mail.template` generico + `mail.mail`). */
export async function sendOdooTransactionalMail(
  ctx: OdooCallContext,
  input: OdooMailInput,
): Promise<void> {
  await sendPwaMail(ctx, {
    templateKey: 'generic',
    emailTo: input.emailTo,
    vars: {
      subject: input.subject,
      body_text: input.bodyText,
      body_html: input.bodyHtml ?? textToMailHtml(input.bodyText),
    },
  })
}
