import { describe, expect, it } from 'vitest'
import {
  buildPwaMailLogDomain,
  isPwaMailRecord,
  mapMailLogDetail,
  mapMailLogListItem,
  odooDatetimeToIso,
  type MailLogOdooCapabilities,
} from './mail-log-admin.mapper.js'
import { parsePwaMailTemplateKey, buildPwaMailHeaders } from '../../adapters/odoo/odoo-mail.templates.js'

describe('mail-log-admin mapper', () => {
  const odoo18: MailLogOdooCapabilities = {
    hasHeaders: true,
    hasMailTemplateId: false,
    hasFailureType: true,
    hasFailureReason: true,
    hasCreateDate: true,
    hasDate: true,
  }
  const fixedNow = new Date('2026-10-15T12:00:00.000Z')

  it('costruisce il domain PWA senza mail_template_id (Odoo 18)', () => {
    expect(buildPwaMailLogDomain({ sinceDays: 0 }, odoo18, fixedNow)).toEqual([
      ['headers', 'ilike', 'X-PWA-Mail'],
    ])

    expect(
      buildPwaMailLogDomain(
        { q: 'mario@', state: 'sent', templateKey: 'site_inquiry_admin', sinceDays: 0 },
        odoo18,
        fixedNow,
      ),
    ).toEqual([
      ['headers', 'ilike', 'X-PWA-Mail'],
      ['state', '=', 'sent'],
      ['headers', 'ilike', 'X-PWA-Template: site_inquiry_admin'],
      '|',
      ['email_to', 'ilike', 'mario@'],
      ['subject', 'ilike', 'mario@'],
    ])

    expect(buildPwaMailLogDomain({ state: 'bounce', sinceDays: 0 }, odoo18, fixedNow)).toEqual([
      ['headers', 'ilike', 'X-PWA-Mail'],
      '|',
      ['failure_type', 'ilike', 'bounce'],
      ['failure_reason', 'ilike', 'bounce'],
    ])
  })

  it('limita lo storico con create_date (default 180 giorni)', () => {
    expect(buildPwaMailLogDomain({}, odoo18, fixedNow)).toEqual([
      ['headers', 'ilike', 'X-PWA-Mail'],
      ['create_date', '>=', '2026-04-18 12:00:00'],
    ])
  })

  it('usa solo headers anche se mail_template_id è disponibile (niente OR)', () => {
    expect(
      buildPwaMailLogDomain(
        { sinceDays: 0 },
        {
          hasHeaders: true,
          hasMailTemplateId: true,
          hasFailureType: true,
          hasFailureReason: true,
          hasCreateDate: true,
          hasDate: true,
        },
        fixedNow,
      ),
    ).toEqual([['headers', 'ilike', 'X-PWA-Mail']])
  })

  it('fallback a mail_template_id se headers non disponibili', () => {
    expect(
      buildPwaMailLogDomain(
        { sinceDays: 0 },
        {
          hasHeaders: false,
          hasMailTemplateId: true,
          hasFailureType: true,
          hasFailureReason: true,
          hasCreateDate: false,
          hasDate: false,
        },
        fixedNow,
      ),
    ).toEqual([['mail_template_id.name', '=like', '[PWA]%']])
  })

  it('riconosce i record PWA da header o template', () => {
    expect(isPwaMailRecord({ headers: buildPwaMailHeaders('password_reset') })).toBe(true)
    expect(isPwaMailRecord({ mail_template_id: [3, '[PWA] Reimposta password'] })).toBe(true)
    expect(isPwaMailRecord({ headers: "{'X-PWA-Mail': '1'}", mail_template_id: false })).toBe(true)
    expect(isPwaMailRecord({ headers: false, mail_template_id: [9, 'Sales: Send by Email'] })).toBe(
      false,
    )
  })

  it('mappa elenco e dettaglio con anteprima HTML', () => {
    const row = {
      id: 44,
      subject: 'Il tuo account Idea di Luce',
      email_to: 'mario@test.it',
      email_from: 'shop@ideadiluce.com',
      reply_to: false,
      state: 'sent',
      date: '2026-09-02 13:40:00',
      create_date: '2026-09-02 13:39:50',
      mail_template_id: [11, '[PWA] Credenziali account cliente'],
      failure_reason: false,
      failure_type: false,
      headers: buildPwaMailHeaders('account_credentials'),
      body_html: '<p>Ciao Mario</p>',
      body: 'Ciao Mario',
    }

    const item = mapMailLogListItem(row)
    expect(item.templateKey).toBe('account_credentials')
    expect(item.templateLabel).toBe('Credenziali account cliente')
    expect(item.sentAt).toBe('2026-09-02T13:40:00.000Z')
    expect(item.deliveryState).toBe('sent')
    expect(item.deliveryLabel).toBe('Inviata')
    expect(item.deliveryNote).toMatch(/server di posta ha accettato/)
    expect(parsePwaMailTemplateKey(row.headers)).toBe('account_credentials')

    const detail = mapMailLogDetail(row, [], 'https://odoo.example/web#id=44')
    expect(detail.bodyHtml).toContain('<p>Ciao Mario</p>')
    expect(detail.bodyHtml).toContain('wordmark-white.png')
    expect(detail.bodyHtml).toContain('wordmark-lockup.png')
    expect(detail.bodyHtml).toContain('<html')
    expect(detail.odooUrl).toContain('id=44')
  })

  it('non duplica header e footer se Odoo ha già il documento completo', () => {
    const full = '<html><body><img src="https://shop.ideadiluce.it/brand/wordmark-white.png" alt="Idea di Luce"><p>Ciao</p></body></html>'
    const detail = mapMailLogDetail(
      {
        id: 45,
        subject: 'Già completa',
        email_to: 'mario@test.it',
        state: 'sent',
        headers: buildPwaMailHeaders('generic'),
        body_html: full,
      },
      [],
      null,
    )
    expect(detail.bodyHtml).toBe(full)
  })

  it('mostra errore Odoo quando lo stato è exception', () => {
    const item = mapMailLogListItem({
      id: 8,
      subject: 'Conferma ordine',
      email_to: 'mario@test.it',
      state: 'exception',
      failure_type: 'mail_smtp',
      failure_reason: 'Connection refused',
      headers: buildPwaMailHeaders('order_confirmation'),
    })
    expect(item.deliveryState).toBe('exception')
    expect(item.deliveryLabel).toBe('Errore invio')
    expect(item.deliveryNote).toContain('Connection refused')
    expect(item.failureReason).toBe('Connection refused')
  })

  it('marca bounce dalla notifica Odoo anche se mail.mail è sent', () => {
    const item = mapMailLogListItem(
      {
        id: 9,
        subject: 'Conferma ordine',
        email_to: 'bounced@test.it',
        state: 'sent',
        failure_reason: false,
        headers: buildPwaMailHeaders('order_confirmation'),
      },
      { status: 'bounce', failureType: 'mail_bounce', failureReason: '550 user unknown' },
    )
    expect(item.deliveryState).toBe('bounce')
    expect(item.deliveryLabel).toBe('Non consegnata')
    expect(item.deliveryNote).toContain('550 user unknown')
  })

  it('converte datetime Odoo in ISO', () => {
    expect(odooDatetimeToIso('2026-09-02 10:00:00')).toBe('2026-09-02T10:00:00.000Z')
    expect(odooDatetimeToIso(false)).toBeNull()
  })
})
