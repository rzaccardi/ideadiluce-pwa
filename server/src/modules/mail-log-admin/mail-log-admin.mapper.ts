import {
  PWA_MAIL_TEMPLATES,
  parsePwaMailTemplateKey,
  pwaMailTemplateLabel,
  type PwaMailTemplateKey,
} from '../../adapters/odoo/odoo-mail.templates.js'

export const MAIL_LOG_STATES = ['sent', 'outgoing', 'exception', 'cancel'] as const
export type MailLogState = (typeof MAIL_LOG_STATES)[number]

export type MailLogDeliveryState = 'sent' | 'outgoing' | 'exception' | 'bounce' | 'cancel'

export type MailLogNotificationHint = {
  status: string | null
  failureType: string | null
  failureReason: string | null
}

export type MailLogAttachmentDTO = {
  id: number
  name: string
  mimetype: string | null
}

export type MailLogListItemDTO = {
  id: number
  subject: string
  emailTo: string
  emailFrom: string | null
  state: string
  deliveryState: MailLogDeliveryState
  deliveryLabel: string
  deliveryNote: string
  sentAt: string | null
  templateKey: PwaMailTemplateKey | null
  templateLabel: string
  failureType: string | null
  failureReason: string | null
}

export type MailLogDetailDTO = MailLogListItemDTO & {
  replyTo: string | null
  bodyHtml: string
  bodyText: string
  odooUrl: string | null
  attachments: MailLogAttachmentDTO[]
}

