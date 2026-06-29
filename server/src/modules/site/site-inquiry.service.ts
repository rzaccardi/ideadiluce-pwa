import { sendMail } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import type { SiteInquiryInput } from './site-inquiry.validators.js'

const INQUIRY_TO = 'info@ideadiluce.com'

function kindLabel(kind: SiteInquiryInput['kind']) {
  switch (kind) {
    case 'product-not-found':
      return 'Prodotto non trovato / ricambio'
    case 'b2b':
      return 'Attivazione account business'
    case 'professional-quote':
      return 'Richiesta preventivo / consulenza professionisti'
    default:
      return 'Contatto sito'
  }
}

type InquiryAttachment = {
  filename: string
  content: Buffer
}

export const siteInquiryService = {
  async submit(input: SiteInquiryInput, attachments: InquiryAttachment[] = []) {
    const lines = [
      `Tipo: ${kindLabel(input.kind)}`,
      `Nome: ${input.name}`,
      `Email: ${input.email}`,
      input.phone ? `Telefono: ${input.phone}` : null,
      input.productCode ? `Codice/EAN: ${input.productCode}` : null,
      input.brand ? `Marca: ${input.brand}` : null,
      input.quantity ? `Quantità: ${input.quantity}` : null,
      input.usage ? `Uso: ${input.usage}` : null,
      input.urgency ? `Urgenza: ${input.urgency}` : null,
      input.locale ? `Lingua: ${input.locale}` : null,
      attachments.length ? `Allegati: ${attachments.map((a) => a.filename).join(', ')}` : null,
      '',
      input.message?.trim() || '(nessun messaggio)',
    ].filter(Boolean)

    const text = lines.join('\n')
    const subject = `[Idea di Luce] ${kindLabel(input.kind)} — ${input.name}`

    logger.info('site.inquiry', { kind: input.kind, email: input.email, attachments: attachments.length })

    await sendMail({
      to: INQUIRY_TO,
      subject,
      text,
      attachments: attachments.length ? attachments : undefined,
    })

    return { submitted: true }
  },
}
