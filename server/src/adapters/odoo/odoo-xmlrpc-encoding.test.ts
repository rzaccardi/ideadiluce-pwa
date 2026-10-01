import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const Serializer = require('xmlrpc/lib/serializer.js') as {
  serializeMethodCall: (method: string, params: unknown[], encoding?: string) => string
}

/**
 * Regressione: Odoo/Expat rifiuta `encoding="utf8"` (non IANA) sui payload non-ASCII.
 * Il client deve serializzare con `utf-8` (vedi odooClient.xmlRpcMethodCall).
 */
describe('xmlrpc mail encoding', () => {
  it('utf8 dichiara un encoding non valido per Expat', () => {
    const xml = Serializer.serializeMethodCall('m', ['cafè'], 'utf8')
    expect(xml).toContain('encoding="utf8"')
  })

  it('utf-8 è l’encoding IANA corretto usato dal client Odoo', () => {
    const xml = Serializer.serializeMethodCall(
      'execute_kw',
      [
        'db',
        1,
        'pw',
        'mail.mail',
        'create',
        [
          {
            subject: 'Benvenuto su Idea di Luce',
            body_html: '<p>Ciao · prova - accenti è à</p>',
          },
        ],
        {},
      ],
      'utf-8',
    )
    expect(xml).toContain('encoding="utf-8"')
    expect(xml).toContain('Benvenuto su Idea di Luce')
    expect(xml).toContain('è')
  })
})
