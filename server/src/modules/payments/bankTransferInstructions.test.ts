import { describe, expect, it, vi } from 'vitest'

vi.mock('../../config/env.js', () => ({
  env: {},
}))

import {
  BANK_TRANSFER_CONFIG_DEFAULTS,
  buildBankTransferInstructions,
  buildBankTransferPaymentReference,
  isOdooSampleBankTransferIban,
} from './bankTransferInstructions.js'

describe('buildBankTransferInstructions', () => {
  const baseOrder = {
    id: 'pwa-abc123',
    odooSaleOrderId: 88,
    odooSaleOrderName: '4CSVKG',
    createdAt: new Date('2026-03-01T10:00:00Z'),
    billingAddressJson: {
      firstName: 'Mario',
      lastName: 'Rossi',
      line1: 'Via Roma 1',
      city: 'Roma',
      postalCode: '00100',
      country: 'IT',
    },
    shippingAddressJson: null,
    fiscalJson: null,
    email: 'mario@example.com',
    currencyCode: 'EUR',
  }

  it('usa i default TLB quando Odoo non restituisce coordinate', () => {
    const instructions = buildBankTransferInstructions({
      order: baseOrder,
      amountCents: 12900,
    })
    expect(instructions.holder).toBe(BANK_TRANSFER_CONFIG_DEFAULTS.holder)
    expect(instructions.iban).toBe(BANK_TRANSFER_CONFIG_DEFAULTS.iban)
    expect(instructions.bankName).toBe(BANK_TRANSFER_CONFIG_DEFAULTS.bankName)
    expect(instructions.reference).toBe('Saldo Ordine 4CSVKG - Mario Rossi')
    expect(instructions.amount).toBe(12900)
  })

  it('preferisce bank_transfer da Odoo e ignora IBAN demo', () => {
    const instructions = buildBankTransferInstructions({
      order: baseOrder,
      amountCents: 12900,
      odooResult: {
        amount_cents: 12900,
        bank_transfer: {
          account_holder: 'TLB ITALY Srl',
          iban: 'IT60X0542811101000000123456',
          bank_name: 'Intesa Sanpaolo',
          payment_reason: 'Saldo Ordine 4CSVKG - Mario Rossi',
        },
      },
    })
    expect(instructions.holder).toBe('TLB ITALY Srl')
    expect(instructions.iban).toBe(BANK_TRANSFER_CONFIG_DEFAULTS.iban)
    expect(instructions.bankName).toBe('Intesa Sanpaolo')
    expect(instructions.reference).toBe('Saldo Ordine 4CSVKG - Mario Rossi')
  })

  it('rileva IBAN demo Odoo', () => {
    expect(isOdooSampleBankTransferIban('IT60 X054 2811 1010 0000 0123 456')).toBe(true)
    expect(isOdooSampleBankTransferIban(BANK_TRANSFER_CONFIG_DEFAULTS.iban)).toBe(false)
  })
})

describe('buildBankTransferPaymentReference', () => {
  it('formatta causale Saldo Ordine', () => {
    expect(
      buildBankTransferPaymentReference(
        { id: 'x', odooSaleOrderId: 1, odooSaleOrderName: 'SO123', createdAt: new Date() },
        'Acme Srl',
      ),
    ).toBe('Saldo Ordine SO123 - Acme Srl')
  })
})
