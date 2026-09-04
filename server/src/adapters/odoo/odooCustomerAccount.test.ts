import { describe, expect, it } from 'vitest'
import {
  buildUserBusinessPatch,
  mapOdooPartnerAccount,
  normalizeOdooSdiCode,
  pickPartnerRowByEmail,
  splitPartnerName,
  type OdooPartnerAccountRow,
} from './odooCustomerAccount.js'

function partner(partial: Partial<OdooPartnerAccountRow> & { id: number; name: string }): OdooPartnerAccountRow {
  return partial
}

describe('splitPartnerName', () => {
  it('spezza nome e cognome per i privati', () => {
    expect(splitPartnerName('Mario Rossi')).toEqual({ firstName: 'Mario', lastName: 'Rossi' })
  })

  it('mette tutto tranne l’ultima parola in nome', () => {
    expect(splitPartnerName('ElettroWatt Di Vissani Alessandro')).toEqual({
      firstName: 'ElettroWatt Di Vissani',
      lastName: 'Alessandro',
    })
  })
})

describe('pickPartnerRowByEmail', () => {
  it('preferisce il contatto persona all’azienda', () => {
    const company = partner({ id: 1, name: 'ElettroWatt', is_company: true })
    const contact = partner({ id: 2, name: 'Alessandro', is_company: false })
    expect(pickPartnerRowByEmail([company, contact])?.id).toBe(2)
  })
})

describe('normalizeOdooSdiCode', () => {
  it('ignora il placeholder Odoo 0000000', () => {
    expect(normalizeOdooSdiCode('0000000')).toBeNull()
  })

  it('mantiene un codice SDI reale', () => {
    expect(normalizeOdooSdiCode('M5UXCR1')).toBe('M5UXCR1')
  })
})

describe('mapOdooPartnerAccount', () => {
  it('legge i dati aziendali dal partner commerciale, non dal contact di login', () => {
    const company = partner({
      id: 10,
      name: 'ElettroWatt Di Vissani',
      is_company: true,
      vat: 'IT01234567890',
      l10n_it_codice_fiscale: '01234567890',
      l10n_it_pec_email: 'elettrowatt@pec.it',
      l10n_it_codice_destinatario: 'M5UXCR1',
    })
    const contact = partner({
      id: 20,
      name: 'Alessandro',
      is_company: false,
      commercial_partner_id: [10, 'ElettroWatt Di Vissani'],
      phone: '+39 333 0000000',
    })

    const mapped = mapOdooPartnerAccount(contact, company)
    expect(mapped.contactIsCompany).toBe(false)
    expect(mapped.firstName).toBe('Alessandro')
    expect(mapped.lastName).toBe('')
    expect(mapped.business).toMatchObject({
      companyName: 'ElettroWatt Di Vissani',
      vatNumber: 'IT01234567890',
      fiscalCode: '01234567890',
      pec: 'elettrowatt@pec.it',
      sdiCode: 'M5UXCR1',
      isCompany: true,
    })
  })

  it('non spezza la ragione sociale nei campi nome/cognome se il login è l’azienda', () => {
    const company = partner({
      id: 10,
      name: 'ElettroWatt Di Vissani Alessandro',
      is_company: true,
      vat: 'IT01234567890',
    })
    const mapped = mapOdooPartnerAccount(company, company)
    expect(mapped.contactIsCompany).toBe(true)
    expect(mapped.firstName).toBe('')
    expect(mapped.lastName).toBe('')
    expect(mapped.business.companyName).toBe('ElettroWatt Di Vissani Alessandro')
  })

  it('non riempie i dati aziendali per un privato senza P.IVA', () => {
    const person = partner({ id: 3, name: 'Mario Rossi', is_company: false })
    const mapped = mapOdooPartnerAccount(person, person)
    expect(mapped.firstName).toBe('Mario')
    expect(mapped.lastName).toBe('Rossi')
    expect(mapped.business.companyName).toBeNull()
    expect(mapped.business.isCompany).toBe(false)
  })
})

