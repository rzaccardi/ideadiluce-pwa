import type { ZodError, ZodIssue } from 'zod'
import { parseHubLocale, type HubLocale } from './hub-locale.js'

type LocalizedCopy = Record<HubLocale, string>

function copy(it: string, en: string, es: string, fr: string, de: string, ro: string): LocalizedCopy {
  return { IT: it, EN: en, ES: es, FR: fr, DE: de, RO: ro }
}

const GENERIC = {
  invalid: copy(
    'Dati non validi.',
    'Invalid data.',
    'Datos no válidos.',
    'Données non valides.',
    'Ungültige Daten.',
    'Date nevalide.',
  ),
  required: copy(
    'Campo obbligatorio.',
    'This field is required.',
    'Campo obligatorio.',
    'Champ obligatoire.',
    'Dieses Feld ist erforderlich.',
    'Câmp obligatoriu.',
  ),
  tooShort: copy(
    'Valore troppo corto.',
    'Value is too short.',
    'El valor es demasiado corto.',
    'Valeur trop courte.',
    'Wert ist zu kurz.',
    'Valoarea este prea scurtă.',
  ),
  tooLong: copy(
    'Valore troppo lungo.',
    'Value is too long.',
    'El valor es demasiado largo.',
    'Valeur trop longue.',
    'Wert ist zu lang.',
    'Valoarea este prea lungă.',
  ),
  invalidEmail: copy(
    'Email non valida.',
    'Invalid email address.',
    'Email no válida.',
    'Adresse e-mail non valide.',
    'Ungültige E-Mail-Adresse.',
    'Adresă de e-mail nevalidă.',
  ),
} as const

