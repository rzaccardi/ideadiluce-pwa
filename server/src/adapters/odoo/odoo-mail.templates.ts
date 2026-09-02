/** Destinatario interno (notifiche PWA verso il negozio). */
export const PWA_ADMIN_MAIL_TO = 'info@ideadiluce.com'

export const PWA_MAIL_TEMPLATE_KEYS = [
  'generic',
  'account_credentials',
  'professional_account_customer',
  'quote_received_customer',
  'quote_request_admin',
  'site_inquiry_admin',
  'professional_request_admin',
  'restock_notify_admin',
  'paid_sync_alert_admin',
  'sync_exhausted_admin',
  'password_reset',
  'return_request_admin',
  'return_request_customer',
  'order_confirmation',
  'bank_transfer_pending',
  'order_shipped',
  'abandoned_cart',
] as const

export type PwaMailTemplateKey = (typeof PWA_MAIL_TEMPLATE_KEYS)[number]

export type PwaMailTemplateDef = {
  key: PwaMailTemplateKey
  /** Nome univoco in Odoo (`mail.template.name`). */
  name: string
  subject: string
  bodyHtml: string
}

function wrap(inner: string): string {
  return `<div style="font-family:Georgia,serif;color:#1a1a1a;line-height:1.55;max-width:560px">
<p style="letter-spacing:0.14em;text-transform:uppercase;font-size:12px;color:#c9a24b;margin:0 0 16px">Idea di Luce</p>
${inner}
<p style="margin-top:28px;font-size:12px;color:#666">TLB Italy Srl · ${PWA_ADMIN_MAIL_TO}</p>
</div>`
}

