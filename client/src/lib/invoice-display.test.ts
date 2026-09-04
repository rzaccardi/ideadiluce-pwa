import { describe, expect, it } from 'vitest'
import {
  invoiceIsPaid,
  invoicePaymentLabel,
  invoicePaymentTone,
  invoiceStateLabel,
  invoiceStateTone,
} from './invoice-display'

describe('invoiceStateLabel', () => {
  it('traduce posted in Confermato', () => {
    expect(invoiceStateLabel('posted')).toBe('Confermato')
    expect(invoiceStateLabel('POSTED')).toBe('Confermato')
  })

  it('lascia invariati gli stati sconosciuti', () => {
    expect(invoiceStateLabel('unknown')).toBe('unknown')
  })
})

describe('invoiceStateTone', () => {
  it('assegna il verde a posted', () => {
    expect(invoiceStateTone('posted')).toBe('success')
  })
})

describe('invoice payment badge', () => {
  it('mostra Pagato verde per payment_state paid', () => {
    expect(invoiceIsPaid('paid')).toBe(true)
    expect(invoicePaymentLabel('paid')).toBe('Pagato')
    expect(invoicePaymentTone('paid')).toBe('success')
  })

  it('mostra Non Pagato rosso per gli altri stati Odoo', () => {
    for (const state of ['not_paid', 'in_payment', 'partial', 'reversed']) {
      expect(invoiceIsPaid(state)).toBe(false)
      expect(invoicePaymentLabel(state)).toBe('Non Pagato')
      expect(invoicePaymentTone(state)).toBe('danger')
    }
  })

  it('non mostra badge se manca payment_state', () => {
    expect(invoicePaymentLabel(null)).toBeNull()
    expect(invoicePaymentLabel('')).toBeNull()
  })
})
