import {
  PWA_MAIL_TEMPLATE_KEYS,
  PWA_MAIL_TEMPLATES,
  pwaMailTemplateLabel,
  renderPwaMailPlaceholders,
  type PwaMailTemplateKey,
} from '../../adapters/odoo/odoo-mail.templates.js'

/** Valori fittizi solo per l’anteprima in gestionale. Non vengono inviati. */
const PREVIEW_VARS: Record<string, string> = {
  subject: 'Messaggio di prova',
  body_html: '<p>Testo di esempio della notifica.</p>',
  body_text: 'Testo di esempio della notifica interna.\nSeconda riga.',
  first_name_suffix: ' Mario',
  intro: 'Ecco le credenziali per accedere al tuo account Idea di Luce.',
  email: 'mario.rossi@example.com',
  password: 'temporanea-esempio',
  login_url: 'https://shop.ideadiluce.it/account/accedi',
  customer_email: 'mario.rossi@example.com',
  customer_name: 'Mario Rossi',
  company_name: 'Studio Rossi',
  kind_label: 'Contatto',
  type_label: 'Avviso disponibilità',
  product_name: 'Lampada da tavolo',
  order_short: 'G6B82C',
  pwa_order_id: 'ord_esempio',
  hours: '24',
  order_ref: 'G6B82C',
  order_number: 'G6B82C',
  amount: '€ 312,32',
  order_url: 'https://shop.ideadiluce.it/account/ordini/G6B82C',
  carrier_line: ' con BRT',
  tracking_html: '<a href="https://shop.ideadiluce.it" style="color:#1a1a1a">Segui la spedizione</a>',
  cart_url: 'https://shop.ideadiluce.it/carrello',
  odoo_ref_line: 'Riferimento: G6B82C',
}

export type MailTemplatePreview = {
  key: PwaMailTemplateKey
  label: string
  audience: 'cliente' | 'interno' | 'generico'
  subject: string
  bodyHtml: string
}

function audienceOf(key: PwaMailTemplateKey): MailTemplatePreview['audience'] {
  if (key === 'generic') return 'generico'
  if (key.endsWith('_admin')) return 'interno'
  return 'cliente'
}

export function listMailTemplatePreviews(): MailTemplatePreview[] {
  return PWA_MAIL_TEMPLATE_KEYS.map((key) => {
    const def = PWA_MAIL_TEMPLATES[key]
    return {
      key,
      label: pwaMailTemplateLabel(key),
      audience: audienceOf(key),
      subject: renderPwaMailPlaceholders(def.subject, PREVIEW_VARS, 'text'),
      bodyHtml: renderPwaMailPlaceholders(def.bodyHtml, PREVIEW_VARS, 'html'),
    }
  })
}
