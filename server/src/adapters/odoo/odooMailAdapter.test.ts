import { beforeEach, describe, expect, it, vi } from 'vitest'

const { odooExecuteKw, sendMail, envState, odooConfigured, resilience } = vi.hoisted(() => ({
  odooExecuteKw: vi.fn(),
  sendMail: vi.fn(),
  envState: { ODOO_ENABLED: true },
  odooConfigured: { value: true },
  resilience: { emergency: false, smtpFallback: false },
}))

vi.mock('../../config/env.js', () => ({
  env: envState,
}))

vi.mock('../../lib/mail.js', () => ({
  sendMail,
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('../../modules/odoo/odoo-resilience.settings.js', () => ({
  isEmergencyMode: async () => resilience.emergency,
  isSmtpFallbackEnabled: async () => resilience.smtpFallback,
}))

vi.mock('./odooClient.js', () => ({
  isOdooConfigured: () => odooConfigured.value,
  odooExecuteKw: (...args: unknown[]) => odooExecuteKw(...args),
}))

import { renderPwaMailPlaceholders } from './odoo-mail.templates.js'
import {
  resetOdooMailTemplateCache,
  sendOdooTransactionalMail,
  sendPwaMail,
} from './odooMailAdapter.js'

function odooAccepted() {
  return [{ state: 'sent', failure_reason: false, failure_type: false }]
}

describe('renderPwaMailPlaceholders', () => {
  it('escapa HTML e lascia i valori *_html', () => {
    expect(
      renderPwaMailPlaceholders('<p>Ciao {{name}}</p>{{body_html}}', {
        name: 'A <b>B</b>',
        body_html: '<strong>ok</strong>',
      }),
    ).toBe('<p>Ciao A &lt;b&gt;B&lt;/b&gt;</p><strong>ok</strong>')
  })

  it('in modalità text non escapa', () => {
    expect(renderPwaMailPlaceholders('Preventivo {{email}}', { email: 'a&b@x.it' }, 'text')).toBe(
      'Preventivo a&b@x.it',
    )
  })
})

describe('sendPwaMail', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
    sendMail.mockReset()
    resetOdooMailTemplateCache()
    envState.ODOO_ENABLED = true
    odooConfigured.value = true
    resilience.emergency = false
    resilience.smtpFallback = false
  })

  it('crea il mail.template se manca e invia con mail.mail', async () => {
    odooExecuteKw
      .mockResolvedValueOnce([]) // template search
      .mockResolvedValueOnce([{ id: 7 }]) // ir.model
      .mockResolvedValueOnce(11) // template create
      .mockResolvedValueOnce([
        {
          subject: 'Il tuo account Idea di Luce',
          body_html: '<p>Ciao{{first_name_suffix}}</p><p>{{email}}</p>',
        },
      ])
      .mockResolvedValueOnce(99) // mail.mail create
      .mockResolvedValueOnce(true) // send
      .mockResolvedValueOnce(odooAccepted()) // read state

    await sendPwaMail({ correlationId: 't1' }, {
      templateKey: 'account_credentials',
      emailTo: 'mario@test.it',
      vars: {
        first_name_suffix: ' Mario',
        email: 'mario@test.it',
        password: 'secret',
        login_url: 'https://shop.example/login',
        intro: 'ok',
      },
    })

    expect(odooExecuteKw.mock.calls[2]?.[1]).toBe('mail.template')
    expect(odooExecuteKw.mock.calls[2]?.[2]).toBe('create')
    expect(odooExecuteKw.mock.calls[2]?.[3]?.[0]).toMatchObject({
      name: '[PWA] Credenziali account cliente',
      model_id: 7,
    })
    expect(odooExecuteKw.mock.calls[4]?.[1]).toBe('mail.mail')
    expect(odooExecuteKw.mock.calls[4]?.[2]).toBe('create')
    expect(odooExecuteKw.mock.calls[4]?.[3]?.[0]).toMatchObject({
      email_to: 'mario@test.it',
      auto_delete: false,
    })
    expect(odooExecuteKw.mock.calls[4]?.[3]?.[0]).not.toHaveProperty('mail_template_id')
    expect(String(odooExecuteKw.mock.calls[4]?.[3]?.[0]?.headers)).toContain('X-PWA-Mail: 1')
    expect(String(odooExecuteKw.mock.calls[4]?.[3]?.[0]?.headers)).toContain('X-PWA-Template: account_credentials')
    expect(String(odooExecuteKw.mock.calls[4]?.[3]?.[0]?.body_html)).toContain('Ciao Mario')
    expect(odooExecuteKw.mock.calls[5]?.[1]).toBe('mail.mail')
    expect(odooExecuteKw.mock.calls[5]?.[2]).toBe('send')
    expect(odooExecuteKw.mock.calls[6]?.[1]).toBe('mail.mail')
    expect(odooExecuteKw.mock.calls[6]?.[2]).toBe('read')
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('riusa un template già presente in Odoo', async () => {
    odooExecuteKw
      .mockResolvedValueOnce([{ id: 21 }])
      .mockResolvedValueOnce([{ subject: 'Reimposta la password — Idea di Luce', body_html: '{{reset_url}}' }])
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(odooAccepted())

    await sendPwaMail({ correlationId: 't2' }, {
      templateKey: 'password_reset',
      emailTo: 'x@y.it',
      vars: { hours: '24', reset_url: 'https://shop.example/reset?token=abc' },
    })

    const models = odooExecuteKw.mock.calls.map((c: unknown[]) => `${c[1]}/${c[2]}`)
    expect(models).toEqual([
      'mail.template/search_read',
      'mail.template/search_read',
      'mail.mail/create',
      'mail.mail/send',
      'mail.mail/read',
    ])
    expect(odooExecuteKw.mock.calls[2]?.[3]?.[0]?.subject).toBe('Reimposta la password — Idea di Luce')
  })

  it('allego i file come ir.attachment', async () => {
    odooExecuteKw
      .mockResolvedValueOnce([{ id: 3 }])
      .mockResolvedValueOnce([{ subject: 's', body_html: 'b' }])
      .mockResolvedValueOnce(44)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(odooAccepted())

    await sendPwaMail({ correlationId: 't3' }, {
      templateKey: 'site_inquiry_admin',
      emailTo: 'info@ideadiluce.com',
      vars: { kind_label: 'Contatto', customer_name: 'Mario', body_text: 'ciao' },
      attachments: [{ filename: 'foto.jpg', content: Buffer.from('abc'), mimetype: 'image/jpeg' }],
    })

    expect(odooExecuteKw.mock.calls[2]?.[1]).toBe('ir.attachment')
    expect(odooExecuteKw.mock.calls[3]?.[3]?.[0]?.attachment_ids).toEqual([[6, 0, [44]]])
  })

  it('usa SMTP solo se Odoo non è configurato', async () => {
    envState.ODOO_ENABLED = false
    odooConfigured.value = false

    await sendPwaMail({ correlationId: 't4' }, {
      templateKey: 'password_reset',
      emailTo: 'x@y.it',
      vars: { hours: '24', reset_url: 'https://x/reset' },
    })

    expect(odooExecuteKw).not.toHaveBeenCalled()
    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(sendMail.mock.calls[0]?.[0]).toMatchObject({
      to: 'x@y.it',
      subject: 'Reimposta la password — Idea di Luce',
    })
  })

  it('se il template fallisce riprova con mail.mail diretto', async () => {
    odooExecuteKw
      .mockRejectedValueOnce(new Error('template denied'))
      .mockResolvedValueOnce(77)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(odooAccepted())

    await sendPwaMail({ correlationId: 't5' }, {
      templateKey: 'generic',
      emailTo: 'x@y.it',
      vars: { subject: 'Ciao', body_text: 'testo', body_html: '<p>testo</p>' },
    })

    expect(odooExecuteKw.mock.calls[1]?.[1]).toBe('mail.mail')
    expect(odooExecuteKw.mock.calls[1]?.[2]).toBe('create')
    expect(odooExecuteKw.mock.calls[1]?.[3]?.[0]).toMatchObject({
      email_to: 'x@y.it',
      subject: 'Ciao',
    })
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('fallisce se Odoo marca il messaggio come exception', async () => {
    odooExecuteKw
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ subject: '{{subject}}', body_html: '{{body_html}}' }])
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce([
        { state: 'exception', failure_reason: 'SMTP connect timeout', failure_type: 'mail_smtp' },
      ])

    await expect(
      sendPwaMail({ correlationId: 't-fail' }, {
        templateKey: 'generic',
        emailTo: 'x@y.it',
        vars: { subject: 'Ciao', body_text: 'testo', body_html: '<p>testo</p>' },
      }),
    ).rejects.toThrow('SMTP connect timeout')
  })

  it('se Odoo mail fallisce e SMTP fallback è attivo usa SMTP', async () => {
    resilience.smtpFallback = true
    odooExecuteKw.mockRejectedValue(new Error('odoo down'))

    await sendPwaMail({ correlationId: 't-smtp' }, {
      templateKey: 'generic',
      emailTo: 'x@y.it',
      vars: { subject: 'Ciao', body_text: 'testo', body_html: '<p>testo</p>' },
    })

    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(sendMail.mock.calls[0]?.[0]).toMatchObject({
      to: 'x@y.it',
      subject: 'Ciao',
    })
  })
})

describe('sendOdooTransactionalMail', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
    sendMail.mockReset()
    resetOdooMailTemplateCache()
    envState.ODOO_ENABLED = true
    odooConfigured.value = true
    resilience.emergency = false
    resilience.smtpFallback = false
  })

  it('passa dal template generico PWA', async () => {
    odooExecuteKw
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ subject: '{{subject}}', body_html: '{{body_html}}' }])
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(odooAccepted())

    await sendOdooTransactionalMail(
      { correlationId: 't6' },
      { emailTo: 'a@b.it', subject: 'Oggetto', bodyText: 'Corpo' },
    )

    expect(odooExecuteKw.mock.calls[0]?.[3]).toEqual([[['name', '=', '[PWA] Notifica generica']]])
    expect(odooExecuteKw.mock.calls[2]?.[3]?.[0]?.subject).toBe('Oggetto')
  })
})
