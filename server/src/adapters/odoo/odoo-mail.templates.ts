import { env } from '../../config/env.js'

/** Destinatario interno (notifiche PWA verso il negozio). */
export const PWA_ADMIN_MAIL_TO = 'info@ideadiluce.com'

/** Mittente ufficiale (evita che Odoo spedisca come utente tecnico / Roberto Zaccardi). */
export const PWA_MAIL_FROM = `"Idea di Luce" <${PWA_ADMIN_MAIL_TO}>`

export const PWA_MAIL_TEMPLATE_KEYS = [
  'generic',
  'account_credentials',
  'account_welcome',
  'professional_account_customer',
  'quote_received_customer',
  'quote_request_admin',
  'site_inquiry_admin',
  'restock_notify_admin',
  'paid_sync_alert_admin',
  'sync_exhausted_admin',
  'password_reset',
  'order_confirmation',
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

/** Stesso stack del layout documenti Odoo (mail orders@). */
const MAIL_FONT =
  "'Nunito Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

function mailSiteOrigin(): string {
  return env.PUBLIC_SITE_URL.replace(/\/$/, '')
}

/** Wordmark ufficiali in `client/public/brand`, URL assoluti perché i client email non caricano path relativi. */
function mailLogoWhiteUrl(): string {
  return `${mailSiteOrigin()}/brand/wordmark-white.png`
}

function mailLogoDarkUrl(): string {
  return `${mailSiteOrigin()}/brand/wordmark-lockup.png`
}

/** Corpo nello stesso ritmo dell'email orders@: un paragrafo, 12px, a capo con br. */
function mailCopy(inner: string): string {
  return `<div style="margin:0;padding:0"><p style="margin:0;padding:0;font-size:12px;line-height:1.55">${inner}</p></div>`
}

/** Pulsante transazionale (client email: solo stili inline). */
function mailButton(hrefPlaceholder: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px">
<tr><td style="background:#1a1a1a">
<a href="${hrefPlaceholder}" style="display:inline-block;padding:12px 18px;font-family:${MAIL_FONT};font-size:13px;font-weight:700;letter-spacing:0.04em;color:#ffffff;text-decoration:none">${label}</a>
</td></tr></table>`
}

/**
 * Guscio HTML delle mail PWA: stessa griglia dell'email orders@,
 * marchio Idea di Luce (loghi hosted sul sito, firma senza anagrafica TLB).
 * `section` è l'etichetta a destra nell'header (es. Orders).
 */
function wrap(inner: string, section?: string): string {
  const site = mailSiteOrigin()
  const sectionHtml = section
    ? `<span style="opacity:.4;padding:0 6px;font-weight:400;">|</span><span style="font-weight:400;letter-spacing:.8pt;">${escapeMailHtml(section)}</span>`
    : ''
  return `<html lang="it"><head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="crossorigin">
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&amp;display=swap" rel="stylesheet">
</head>
<body style="background:#f0f0f0;margin:0;padding:20px;font-family:${MAIL_FONT};">
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;max-width:640px;width:100%;margin:0 auto;background:#ffffff;border:1px solid #d8d8d8;">
<tr>
<td style="background:#1a1a1a;padding:14px 28px;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
<tr>
<td valign="middle" style="width:225px;">
<a href="${site}" style="text-decoration:none">
<img alt="Idea di Luce" width="180" style="display:block;height:auto;max-height:48px;width:auto;max-width:180px;border:0;outline:none;text-decoration:none;" src="${mailLogoWhiteUrl()}">
</a>
</td>
<td valign="middle" align="right" style="font-family:${MAIL_FONT};color:#ffffff;font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:1.2pt;">
Idea di Luce${sectionHtml}
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:32px 36px 24px 36px;font-family:${MAIL_FONT};color:#1a1a1a;font-size:12px;line-height:1.55;">
${inner}
</td>
</tr>
<tr>
<td style="background:#fafafa;padding:18px 36px;border-top:1px solid #e8e8e8;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
<tr>
<td style="font-family:${MAIL_FONT};font-size:8pt;color:#888;line-height:1.5;">
<a href="${site}" style="text-decoration:none">
<img alt="Idea di Luce" width="140" style="display:block;height:auto;max-width:140px;border:0;outline:none;text-decoration:none;" src="${mailLogoDarkUrl()}">
</a>
<p style="margin:10px 0 0;font-family:${MAIL_FONT};font-size:8pt;color:#888;line-height:1.5;">
<a href="${site}" style="color:#555;font-weight:700;text-decoration:none">Idea di Luce</a>
· <a style="color:#888;text-decoration:underline;" href="mailto:${PWA_ADMIN_MAIL_TO}">${PWA_ADMIN_MAIL_TO}</a>
· <a style="color:#888;text-decoration:underline;" href="${site}">${site.replace(/^https?:\/\//, '')}</a>
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body></html>`
}

/** True se l'HTML ha già il guscio PWA (header nero + footer). Odoo spesso salva solo il corpo. */
function hasPwaMailShell(html: string): boolean {
  if (/wordmark-(?:white|lockup)\.png/i.test(html)) return true
  return /#1a1a1a/i.test(html) && /#fafafa/i.test(html)
}

/**
 * Documento email completo (header, corpo, footer) per l'anteprima nel gestionale.
 * Se Odoo ha già conservato il guscio, lo lascia invariato.
 */
export function ensurePwaMailDocument(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ''
  if (hasPwaMailShell(trimmed)) return trimmed
  return wrap(trimmed)
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
    bodyHtml: wrap(mailCopy(`Ciao{{first_name_suffix}},
        <br><br>
        {{intro}}
        <br><br>
        Email: <span style="font-weight:bold">{{email}}</span>
        <br>
        Password temporanea: <span style="font-weight:bold">{{password}}</span>
        <br><br>
        Accedi da qui:
        <br>
        <a href="{{login_url}}" style="color:#1a1a1a">{{login_url}}</a>
        <br><br>
        Ti consigliamo di cambiare la password dopo il primo accesso.`)),
  },
  account_welcome: {
    key: 'account_welcome',
    name: '[PWA] Benvenuto account cliente',
    subject: 'Benvenuto su Idea di Luce',
    bodyHtml: wrap(mailCopy(`Ciao{{first_name_suffix}},
        <br><br>
        il tuo account è stato creato correttamente.
        <br><br>
        Email: <span style="font-weight:bold">{{email}}</span>
        <br><br>
        ${mailButton('{{login_url}}', 'Accedi al tuo account')}
        <br>
        Se il pulsante non si apre, usa questo link:
        <br>
        <a href="{{login_url}}" style="color:#1a1a1a">{{login_url}}</a>
        <br><br>
        Se non hai richiesto tu la registrazione, scrivici a <a href="mailto:${PWA_ADMIN_MAIL_TO}" style="color:#1a1a1a">${PWA_ADMIN_MAIL_TO}</a>.`)),
  },
  professional_account_customer: {
    key: 'professional_account_customer',
    name: '[PWA] Richiesta account professionisti - cliente',
    subject: 'Richiesta account professionisti - Idea di Luce',
    bodyHtml: wrap(mailCopy(`Ciao{{first_name_suffix}},
        <br><br>
        abbiamo ricevuto la tua richiesta di attivazione account business.
        <br>
        Verificheremo i dati e ti contatteremo entro 24 ore lavorative.
        <br><br>
        Nel frattempo abbiamo creato un accesso al portale.
        <br>
        Email: <span style="font-weight:bold">{{email}}</span>
        <br>
        Password temporanea: <span style="font-weight:bold">{{password}}</span>
        <br><br>
        Accedi da qui:
        <br>
        <a href="{{login_url}}" style="color:#1a1a1a">{{login_url}}</a>`)),
  },
  quote_received_customer: {
    key: 'quote_received_customer',
    name: '[PWA] Richiesta preventivo - cliente',
    subject: '[Idea di Luce] Richiesta preventivo ricevuta',
    bodyHtml: wrap(mailCopy(`Ciao,
        <br><br>
        abbiamo ricevuto la tua richiesta di preventivo.
        <br>
        {{odoo_ref_line}}
        <br><br>
        Ti contatteremo a breve con il preventivo definitivo.
        <br><br>
        Grazie per la fiducia!`)),
  },
  quote_request_admin: {
    key: 'quote_request_admin',
    name: '[PWA] Richiesta preventivo - interno',
    subject: '[Idea di Luce] Richiesta preventivo - {{customer_email}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  site_inquiry_admin: {
    key: 'site_inquiry_admin',
    name: '[PWA] Contatto sito - interno',
    subject: '[Idea di Luce] {{kind_label}} - {{customer_name}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  restock_notify_admin: {
    key: 'restock_notify_admin',
    name: '[PWA] Avviso restock / prodotto - interno',
    subject: '[Idea di Luce] {{type_label}} - {{product_name}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  paid_sync_alert_admin: {
    key: 'paid_sync_alert_admin',
    name: '[PWA] Ordine pagato - sync Odoo in attesa',
    subject: '[Idea di Luce] Ordine pagato - sync Odoo in attesa ({{order_short}})',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  sync_exhausted_admin: {
    key: 'sync_exhausted_admin',
    name: '[PWA] Coda sync Odoo esaurita',
    subject: '[Idea di Luce] Sync Odoo esaurita - ordine {{pwa_order_id}}',
    bodyHtml: wrap('<pre style="white-space:pre-wrap;font-family:inherit">{{body_text}}</pre>'),
  },
  password_reset: {
    key: 'password_reset',
    name: '[PWA] Reimposta password',
    subject: 'Reimposta la password - Idea di Luce',
    bodyHtml: wrap(mailCopy(`Ciao,
        <br><br>
        per reimpostare la password apri questo link (valido <span style="font-weight:bold">{{hours}}</span> ore):
        <br><br>
        <a href="{{reset_url}}" style="color:#1a1a1a">{{reset_url}}</a>
        <br><br>
        Se non hai richiesto il reset, ignora questa email.`)),
  },
  order_confirmation: {
    key: 'order_confirmation',
    name: '[PWA] Conferma ordine',
    subject: 'Conferma ordine {{order_number}} - Idea di Luce',
    bodyHtml: wrap(mailCopy(`Ciao{{first_name_suffix}},
        <br><br>
        abbiamo ricevuto il tuo ordine <span style="font-weight:bold">{{order_number}}</span>
        e il pagamento è confermato.
        <br>
        Totale: <span style="font-weight:bold">{{amount}}</span>
        <br><br>
        ${mailButton('{{order_url}}', 'Visualizza ordine')}
        <br>
        Se il pulsante non si apre, apri: <a href="{{order_url}}" style="color:#1a1a1a">{{order_url}}</a>
        <br><br>
        Ti scriveremo di nuovo quando il pacco parte, con il link di tracking.
        <br><br>
        Grazie per la fiducia!`), 'Orders'),
  },
  order_shipped: {
    key: 'order_shipped',
    name: '[PWA] Ordine spedito',
    subject: 'Il tuo ordine {{order_number}} è in viaggio',
    bodyHtml: wrap(mailCopy(`Ciao{{first_name_suffix}},
        <br><br>
        l'ordine <span style="font-weight:bold">{{order_number}}</span> è stato spedito{{carrier_line}}.
        <br><br>
        {{tracking_html}}
        <br><br>
        Dettaglio ordine: <a href="{{order_url}}" style="color:#1a1a1a">{{order_url}}</a>
        <br><br>
        Grazie per la fiducia!`), 'Orders'),
  },
  abandoned_cart: {
    key: 'abandoned_cart',
    name: '[PWA] Carrello abbandonato',
    subject: 'Hai lasciato articoli nel carrello - Idea di Luce',
    bodyHtml: wrap(mailCopy(`Ciao{{first_name_suffix}},
        <br><br>
        hai iniziato un acquisto su Idea di Luce ma non l'hai completato.
        I prodotti sono ancora nel carrello.
        <br><br>
        ${mailButton('{{cart_url}}', 'Riprendi il carrello')}
        <br>
        Se il pulsante non si apre, apri: <a href="{{cart_url}}" style="color:#1a1a1a">{{cart_url}}</a>`)),
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
