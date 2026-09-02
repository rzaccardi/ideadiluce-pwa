import type { HubLocale } from '../../lib/hub-locale.js'
import type { OrderDetailDTO } from '../../types/dto.js'

export type ReturnRequestMailInput = {
  requestId: string
  locale: HubLocale
  customerName: string | null
  customerEmail: string
  notes: string | null
  order: OrderDetailDTO
  orderUrl: string
}

type MailContent = { subject: string; text: string }

function euros(cents: number | null, currency: string | null): string {
  if (cents == null) return '—'
  const code = currency || 'EUR'
  return `${(cents / 100).toFixed(2)} ${code}`
}

function orderRef(order: OrderDetailDTO): string {
  return `#${order.odooSaleOrderId}`
}

function greeting(name: string | null, locale: HubLocale): string {
  const trimmed = name?.trim()
  if (!trimmed) {
    if (locale === 'EN') return 'Hello,'
    if (locale === 'ES') return 'Hola,'
    if (locale === 'FR') return 'Bonjour,'
    if (locale === 'DE') return 'Guten Tag,'
    if (locale === 'RO') return 'Bună,'
    return 'Ciao,'
  }
  if (locale === 'EN') return `Hello ${trimmed},`
  if (locale === 'ES') return `Hola ${trimmed},`
  if (locale === 'FR') return `Bonjour ${trimmed},`
  if (locale === 'DE') return `Guten Tag ${trimmed},`
  if (locale === 'RO') return `Bună ${trimmed},`
  return `Ciao ${trimmed},`
}

function lineSummary(order: OrderDetailDTO): string {
  if (order.lines.length === 0) return '(nessuna riga disponibile)'
  return order.lines
    .map((line) => {
      const name = line.productName ?? line.productRef
      const qty = `x${line.quantity}`
      const total = euros(line.lineTotalCents, order.currencyCode)
      return `- ${name} (${line.productRef}) ${qty} — ${total}`
    })
    .join('\n')
}

export function buildAdminReturnRequestEmail(input: ReturnRequestMailInput): MailContent {
  const { order } = input
  const name = input.customerName?.trim() || '—'
  const text = [
    'Tipo: Richiesta di reso / recesso',
    `ID richiesta: ${input.requestId}`,
    `Ordine: ${orderRef(order)}`,
    `ID ordine account: ${order.id}`,
    order.pwaOrderId ? `Rif. PWA: ${order.pwaOrderId}` : null,
    `Data ordine: ${order.createdAt}`,
    `Stato: ${order.status}`,
    `Totale: ${euros(order.totalAmount, order.currencyCode)}`,
    `Cliente: ${name} <${input.customerEmail}>`,
    `Lingua: ${input.locale}`,
    '',
    'Articoli:',
    lineSummary(order),
    '',
    input.notes?.trim() ? `Note cliente:\n${input.notes.trim()}` : 'Note cliente: (nessuna)',
  ]
    .filter((line) => line !== null)
    .join('\n')

  return {
    subject: `[Idea di Luce] Richiesta di reso — ordine ${orderRef(order)} — ${input.customerEmail}`,
    text,
  }
}

