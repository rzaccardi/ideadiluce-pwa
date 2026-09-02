import { beforeEach, describe, expect, it, vi } from 'vitest'

const { odooExecuteKw, odooConfigured, envState } = vi.hoisted(() => ({
  odooExecuteKw: vi.fn(),
  odooConfigured: { value: true },
  envState: { ODOO_ENABLED: true },
}))

vi.mock('../../config/env.js', () => ({ env: envState }))

vi.mock('../../adapters/odoo/odooClient.js', async () => {
  const { AppError: AppErr } = await import('../../types/errors.js')
  return {
    isOdooConfigured: () => odooConfigured.value,
    odooExecuteKw: (...args: unknown[]) => odooExecuteKw(...args),
    toAppError: (e: unknown, correlationId: string) =>
      new AppErr(
        'ODOO_UPSTREAM_ERROR',
        e instanceof Error ? e.message : String(e),
        'Errore temporaneo dal gestionale. Riprova più tardi.',
        502,
        true,
        { correlationId },
      ),
    getOdooWebBaseUrlOrNull: () => 'https://odoo.example',
    buildOdooMailWebUrl: (base: string, id: number) => `${base}/web#id=${id}`,
  }
})

import { mailLogAdminService, resetMailLogAdminFieldsCache } from './mail-log-admin.service.js'

const ODOO18_FIELDS = {
  id: {},
  subject: {},
  email_to: {},
  email_from: {},
  state: {},
  date: {},
  create_date: {},
  failure_reason: {},
  failure_type: {},
  headers: {},
  body_html: {},
  body: {},
  reply_to: {},
  attachment_ids: {},
}

describe('mailLogAdminService.list', () => {
  beforeEach(() => {
    odooExecuteKw.mockReset()
    envState.ODOO_ENABLED = true
    odooConfigured.value = true
    resetMailLogAdminFieldsCache()
  })

  it('non chiede mail_template_id se Odoo 18 non lo espone', async () => {
    odooExecuteKw
      .mockResolvedValueOnce(ODOO18_FIELDS)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce([
        {
          id: 44,
          subject: 'Ciao',
          email_to: 'mario@test.it',
          state: 'sent',
          date: '2026-09-02 13:40:00',
          headers: 'X-PWA-Mail: 1\nX-PWA-Template: account_credentials',
        },
      ])
      .mockResolvedValueOnce([])

    const result = await mailLogAdminService.list({
      page: 1,
      pageSize: 25,
      state: 'all',
      templateKey: 'all',
    })

    const searchRead = odooExecuteKw.mock.calls.find(
      (c) => c[1] === 'mail.mail' && c[2] === 'search_read',
    )
    expect(searchRead?.[3]?.[0]).toEqual([['headers', 'ilike', 'X-PWA-Mail']])
    expect(searchRead?.[4]?.fields).not.toContain('mail_template_id')
    expect(searchRead?.[4]?.fields).toContain('headers')
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.templateKey).toBe('account_credentials')
    expect(result.configured).toBe(true)
  })

  it('converte errori Odoo in AppError invece di Internal error', async () => {
    odooExecuteKw.mockRejectedValueOnce(new Error('Invalid field mail.mail.mail_template_id'))
    await expect(
      mailLogAdminService.list({ page: 1, pageSize: 25, state: 'all', templateKey: 'all' }),
    ).rejects.toMatchObject({
      name: 'AppError',
      code: 'ODOO_UPSTREAM_ERROR',
    })
  })

  it('restituisce pagina vuota se Odoo non è configurato', async () => {
    odooConfigured.value = false
    const result = await mailLogAdminService.list({
      page: 1,
      pageSize: 25,
      state: 'all',
      templateKey: 'all',
    })
    expect(result).toMatchObject({ items: [], total: 0, configured: false })
    expect(odooExecuteKw).not.toHaveBeenCalled()
  })
})
