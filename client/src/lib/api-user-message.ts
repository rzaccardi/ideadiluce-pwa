import { t, type MessageKey } from '@/i18n/messages'
import { parseLocaleFromPathname, type PwaLocale } from '@/lib/locale'

/** Prefisso Zod `campo.annidato: messaggio`: solo identificatori camelCase, non "Errore: …". */
const FIELD_PREFIX_RE =
  /^(?:[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+|[a-z][a-zA-Z0-9]*):\s+/

const SOURCE_TO_KEY: Record<string, MessageKey> = {
  'Street number or SNC required': 'validation.streetNumberOrSnc',
  'Invalid postal code': 'validation.invalidPostalCode',
  'Invalid province': 'validation.invalidProvince',
  'Invalid phone number': 'validation.invalidPhone',
  'Invalid country code': 'validation.invalidCountry',
  Required: 'validation.required',
  'Invalid email': 'validation.invalidEmail',
  'Invalid string': 'validation.invalid',
  'Email obbligatoria.': 'validation.emailRequired',
  'Indirizzi di fatturazione e spedizione obbligatori.': 'validation.addressesRequired',
  'Metodo di pagamento obbligatorio.': 'validation.paymentMethodRequired',
  'Ragione sociale obbligatoria.': 'validation.companyNameRequired',
  'Ragione sociale obbligatoria per ordini business.': 'validation.companyNameRequiredBusiness',
  'Partita IVA obbligatoria.': 'validation.vatRequired',
  'Partita IVA obbligatoria per ordini business.': 'validation.vatRequiredBusiness',
  'Inserire almeno PEC o codice destinatario SDI.': 'validation.pecOrSdiRequired',
  'Codice fiscale obbligatorio.': 'validation.fiscalCodeRequired',
  'Il codice fiscale deve avere 16 caratteri.': 'validation.fiscalCodeLength',
  'Il codice fiscale deve avere 11 o 16 caratteri.': 'validation.fiscalCodeLength',
  'Formato codice fiscale non valido.': 'validation.fiscalCodeFormat',
  'Codice fiscale non valido.': 'validation.fiscalCodeInvalid',
  'La partita IVA deve avere 11 cifre.': 'validation.vatDigits',
  'Cifra di controllo partita IVA non valida.': 'validation.vatChecksum',
  'Formato partita IVA non valido.': 'validation.vatFormatInvalid',
  'Partita IVA non valida.': 'validation.vatInvalid',
  'Inserisci il numero civico oppure seleziona «Senza numero civico».':
    'validation.streetNumberOrSnc',
  'CAP non valido.': 'validation.invalidPostalCode',
  'Provincia non valida.': 'validation.invalidProvince',
  'Numero di telefono non valido.': 'validation.invalidPhone',
  'Codice paese non valido.': 'validation.invalidCountry',
  'Campo obbligatorio.': 'validation.required',
  'Valore troppo corto.': 'validation.tooShort',
  'Valore troppo lungo.': 'validation.tooLong',
  'Email non valida.': 'validation.invalidEmail',
  'Dati non validi.': 'validation.invalid',
  'Non abbiamo trovato il pagamento presso il gestore. Se l’importo è stato addebitato, contatta l’assistenza.':
    'paymentResult.error.payment_not_found',
  'Il pagamento non risulta completato. Riprova oppure scegli un altro metodo di pagamento.':
    'paymentResult.error.payment_not_succeeded',
  'Il pagamento non è allineato con l’ambiente previsto. Contatta l’assistenza.':
    'paymentResult.error.payment_env_mismatch',
  'La valuta del pagamento non corrisponde a quella dell’ordine. Contatta l’assistenza.':
    'paymentResult.error.payment_currency_mismatch',
  'Questo pagamento risulta già utilizzato per un altro ordine. Contatta l’assistenza.':
    'paymentResult.error.payment_already_used',
  'Verifica del pagamento temporaneamente non disponibile. Riprova tra poco.':
    'paymentResult.error.serviceUnavailable',
  'Reso possibile solo su ordini confermati': 'orders.return.errorNotAllowed',
  'Non è possibile avviare il reso su questo ordine.': 'orders.return.errorNotAllowed',
  'Non ci sono articoli restituibili su questo ordine.': 'orders.return.errorGeneric',
}

export function stripValidationFieldPrefix(message: string): string {
  return message.replace(FIELD_PREFIX_RE, '').trim()
}

/** Il sito non nomina il gestionale nei testi mostrati al cliente. */
export function redactStorefrontVendor(message: string): string {
  if (!/odoo/i.test(message)) return message
  const rewritten = message
    .replace(/odoo non configurato\.?/gi, 'Servizio non disponibile al momento.')
    .replace(/configurazione odoo incompleta\.?/gi, 'il servizio non è disponibile al momento.')
    .replace(/integrazione odoo disattivata\.?/gi, 'Servizio non disponibile al momento.')
    .replace(/\s*\([^)]*odoo[^)]*\)/gi, '')
    .replace(/\b(?:su|con|da|in|di|per|from|with|via)\s+odoo\b/gi, '')
    .replace(/\bodoo\b/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .trim()
  return /odoo/i.test(rewritten) ? 'Servizio non disponibile al momento.' : rewritten
}

function currentLocale(): PwaLocale {
  if (typeof window === 'undefined') return 'IT'
  return parseLocaleFromPathname(window.location.pathname)
}

function keyForSourceMessage(message: string): MessageKey | undefined {
  const mapped = SOURCE_TO_KEY[message]
  if (mapped) return mapped
  if (/^String must contain at least 1 character/i.test(message)) return 'validation.required'
  if (/^Too small: expected string to have >= ?1 /i.test(message)) return 'validation.required'
  if (/^String must contain at least \d+ character/i.test(message) || /^Too small:/i.test(message)) {
    return 'validation.tooShort'
  }
  if (/^String must contain at most \d+ character/i.test(message) || /^Too big:/i.test(message)) {
    return 'validation.tooLong'
  }
  return undefined
}

export function localizeApiUserMessage(message: string, locale: PwaLocale = currentLocale()): string {
  const stripped = stripValidationFieldPrefix(message)
  const key = keyForSourceMessage(stripped)
  return redactStorefrontVendor(key ? t(locale, key) : stripped)
}