describe('buildUserBusinessPatch', () => {
  const emptyUser = {
    firstName: null,
    lastName: null,
    phone: null,
    companyName: null,
    vatNumber: null,
    fiscalCode: null,
    pec: null,
    sdiCode: null,
  }

  it('compila i campi aziendali vuoti dal partner commerciale', () => {
    const patch = buildUserBusinessPatch(emptyUser, {
      contactIsCompany: false,
      firstName: 'Alessandro',
      lastName: '',
      phone: '+39 333',
      business: {
        companyName: 'ElettroWatt Di Vissani',
        vatNumber: 'IT01234567890',
        fiscalCode: '01234567890',
        pec: 'elettrowatt@pec.it',
        sdiCode: 'M5UXCR1',
        isCompany: true,
      },
    })
    expect(patch).toMatchObject({
      firstName: 'Alessandro',
      lastName: '',
      phone: '+39 333',
      companyName: 'ElettroWatt Di Vissani',
      vatNumber: 'IT01234567890',
      fiscalCode: '01234567890',
      pec: 'elettrowatt@pec.it',
      sdiCode: 'M5UXCR1',
    })
  })

  it('non sovrascrive dati aziendali già presenti in PWA', () => {
    const patch = buildUserBusinessPatch(
      {
        ...emptyUser,
        companyName: 'Già salvata',
        vatNumber: 'IT999',
        firstName: 'Ada',
        lastName: 'Lovelace',
      },
      {
        contactIsCompany: false,
        firstName: 'Alessandro',
        lastName: '',
        phone: '',
        business: {
          companyName: 'ElettroWatt Di Vissani',
          vatNumber: 'IT01234567890',
          pec: 'elettrowatt@pec.it',
        },
      },
    )
    expect(patch).toEqual({ pec: 'elettrowatt@pec.it' })
  })

  it('corregge Nome=ragione sociale quando Odoo ha già la ragione senza il contatto', () => {
    const patch = buildUserBusinessPatch(
      {
        ...emptyUser,
        firstName: 'ElettroWatt Di Vissani',
        lastName: 'Alessandro',
      },
      {
        contactIsCompany: false,
        firstName: 'Alessandro',
        lastName: '',
        phone: '',
        business: {
          companyName: 'ElettroWatt Di Vissani',
          vatNumber: 'IT01234567890',
          isCompany: true,
        },
      },
    )
    expect(patch).toMatchObject({
      companyName: 'ElettroWatt Di Vissani',
      firstName: 'Alessandro',
      lastName: '',
      vatNumber: 'IT01234567890',
    })
  })

  it('corregge Nome=ragione sociale / Cognome=persona senza toccare i privati', () => {
    const patch = buildUserBusinessPatch(
      {
        ...emptyUser,
        firstName: 'ElettroWatt Di Vissani',
        lastName: 'Alessandro',
      },
      {
        contactIsCompany: true,
        firstName: '',
        lastName: '',
        phone: '',
        business: {
          companyName: 'ElettroWatt Di Vissani Alessandro',
          vatNumber: 'IT01234567890',
          isCompany: true,
        },
      },
    )
    expect(patch).toMatchObject({
      companyName: 'ElettroWatt Di Vissani',
      firstName: 'Alessandro',
      lastName: '',
      vatNumber: 'IT01234567890',
    })
  })

  it('lascia Mario/Rossi intatti per un privato', () => {
    const patch = buildUserBusinessPatch(
      {
        ...emptyUser,
        firstName: 'Mario',
        lastName: 'Rossi',
      },
      {
        contactIsCompany: false,
        firstName: 'Mario',
        lastName: 'Rossi',
        phone: '',
        business: { companyName: null, isCompany: false },
      },
    )
    expect(patch).toBeNull()
  })
})