export const PWA_MAIL_TEMPLATES: Record<PwaMailTemplateKey, PwaMailTemplateDef> = {
  generic: {
    key: 'generic',
    name: '[PWA] Notifica generica',
    subject: '{{subject}}',
    bodyHtml: wrap('{{body_html}}'),
  },
  account_credentials: {
    key: 'account_credentials',
    name: '[PWA] Credenziali account cliente',
    subject: 'Il tuo account Idea di Luce',
    bodyHtml: wrap(`<p>Ciao{{first_name_suffix}},</p>
<p>{{intro}}</p>
<p>Email: {{email}}<br/>Password temporanea: {{password}}</p>
<p>Accedi da: <a href="{{login_url}}">{{login_url}}</a></p>
<p>Ti consigliamo di cambiare la password dopo il primo accesso.</p>`),
  },
  professional_account_customer: {
    key: 'professional_account_customer',
    name: '[PWA] Richiesta account professionisti — cliente',
    subject: 'Richiesta account professionisti — Idea di Luce',
    bodyHtml: wrap(`<p>Ciao{{first_name_suffix}},</p>
<p>Abbiamo ricevuto la tua richiesta di attivazione account business.<br/>Verificheremo i dati e ti contatteremo entro 24 ore lavorative.</p>
<p>Nel frattempo abbiamo creato un accesso al portale:<br/>Email: {{email}}<br/>Password temporanea: {{password}}</p>
<p>Accedi da: <a href="{{login_url}}">{{login_url}}</a></p>`),
  },
  quote_received_customer: {
    key: 'quote_received_customer',
    name: '[PWA] Richiesta preventivo — cliente',
    subject: '[Idea di Luce] Richiesta preventivo ricevuta',
    bodyHtml: wrap(`<p>Abbiamo ricevuto la tua richiesta di preventivo.</p>
<p>{{odoo_ref_line}}</p>
<p>Ti contatteremo a breve con il preventivo definitivo.</p>`),
  },
  quote_request_admin: {
    key: 'quote_request_admin',
    name: '[PWA] Richiesta preventivo — interno',
    subject: '[Idea di Luce] Richiesta preventivo — {{customer_email}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  site_inquiry_admin: {
    key: 'site_inquiry_admin',
    name: '[PWA] Contatto sito — interno',
    subject: '[Idea di Luce] {{kind_label}} — {{customer_name}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  professional_request_admin: {
    key: 'professional_request_admin',
    name: '[PWA] Account business — interno',
    subject: '[Idea di Luce] Attivazione account business — {{company_name}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  restock_notify_admin: {
    key: 'restock_notify_admin',
    name: '[PWA] Avviso restock / prodotto — interno',
    subject: '[Idea di Luce] {{type_label}} — {{product_name}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  paid_sync_alert_admin: {
    key: 'paid_sync_alert_admin',
    name: '[PWA] Ordine pagato — sync Odoo in attesa',
    subject: '[Idea di Luce] Ordine pagato — sync Odoo in attesa ({{order_short}})',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  sync_exhausted_admin: {
    key: 'sync_exhausted_admin',
    name: '[PWA] Coda sync Odoo esaurita',
    subject: '[Idea di Luce] Sync Odoo esaurita — ordine {{pwa_order_id}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  password_reset: {
    key: 'password_reset',
    name: '[PWA] Reimposta password',
    subject: 'Reimposta la password — Idea di Luce',
    bodyHtml: wrap(`<p>Ciao,</p>
<p>Per reimpostare la password apri questo link (valido {{hours}} ore):</p>
<p><a href="{{reset_url}}">{{reset_url}}</a></p>
<p>Se non hai richiesto il reset, ignora questa email.</p>`),
  },
  return_request_admin: {
    key: 'return_request_admin',
    name: '[PWA] Richiesta di reso — interno',
    subject: '[Idea di Luce] Richiesta di reso — ordine {{order_ref}} — {{customer_email}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  return_request_customer: {
    key: 'return_request_customer',
    name: '[PWA] Richiesta di reso — cliente',
    subject: '{{subject}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  order_confirmation: {
    key: 'order_confirmation',
    name: '[PWA] Conferma ordine',
    subject: 'Conferma ordine {{order_number}} — Idea di Luce',
    bodyHtml: wrap(`<p>Ciao{{first_name_suffix}},</p>
<p>Abbiamo ricevuto il tuo ordine <strong>{{order_number}}</strong> e il pagamento è confermato.</p>
<p>Totale: {{amount}}</p>
<p>Puoi seguirlo da: <a href="{{order_url}}">{{order_url}}</a></p>
<p>Ti scriveremo di nuovo quando il pacco parte, con il link di tracking.</p>`),
  },
  bank_transfer_pending: {
    key: 'bank_transfer_pending',
    name: '[PWA] Istruzioni bonifico',
    subject: 'Istruzioni per il bonifico — ordine {{order_number}}',
    bodyHtml: wrap(`<p>Ciao{{first_name_suffix}},</p>
<p>Abbiamo registrato l'ordine <strong>{{order_number}}</strong>. Per confermarlo effettua il bonifico con questi dati:</p>
<p>Intestatario: {{holder}}<br/>IBAN: {{iban}}{{bank_name_html}}<br/>Causale: {{reference}}<br/>Importo: {{amount}}</p>
<p>{{note}}</p>
<p>Spediremo dopo l'accredito. Dettaglio ordine: <a href="{{order_url}}">{{order_url}}</a></p>`),
  },
  order_shipped: {
    key: 'order_shipped',
    name: '[PWA] Ordine spedito',
    subject: 'Il tuo ordine {{order_number}} è in viaggio',
    bodyHtml: wrap(`<p>Ciao{{first_name_suffix}},</p>
<p>L'ordine <strong>{{order_number}}</strong> è stato spedito{{carrier_line}}.</p>
<p>{{tracking_html}}</p>
<p>Dettaglio ordine: <a href="{{order_url}}">{{order_url}}</a></p>`),
  },
  abandoned_cart: {
    key: 'abandoned_cart',
    name: '[PWA] Carrello abbandonato',
    subject: 'Hai lasciato articoli nel carrello — Idea di Luce',
    bodyHtml: wrap(`<p>Ciao{{first_name_suffix}},</p>
<p>Hai iniziato un acquisto su Idea di Luce ma non l'hai completato. I prodotti sono ancora nel carrello.</p>
<p>Riprendi da qui: <a href="{{cart_url}}">{{cart_url}}</a></p>`),
  },
}

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export function escapeMailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function textToMailHtml(text: string): string {
  return text
    .split('\n')
    .map((line) => (line ? escapeMailHtml(line) : ''))
    .join('<br/>\n')
}

/** Sostituisce `{{chiave}}`. In HTML i valori sono escapati, tranne `*_html`. */
export function renderPwaMailPlaceholders(
  template: string,
  vars: Record<string, string>,
  mode: 'html' | 'text' = 'html',
): string {
  return template.replace(PLACEHOLDER_RE, (_, key: string) => {
    const raw = vars[key] ?? ''
    if (mode === 'text' || key.endsWith('_html')) return raw
    return escapeMailHtml(raw)
  })
}

export const PWA_MAIL_HEADER_MARK = 'X-PWA-Mail: 1'
export const PWA_MAIL_TEMPLATE_HEADER = 'X-PWA-Template'

export function pwaMailTemplateLabel(key: string): string {
  const def = PWA_MAIL_TEMPLATES[key as PwaMailTemplateKey]
  if (!def) return key
  return def.name.replace(/^\[PWA\]\s*/, '')
}

export function buildPwaMailHeaders(templateKey: PwaMailTemplateKey): string {
  return `${PWA_MAIL_HEADER_MARK}\n${PWA_MAIL_TEMPLATE_HEADER}: ${templateKey}`
}

export function parsePwaMailTemplateKey(headers: string | false | null | undefined): PwaMailTemplateKey | null {
  if (typeof headers !== 'string' || !headers.trim()) return null
  const match = new RegExp(`${PWA_MAIL_TEMPLATE_HEADER}:\\s*([a-z0-9_]+)`, 'i').exec(headers)
  const key = match?.[1]
  if (!key || !PWA_MAIL_TEMPLATE_KEYS.includes(key as PwaMailTemplateKey)) return null
  return key as PwaMailTemplateKey
}
