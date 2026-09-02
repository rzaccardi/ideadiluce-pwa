export type MailLogState = 'sent' | 'outgoing' | 'exception' | 'cancel' | string

export type MailLogListItem = {
  id: number
  subject: string
  emailTo: string
  emailFrom: string | null
  state: MailLogState
  deliveryState: 'sent' | 'outgoing' | 'exception' | 'bounce' | 'cancel' | string
  deliveryLabel: string
  deliveryNote: string
  sentAt: string | null
  templateKey: string | null
  templateLabel: string
  failureType: string | null
  failureReason: string | null
}

export type MailLogAttachment = {
  id: number
  name: string
  mimetype: string | null
}

export type MailLogList = {
  items: MailLogListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  configured: boolean
}

export type MailLogDetail = MailLogListItem & {
  replyTo: string | null
  bodyHtml: string
  bodyText: string
  odooUrl: string | null
  attachments: MailLogAttachment[]
}

export const MAIL_LOG_STATE_LABELS: Record<string, string> = {
  sent: 'Inviata',
  outgoing: 'In coda',
  exception: 'Errore invio',
  cancel: 'Annullata',
  bounce: 'Non consegnata',
  received: 'Ricevuta',
}

export function mailLogStateLabel(state: string, deliveryLabel?: string): string {
  if (deliveryLabel?.trim()) return deliveryLabel
  return MAIL_LOG_STATE_LABELS[state] ?? state
}

export const MAIL_LOG_STATE_FILTER_OPTIONS: {
  value: 'all' | 'sent' | 'outgoing' | 'exception' | 'bounce'
  label: string
}[] = [
  { value: 'all', label: 'Tutte' },
  { value: 'sent', label: 'Inviate' },
  { value: 'outgoing', label: 'In coda' },
  { value: 'exception', label: 'Errore invio' },
  { value: 'bounce', label: 'Non consegnate' },
]

export const MAIL_LOG_TEMPLATE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tutti i tipi' },
  { value: 'account_credentials', label: 'Credenziali account' },
  { value: 'professional_account_customer', label: 'Account professionisti' },
  { value: 'quote_received_customer', label: 'Preventivo (cliente)' },
  { value: 'quote_request_admin', label: 'Preventivo (interno)' },
  { value: 'site_inquiry_admin', label: 'Contatto sito' },
  { value: 'professional_request_admin', label: 'Account business (interno)' },
  { value: 'restock_notify_admin', label: 'Restock / prodotto' },
  { value: 'paid_sync_alert_admin', label: 'Alert sync ordine' },
  { value: 'sync_exhausted_admin', label: 'Coda sync esaurita' },
  { value: 'password_reset', label: 'Reset password' },
  { value: 'return_request_admin', label: 'Reso (interno)' },
  { value: 'return_request_customer', label: 'Reso (cliente)' },
  { value: 'order_confirmation', label: 'Conferma ordine' },
  { value: 'bank_transfer_pending', label: 'Istruzioni bonifico' },
  { value: 'order_shipped', label: 'Ordine spedito' },
  { value: 'abandoned_cart', label: 'Carrello abbandonato' },
  { value: 'generic', label: 'Notifica generica' },
]
