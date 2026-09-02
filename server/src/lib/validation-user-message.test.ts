import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { checkoutAddressSchema } from '../modules/checkout/checkout-address.validators.js'
import {
  localeFromRequest,
  stripValidationFieldPrefix,
  validationUserMessage,
} from './validation-user-message.js'

const validAddress = {
  firstName: 'Mario',
  lastName: 'Rossi',
  line1: 'Via Roma',
  streetNumber: '1',
  city: 'Roma',
  postalCode: '00100',
  country: 'IT',
}

describe('stripValidationFieldPrefix', () => {
  it('rimuove il path Zod dal messaggio utente', () => {
    expect(stripValidationFieldPrefix('shippingAddress.streetNumber: Street number or SNC required')).toBe(
      'Street number or SNC required',
    )
    expect(stripValidationFieldPrefix('email: Invalid email')).toBe('Invalid email')
  })

  it('non altera i messaggi con due punti nel testo', () => {
    expect(stripValidationFieldPrefix('Errore: riprova più tardi.')).toBe('Errore: riprova più tardi.')
  })
})

describe('localeFromRequest', () => {
  it('legge X-Locale e Accept-Language', () => {
    expect(localeFromRequest({ headers: { 'x-locale': 'en' } })).toBe('EN')
    expect(localeFromRequest({ headers: { 'accept-language': 'de-DE,de;q=0.9' } })).toBe('DE')
    expect(localeFromRequest({ query: { locale: 'fr' } })).toBe('FR')
    expect(localeFromRequest({})).toBe('IT')
  })
})

describe('validationUserMessage', () => {
  it('non espone il nome del campo e traduce il civico', () => {
    const result = checkoutAddressSchema.safeParse({
      ...validAddress,
      streetNumber: '',
    })
    expect(result.success).toBe(false)
    if (result.success) return

    const it = validationUserMessage(result.error, 'IT')
    const en = validationUserMessage(result.error, 'EN')
    expect(it).not.toMatch(/streetNumber/i)
    expect(it).not.toContain(':')
    expect(it).toBe('Inserisci il numero civico oppure seleziona «Senza numero civico».')
    expect(en).toBe('Enter the street number, or select “No street number”.')
  })

  it('traduce i campi obbligatori di Zod senza path', () => {
    const result = checkoutAddressSchema.safeParse({
      ...validAddress,
      firstName: '   ',
    })
    expect(result.success).toBe(false)
    if (result.success) return

    const it = validationUserMessage(result.error, 'IT')
    expect(it).toBe('Campo obbligatorio.')
    expect(it).not.toMatch(/firstName/i)
    expect(validationUserMessage(result.error, 'EN')).toBe('This field is required.')
  })

  it('traduce email non valida', () => {
    const schema = z.object({ email: z.string().email() })
    const result = schema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
    if (result.success) return

    expect(validationUserMessage(result.error, 'IT')).toBe('Email non valida.')
    expect(validationUserMessage(result.error, 'ES')).toBe('Email no válida.')
  })
})