const BY_SOURCE_MESSAGE: Record<string, LocalizedCopy> = {
  'Street number or SNC required': copy(
    'Inserisci il numero civico oppure seleziona «Senza numero civico».',
    'Enter the street number, or select “No street number”.',
    'Introduce el número o selecciona «Sin número».',
    'Saisissez le numéro, ou sélectionnez « Pas de numéro ».',
    'Geben Sie die Hausnummer ein oder wählen Sie «Keine Hausnummer».',
    'Introdu numărul sau selectează «Fără număr».',
  ),
  'Invalid postal code': copy(
    'CAP non valido.',
    'Invalid postal code.',
    'Código postal no válido.',
    'Code postal invalide.',
    'Ungültige Postleitzahl.',
    'Cod poștal nevalid.',
  ),
  'Invalid phone number': copy(
    'Numero di telefono non valido.',
    'Invalid phone number.',
    'Número de teléfono no válido.',
    'Numéro de téléphone invalide.',
    'Ungültige Telefonnummer.',
    'Număr de telefon nevalid.',
  ),
  'Invalid country code': copy(
    'Codice paese non valido.',
    'Invalid country code.',
    'Código de país no válido.',
    'Code pays invalide.',
    'Ungültiger Ländercode.',
    'Cod de țară nevalid.',
  ),
  'Email obbligatoria.': copy(
    'Email obbligatoria.',
    'Email is required.',
    'El email es obligatorio.',
    'L’e-mail est obligatoire.',
    'E-Mail ist erforderlich.',
    'E-mailul este obligatoriu.',
  ),
  'Indirizzi di fatturazione e spedizione obbligatori.': copy(
    'Indirizzi di fatturazione e spedizione obbligatori.',
    'Billing and shipping addresses are required.',
    'Las direcciones de facturación y envío son obligatorias.',
    'Les adresses de facturation et de livraison sont obligatoires.',
    'Rechnungs- und Lieferadresse sind erforderlich.',
    'Adresele de facturare și livrare sunt obligatorii.',
  ),
  'Metodo di pagamento obbligatorio.': copy(
    'Metodo di pagamento obbligatorio.',
    'Payment method is required.',
    'El método de pago es obligatorio.',
    'Le mode de paiement est obligatoire.',
    'Zahlungsmethode ist erforderlich.',
    'Metoda de plată este obligatorie.',
  ),
  'Ragione sociale obbligatoria.': copy(
    'Ragione sociale obbligatoria.',
    'Company name is required.',
    'La razón social es obligatoria.',
    'La raison sociale est obligatoire.',
    'Firmenname ist erforderlich.',
    'Denumirea firmei este obligatorie.',
  ),
  'Ragione sociale obbligatoria per ordini business.': copy(
    'Ragione sociale obbligatoria per ordini business.',
    'Company name is required for business orders.',
    'La razón social es obligatoria para pedidos de empresa.',
    'La raison sociale est obligatoire pour les commandes professionnelles.',
    'Firmenname ist für Geschäftskunden erforderlich.',
    'Denumirea firmei este obligatorie pentru comenzile business.',
  ),
  'Partita IVA obbligatoria.': copy(
    'Partita IVA obbligatoria.',
    'VAT number is required.',
    'El NIF/IVA es obligatorio.',
    'Le numéro de TVA est obligatoire.',
    'USt-IdNr. ist erforderlich.',
    'Codul de TVA este obligatoriu.',
  ),
  'Partita IVA obbligatoria per ordini business.': copy(
    'Partita IVA obbligatoria per ordini business.',
    'VAT number is required for business orders.',
    'El NIF/IVA es obligatorio para pedidos de empresa.',
    'Le numéro de TVA est obligatoire pour les commandes professionnelles.',
    'USt-IdNr. ist für Geschäftskunden erforderlich.',
    'Codul de TVA este obligatoriu pentru comenzile business.',
  ),
  'Inserire almeno PEC o codice destinatario SDI.': copy(
    'Inserire almeno PEC o codice destinatario SDI.',
    'Enter at least a PEC email or SDI recipient code.',
    'Indica al menos un email PEC o un código destinatario SDI.',
    'Indiquez au moins une adresse PEC ou un code destinataire SDI.',
    'Geben Sie mindestens eine PEC-Adresse oder einen SDI-Empfängercode an.',
    'Introdu cel puțin un e-mail PEC sau un cod destinatar SDI.',
  ),
  'Codice fiscale obbligatorio.': copy(
    'Codice fiscale obbligatorio.',
    'Tax code is required.',
    'El código fiscal es obligatorio.',
    'Le code fiscal est obligatoire.',
    'Steuer-ID ist erforderlich.',
    'Codul fiscal este obligatoriu.',
  ),
  'Il codice fiscale deve avere 16 caratteri.': copy(
    'Il codice fiscale deve avere 16 caratteri.',
    'The tax code must be 16 characters.',
    'El código fiscal debe tener 16 caracteres.',
    'Le code fiscal doit contenir 16 caractères.',
    'Die Steuer-ID muss 16 Zeichen haben.',
    'Codul fiscal trebuie să aibă 16 caractere.',
  ),
  'Formato codice fiscale non valido.': copy(
    'Formato codice fiscale non valido.',
    'Invalid tax code format.',
    'Formato de código fiscal no válido.',
    'Format de code fiscal invalide.',
    'Ungültiges Steuer-ID-Format.',
    'Format de cod fiscal nevalid.',
  ),
  'Codice fiscale non valido.': copy(
    'Codice fiscale non valido.',
    'Invalid tax code.',
    'Código fiscal no válido.',
    'Code fiscal invalide.',
    'Ungültige Steuer-ID.',
    'Cod fiscal nevalid.',
  ),
  'La partita IVA deve avere 11 cifre.': copy(
    'La partita IVA deve avere 11 cifre.',
    'The VAT number must have 11 digits.',
    'El NIF/IVA debe tener 11 dígitos.',
    'Le numéro de TVA doit comporter 11 chiffres.',
    'Die USt-IdNr. muss 11 Ziffern haben.',
    'Codul de TVA trebuie să aibă 11 cifre.',
  ),
  'Cifra di controllo partita IVA non valida.': copy(
    'Cifra di controllo partita IVA non valida.',
    'Invalid VAT checksum.',
    'Dígito de control del NIF/IVA no válido.',
    'Clé de contrôle TVA invalide.',
    'Ungültige USt-IdNr.-Prüfziffer.',
    'Cifra de control a codului de TVA este nevalidă.',
  ),
  'Formato partita IVA non valido.': copy(
    'Formato partita IVA non valido.',
    'Invalid VAT number format.',
    'Formato de NIF/IVA no válido.',
    'Format de numéro de TVA invalide.',
    'Ungültiges USt-IdNr.-Format.',
    'Format de cod TVA nevalid.',
  ),
  'Partita IVA non valida.': copy(
    'Partita IVA non valida.',
    'Invalid VAT number.',
    'NIF/IVA no válido.',
    'Numéro de TVA invalide.',
    'Ungültige USt-IdNr.',
    'Cod de TVA nevalid.',
  ),
  'Specifica il settore in "Altro"': copy(
    'Specifica il settore in "Altro".',
    'Specify the sector in “Other”.',
    'Especifica el sector en «Otro».',
    'Précisez le secteur dans « Autre ».',
    'Geben Sie die Branche unter «Sonstiges» an.',
    'Specifică sectorul în „Altele”.',
  ),
  'Inserisci almeno un codice prodotto.': copy(
    'Inserisci almeno un codice prodotto.',
    'Enter at least one product code.',
    'Introduce al menos un código de producto.',
    'Saisissez au moins un code produit.',
    'Geben Sie mindestens einen Produktcode ein.',
    'Introdu cel puțin un cod de produs.',
  ),
  Required: GENERIC.required,
  'Invalid email': GENERIC.invalidEmail,
  'Invalid string': GENERIC.invalid,
}