export function buildCustomerReturnRequestEmail(input: ReturnRequestMailInput): MailContent {
  const ref = orderRef(input.order)
  const hello = greeting(input.customerName, input.locale)
  const notesBlock = input.notes?.trim()
    ? `\n\n${customerNotesLabel(input.locale)}\n${input.notes.trim()}`
    : ''

  if (input.locale === 'EN') {
    return {
      subject: `Return request received — Idea di Luce (${ref})`,
      text: `${hello}

We have received your return request for order ${ref}.

You will shortly receive instructions on the procedure to follow to complete the return.

Customer service will contact you at this email address.

View your order: ${input.orderUrl}

Request reference: ${input.requestId}${notesBlock}

Thank you,
Idea di Luce`,
    }
  }

  if (input.locale === 'ES') {
    return {
      subject: `Solicitud de devolución recibida — Idea di Luce (${ref})`,
      text: `${hello}

Hemos recibido tu solicitud de devolución del pedido ${ref}.

En breve recibirás indicaciones sobre el procedimiento a seguir para efectuar la devolución.

El servicio de atención al cliente te contactará en esta dirección de correo.

Consulta tu pedido: ${input.orderUrl}

Referencia de la solicitud: ${input.requestId}${notesBlock}

Gracias,
Idea di Luce`,
    }
  }

  if (input.locale === 'FR') {
    return {
      subject: `Demande de retour reçue — Idea di Luce (${ref})`,
      text: `${hello}

Nous avons bien reçu votre demande de retour pour la commande ${ref}.

Vous recevrez sous peu les indications sur la procédure à suivre pour effectuer le retour.

Le service client vous contactera à cette adresse e-mail.

Consulter votre commande : ${input.orderUrl}

Référence de la demande : ${input.requestId}${notesBlock}

Merci,
Idea di Luce`,
    }
  }

  if (input.locale === 'DE') {
    return {
      subject: `Rücksendeanfrage erhalten — Idea di Luce (${ref})`,
      text: `${hello}

Wir haben Ihre Rücksendeanfrage für die Bestellung ${ref} erhalten.

In Kürze erhalten Sie Hinweise zum weiteren Vorgehen, um die Rücksendung durchzuführen.

Der Kundenservice wird Sie unter dieser E-Mail-Adresse kontaktieren.

Bestellung ansehen: ${input.orderUrl}

Anfragereferenz: ${input.requestId}${notesBlock}

Vielen Dank,
Idea di Luce`,
    }
  }

  if (input.locale === 'RO') {
    return {
      subject: `Cerere de retur primită — Idea di Luce (${ref})`,
      text: `${hello}

Am primit cererea ta de retur pentru comanda ${ref}.

În scurt timp vei primi indicații despre procedura de urmat pentru a efectua returul.

Serviciul clienți te va contacta la această adresă de email.

Vezi comanda: ${input.orderUrl}

Referință cerere: ${input.requestId}${notesBlock}

Mulțumim,
Idea di Luce`,
    }
  }

  return {
    subject: `Richiesta di reso ricevuta — Idea di Luce (${ref})`,
    text: `${hello}

Abbiamo ricevuto la tua richiesta di reso per l'ordine ${ref}.

A breve riceverai indicazioni sulle procedure da seguire per effettuare il reso.

Il servizio clienti ti contatterà a questo indirizzo email.

Vedi il tuo ordine: ${input.orderUrl}

Riferimento richiesta: ${input.requestId}${notesBlock}

Grazie,
Idea di Luce`,
  }
}

function customerNotesLabel(locale: HubLocale): string {
  if (locale === 'EN') return 'Your notes:'
  if (locale === 'ES') return 'Tus notas:'
  if (locale === 'FR') return 'Vos notes :'
  if (locale === 'DE') return 'Ihre Anmerkungen:'
  if (locale === 'RO') return 'Notele tale:'
  return 'Le tue note:'
}

export function customerNotificationCopy(locale: HubLocale): { title: string; body: string } {
  if (locale === 'EN') {
    return {
      title: 'Return request sent',
      body: 'We have received your return request. You will shortly receive instructions by email.',
    }
  }
  if (locale === 'ES') {
    return {
      title: 'Solicitud de devolución enviada',
      body: 'Hemos recibido tu solicitud de devolución. En breve recibirás las indicaciones por email.',
    }
  }
  if (locale === 'FR') {
    return {
      title: 'Demande de retour envoyée',
      body: 'Nous avons reçu votre demande de retour. Vous recevrez sous peu les indications par e-mail.',
    }
  }
  if (locale === 'DE') {
    return {
      title: 'Rücksendeanfrage gesendet',
      body: 'Wir haben Ihre Rücksendeanfrage erhalten. In Kürze erhalten Sie die Hinweise per E-Mail.',
    }
  }
  if (locale === 'RO') {
    return {
      title: 'Cerere de retur trimisă',
      body: 'Am primit cererea ta de retur. În scurt timp vei primi indicațiile pe email.',
    }
  }
  return {
    title: 'Richiesta di reso inviata',
    body: 'Abbiamo ricevuto la tua richiesta di reso. A breve riceverai indicazioni via email.',
  }
}
