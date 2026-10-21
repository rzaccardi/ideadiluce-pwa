import { describe, expect, it, beforeAll } from 'vitest'
import { preloadLocale } from '@/i18n/messages'
import { localizeApiUserMessage, redactStorefrontVendor, stripValidationFieldPrefix } from './api-user-message'

describe('stripValidationFieldPrefix', () => {
  it('rimuove il path Zod', () => {
    expect(stripValidationFieldPrefix('shippingAddress.streetNumber: Street number or SNC required')).toBe(
      'Street number or SNC required',
    )
  })

  it('non altera i messaggi utente con due punti', () => {
    expect(stripValidationFieldPrefix('Errore: riprova più tardi.')).toBe('Errore: riprova più tardi.')
  })
})

describe('localizeApiUserMessage', () => {
  beforeAll(async () => {
    await preloadLocale('EN')
    await preloadLocale('DE')
  })

  it('toglie il campo e traduce il civico', () => {
    expect(
      localizeApiUserMessage('shippingAddress.streetNumber: Street number or SNC required', 'IT'),
    ).toBe('Inserisci il numero civico oppure seleziona «Senza numero civico».')
    expect(
      localizeApiUserMessage('shippingAddress.streetNumber: Street number or SNC required', 'EN'),
    ).toBe('Enter the street number, or select “No street number”.')
    expect(localizeApiUserMessage('Street number or SNC required', 'DE')).toBe(
      'Geben Sie die Hausnummer ein oder wählen Sie «Keine Hausnummer».',
    )
  })

  it('non mostra il nome del gestionale nei messaggi API', () => {
    expect(redactStorefrontVendor('Non siamo riusciti a creare l’account su Odoo. Riprova tra poco.')).toBe(
      'Non siamo riusciti a creare l’account. Riprova tra poco.',
    )
    expect(localizeApiUserMessage('Odoo non configurato.', 'IT')).toBe(
      'Servizio non disponibile al momento.',
    )
  })

  it('traduce il testo italiano del server nella lingua della pagina', () => {
    expect(
      localizeApiUserMessage('Inserisci il numero civico oppure seleziona «Senza numero civico».', 'EN'),
    ).toBe('Enter the street number, or select “No street number”.')
  })

  it('traduce i messaggi di reso non consentito', () => {
    expect(localizeApiUserMessage('Reso possibile solo su ordini confermati', 'IT')).toBe(
      'Il reso non è ancora disponibile per questo ordine. È possibile solo su ordini confermati.',
    )
    expect(localizeApiUserMessage('Reso possibile solo su ordini confermati', 'EN')).toBe(
      'A return is not available for this order yet. Returns are only possible on confirmed orders.',
    )
  })
})