const FIELD_PREFIX_RE =
  /^(?:[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+|[a-z][a-zA-Z0-9]*):\s+/

export function stripValidationFieldPrefix(message: string): string {
  return message.replace(FIELD_PREFIX_RE, '').trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function firstHeader(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === 'string' ? first : undefined
  }
  return typeof value === 'string' ? value : undefined
}

function parseLooseLocale(value: unknown): HubLocale | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const primary = value.split(',')[0]?.trim().split(/[-_]/)[0]?.toUpperCase()
  if (!primary) return undefined
  const parsed = parseHubLocale(primary, 'IT')
  return parsed === primary ? parsed : undefined
}

export function localeFromRequest(input: {
  headers?: { [key: string]: unknown }
  query?: unknown
  body?: unknown
}): HubLocale {
  const headers = input.headers ?? {}
  const query = isRecord(input.query) ? input.query.locale : undefined
  const body = isRecord(input.body) ? input.body.locale : undefined
  return (
    parseLooseLocale(firstHeader(headers['x-locale'])) ??
    parseLooseLocale(query) ??
    parseLooseLocale(body) ??
    parseLooseLocale(firstHeader(headers['accept-language'])) ??
    'IT'
  )
}

function pick(locale: HubLocale, messages: LocalizedCopy): string {
  return messages[locale] ?? messages.IT
}

function translateKnownMessage(message: string, locale: HubLocale): string | undefined {
  const direct = BY_SOURCE_MESSAGE[message]
  if (direct) return pick(locale, direct)

  if (/^String must contain at least 1 character/i.test(message)) {
    return pick(locale, GENERIC.required)
  }
  if (/^String must contain at least \d+ character/i.test(message)) {
    return pick(locale, GENERIC.tooShort)
  }
  if (/^String must contain at most \d+ character/i.test(message)) {
    return pick(locale, GENERIC.tooLong)
  }
  if (/^Too small: expected string to have >= ?1 /i.test(message)) {
    return pick(locale, GENERIC.required)
  }
  if (/^Too small:/i.test(message)) {
    return pick(locale, GENERIC.tooShort)
  }
  if (/^Too big:/i.test(message)) {
    return pick(locale, GENERIC.tooLong)
  }
  return undefined
}

function translateZodIssue(issue: ZodIssue, locale: HubLocale): string {
  const rawMessage = stripValidationFieldPrefix(issue.message)
  const fromMessage = translateKnownMessage(rawMessage, locale)
  if (fromMessage) return fromMessage

  switch (issue.code) {
    case 'too_small':
      if (issue.type === 'string' && Number(issue.minimum) <= 1) {
        return pick(locale, GENERIC.required)
      }
      return pick(locale, issue.type === 'string' ? GENERIC.tooShort : GENERIC.invalid)
    case 'too_big':
      return pick(locale, GENERIC.tooLong)
    case 'invalid_string':
      return pick(locale, issue.validation === 'email' ? GENERIC.invalidEmail : GENERIC.invalid)
    case 'invalid_type':
      if (issue.received === 'undefined' || issue.received === 'null') {
        return pick(locale, GENERIC.required)
      }
      return pick(locale, GENERIC.invalid)
    case 'invalid_enum_value':
      return pick(locale, GENERIC.invalid)
    default:
      return rawMessage || pick(locale, GENERIC.invalid)
  }
}

export function validationUserMessage(err: ZodError, locale: HubLocale = 'IT'): string {
  const first = err.issues[0]
  if (!first) return pick(locale, GENERIC.invalid)
  return translateZodIssue(first, locale)
}
