import { t, type MessageKey } from '@/i18n/messages'
import { parseLocaleFromPathname, type PwaLocale } from '@/lib/locale'

/** Prefisso Zod `campo.annidato: messaggio` — solo identificatori camelCase, non "Errore: …". */
const FIELD_PREFIX_RE =
  /^(?:[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+|[a-z][a-zA-Z0-9]*):\s+/

const SOURCE_TO_KEY: Record<string, MessageKey> = {
  'Street number or SNC required': 'validation.streetNumberOrSnc',
  'Invalid postal code': 'validation.invalidPostalCode',
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
  'Formato codice fiscale non valido.': 'validation.fiscalCodeFormat',
  'Codice fiscale non valido.': 'validation.fiscalCodeInvalid',
  'La partita IVA deve avere 11 cifre.': 'validation.vatDigits',
  'Cifra di controllo partita IVA non valida.': 'validation.vatChecksum',
  'Formato partita IVA non valido.': 'validation.vatFormatInvalid',
  'Partita IVA non valida.': 'validation.vatInvalid',
  'Inserisci il numero civico oppure seleziona «Senza numero civico».':
    'validation.streetNumberOrSnc',
  'CAP non valido.': 'validation.invalidPostalCode',
  'Numero di telefono non valido.': 'validation.invalidPhone',
  'Codice paese non valido.': 'validation.invalidCountry',
  'Campo obbligatorio.': 'validation.required',
  'Valore troppo corto.': 'validation.tooShort',
  'Valore troppo lungo.': 'validation.tooLong',
  'Email non valida.': 'validation.invalidEmail',
  'Dati non validi.': 'validation.invalid',
}

export function stripValidationFieldPrefix(message: string): string {
  return message.replace(FIELD_PREFIX_RE, '').trim()
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
  return key ? t(locale, key) : stripped
}