export type MailLogListDTO = {
  items: MailLogListItemDTO[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  configured: boolean
}

function many2OneName(value: unknown): string | null {
  if (Array.isArray(value) && typeof value[1] === 'string' && value[1].trim()) return value[1].trim()
  return null
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const t = value.trim()
  return t ? t : null
}

export function odooDatetimeToIso(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const normalized = value.trim().replace(' ', 'T')
  const withZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`
  const d = new Date(withZone)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export type MailLogOdooCapabilities = {
  hasHeaders: boolean
  hasMailTemplateId: boolean
  hasFailureType: boolean
  hasFailureReason: boolean
}

export function isPwaMailRecord(row: {
  headers?: unknown
  mail_template_id?: unknown
}): boolean {
  const headers = text(row.headers) ?? ''
  if (headers.includes('X-PWA-Mail: 1') || headers.includes("'X-PWA-Mail'")) return true
  const templateName = many2OneName(row.mail_template_id) ?? ''
  return templateName.startsWith('[PWA]')
}

function orDomain(left: unknown, right: unknown): unknown[] {
  return ['|', left, right]
}

/** Domain PWA: in Odoo 18 `mail.mail` non ha `mail_template_id` — usare solo gli header. */
export function buildPwaMailLogDomain(
  query: {
    q?: string
    state?: string
    templateKey?: string
  },
  caps: MailLogOdooCapabilities,
): unknown[] {
  const identity: unknown[] = []
  if (caps.hasHeaders) identity.push(['headers', 'ilike', 'X-PWA-Mail'])
  if (caps.hasMailTemplateId) identity.push(['mail_template_id.name', '=like', '[PWA]%'])

  const domain: unknown[] =
    identity.length === 0 ? [] : identity.length === 1 ? [identity[0]] : orDomain(identity[0], identity[1])

  if (query.state === 'bounce') {
    const bounce: unknown[] = []
    if (caps.hasFailureType) bounce.push(['failure_type', 'ilike', 'bounce'])
    if (caps.hasFailureReason) bounce.push(['failure_reason', 'ilike', 'bounce'])
    if (bounce.length === 1) domain.push(bounce[0])
    else if (bounce.length >= 2) domain.push(...orDomain(bounce[0], bounce[1]))
    else domain.push(['state', '=', 'exception'])
  } else if (query.state && query.state !== 'all') {
    domain.push(['state', '=', query.state])
  }
  if (
    caps.hasHeaders &&
    query.templateKey &&
    query.templateKey !== 'all' &&
    query.templateKey in PWA_MAIL_TEMPLATES
  ) {
    domain.push(['headers', 'ilike', `X-PWA-Template: ${query.templateKey}`])
  }
  const q = query.q?.trim()
  if (q) {
    domain.push(...orDomain(['email_to', 'ilike', q], ['subject', 'ilike', q]))
  }
  return domain
}

function many2OneId(value: unknown): number | null {
  if (typeof value === 'number' && value > 0) return value
  if (Array.isArray(value) && typeof value[0] === 'number' && value[0] > 0) return value[0]
  return null
}

function isBounce(failureType: string | null, notificationStatus: string | null): boolean {
  const type = (failureType ?? '').toLowerCase()
  if (type.includes('bounce')) return true
  return notificationStatus === 'bounce'
}

export function deriveMailDelivery(input: {
  state: string
  failureType: string | null
  failureReason: string | null
  notificationStatus?: string | null
  notificationFailureReason?: string | null
}): {
  deliveryState: MailLogDeliveryState
  deliveryLabel: string
  deliveryNote: string
} {
  const reason = input.failureReason || input.notificationFailureReason
  if (isBounce(input.failureType, input.notificationStatus ?? null)) {
    return {
      deliveryState: 'bounce',
      deliveryLabel: 'Non consegnata',
      deliveryNote: reason
        ? `Odoo ha registrato un bounce: ${reason}`
        : 'Odoo ha registrato un bounce: il destinatario o il suo server ha rifiutato il messaggio.',
    }
  }
  if (input.state === 'exception') {
    return {
      deliveryState: 'exception',
      deliveryLabel: 'Errore invio',
      deliveryNote: reason
        ? `Odoo non è riuscito a inviare il messaggio: ${reason}`
        : 'Odoo non è riuscito a inviare il messaggio al server di posta.',
    }
  }
  if (input.state === 'cancel') {
    return {
      deliveryState: 'cancel',
      deliveryLabel: 'Annullata',
      deliveryNote: reason ?? 'Invio annullato in Odoo.',
    }
  }
  if (input.state === 'outgoing') {
    return {
      deliveryState: 'outgoing',
      deliveryLabel: 'In coda',
      deliveryNote: 'Odoo ha creato il messaggio ma non ha ancora confermato l’invio al server di posta.',
    }
  }
  return {
    deliveryState: 'sent',
    deliveryLabel: 'Inviata',
    deliveryNote:
      'Odoo conferma che il server di posta ha accettato il messaggio. Non è una conferma di lettura né che sia in inbox: un bounce può arrivare dopo.',
  }
}

function templateLabelFromRow(templateKey: PwaMailTemplateKey | null, mailTemplateId: unknown): string {
  if (templateKey) return pwaMailTemplateLabel(templateKey)
  const name = many2OneName(mailTemplateId)
  if (name) return name.replace(/^\[PWA\]\s*/, '')
  return 'Notifica PWA'
}

export function mapMailLogListItem(
  row: Record<string, unknown>,
  notification?: MailLogNotificationHint | null,
): MailLogListItemDTO {
  const templateKey = parsePwaMailTemplateKey(text(row.headers))
  const failureType = text(row.failure_type) ?? notification?.failureType ?? null
  const failureReason = text(row.failure_reason) ?? notification?.failureReason ?? null
  const delivery = deriveMailDelivery({
    state: text(row.state) || 'outgoing',
    failureType,
    failureReason,
    notificationStatus: notification?.status ?? null,
    notificationFailureReason: notification?.failureReason ?? null,
  })
  return {
    id: Number(row.id),
    subject: text(row.subject) || '(senza oggetto)',
    emailTo: text(row.email_to) || '—',
    emailFrom: text(row.email_from),
    state: text(row.state) || 'outgoing',
    deliveryState: delivery.deliveryState,
    deliveryLabel: delivery.deliveryLabel,
    deliveryNote: delivery.deliveryNote,
    sentAt: odooDatetimeToIso(row.date) ?? odooDatetimeToIso(row.create_date),
    templateKey,
    templateLabel: templateLabelFromRow(templateKey, row.mail_template_id),
    failureType,
    failureReason,
  }
}

export function mapMailLogDetail(
  row: Record<string, unknown>,
  attachments: MailLogAttachmentDTO[],
  odooUrl: string | null,
  notification?: MailLogNotificationHint | null,
): MailLogDetailDTO {
  return {
    ...mapMailLogListItem(row, notification),
    replyTo: text(row.reply_to),
    bodyHtml: typeof row.body_html === 'string' ? row.body_html : '',
    bodyText: text(row.body) || '',
    odooUrl,
    attachments,
  }
}

export function mapMailNotificationHint(row: Record<string, unknown>): {
  mailId: number | null
  hint: MailLogNotificationHint
} {
  return {
    mailId: many2OneId(row.mail_mail_id) ?? (typeof row.mail_id === 'number' ? row.mail_id : null),
    hint: {
      status: text(row.notification_status),
      failureType: text(row.failure_type),
      failureReason: text(row.failure_reason),
    },
  }
}
