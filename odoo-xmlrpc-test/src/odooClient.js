const http = require('http')
const https = require('https')
const { URL } = require('url')
const { Readable } = require('stream')
const zlib = require('zlib')
const { promisify } = require('util')

const Serializer = require('xmlrpc/lib/serializer')
const Deserializer = require('xmlrpc/lib/deserializer')

const gunzip = promisify(zlib.gunzip)
const inflate = promisify(zlib.inflate)

/**
 * @param {string} baseUrl
 * @param {'/xmlrpc/2/common' | '/xmlrpc/2/object'} suffix
 */
function resolveEndpoint(baseUrl) {
  const u = new URL(baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl)
  const isHttps = u.protocol === 'https:'
  const port = u.port ? parseInt(u.port, 10) : isHttps ? 443 : 80
  const host = u.hostname
  const pathPrefix = u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '')
  return { isHttps, host, port, pathPrefix }
}

function endpointPath(pathPrefix, suffix) {
  return `${pathPrefix}${suffix}`
}

/**
 * Legge il body HTTP; se il server invia gzip/deflate nonostante identity, decomprime.
 * @param {import('http').IncomingMessage} res
 */
async function readResponseBody(res) {
  const chunks = []
  for await (const chunk of res) {
    chunks.push(chunk)
  }
  let buf = Buffer.concat(chunks)
  const enc = String(res.headers['content-encoding'] || '')
    .toLowerCase()
    .trim()
  if (enc.includes('gzip')) {
    buf = await gunzip(buf)
  } else if (enc.includes('deflate')) {
    buf = await inflate(buf)
  }
  return buf
}

/**
 * POST XML-RPC con controllo HTTP e body utile in caso di errore.
 * @param {{ isHttps: boolean, host: string, port: number, path: string }} target
 * @param {string} method
 * @param {unknown[]} params
 * @param {number} timeoutMs
 */
function xmlRpcMethodCall(target, method, params, timeoutMs) {
  const xml = Serializer.serializeMethodCall(method, params, 'utf8')
  const bodyBuffer = Buffer.from(xml, 'utf8')
  const lib = target.isHttps ? https : http

  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), timeoutMs)

    const req = lib.request(
      {
        hostname: target.host,
        port: target.port,
        path: target.path,
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          Accept: 'text/xml',
          /** Evita risposte gzip che il vecchio client xmlrpc non decodifica sullo stream. */
          'Accept-Encoding': 'identity',
          'Content-Length': bodyBuffer.length,
          'User-Agent': 'odoo-xmlrpc-test/1.0',
        },
      },
      async (res) => {
        clearTimeout(t)
        try {
          const buf = await readResponseBody(res)
          const textPreview = buf.toString('utf8', 0, Math.min(400, buf.length))

          if (res.statusCode === 404) {
            reject(
              new Error(
                `HTTP 404 su ${target.path}. Verifica ODOO_URL (path deploy, es. /odoo). Anteprima: ${textPreview}`,
              ),
            )
            return
          }

          if (res.statusCode && res.statusCode !== 200) {
            reject(
              new Error(
                `HTTP ${res.statusCode} da Odoo su ${target.path}. Anteprima body:\n${textPreview}`,
              ),
            )
            return
          }

          if (buf.length === 0) {
            reject(
              new Error(
                `Risposta vuota da ${target.path} (HTTP ${res.statusCode}). Proxy o URL errato?`,
              ),
            )
            return
          }

          const stream = Readable.from(buf)
          const deserializer = new Deserializer('utf8')
          deserializer.deserializeMethodResponse(stream, (err, result) => {
            if (err) {
              if (err.message === 'Invalid XML-RPC message') {
                reject(
                  new Error(
                    `Invalid XML-RPC message (la risposta non è un methodResponse valido). ` +
                      `HTTP ${res.statusCode}, inizio body:\n${textPreview}`,
                  ),
                )
              } else {
                reject(err)
              }
            } else {
              resolve(result)
            }
          })
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)))
        }
      },
    )

    req.on('error', (e) => {
      clearTimeout(t)
      if (e.name === 'AbortError' || e.code === 'ABORT_ERR') {
        reject(new Error(`Timeout XML-RPC (${timeoutMs} ms) su ${method}`))
        return
      }
      reject(e)
    })

    req.write(bodyBuffer)
    req.end()
  })
}

/**
 * Client minimale Odoo 18 XML-RPC.
 * @param {{ odooUrl: string, db: string, username: string, password: string, timeoutMs: number }} config
 */
function createOdooClient(config) {
  const ep = resolveEndpoint(config.odooUrl)
  const commonTarget = {
    isHttps: ep.isHttps,
    host: ep.host,
    port: ep.port,
    path: endpointPath(ep.pathPrefix, '/xmlrpc/2/common'),
  }
  const objectTarget = {
    isHttps: ep.isHttps,
    host: ep.host,
    port: ep.port,
    path: endpointPath(ep.pathPrefix, '/xmlrpc/2/object'),
  }

  let cachedUid = null

  async function authenticate() {
    const uid = await xmlRpcMethodCall(
      commonTarget,
      'authenticate',
      [config.db, config.username, config.password, {}],
      config.timeoutMs,
    )
    if (!uid || typeof uid !== 'number' || uid <= 0) {
      throw new Error('Autenticazione fallita')
    }
    cachedUid = uid
    return uid
  }

  /**
   * execute_kw → search_read
   * @param {string} model
   * @param {unknown[]} domain
   * @param {string[]} fields
   * @param {number} limit
   */
  async function searchRead(model, domain = [], fields = [], limit = 5) {
    const uid = cachedUid != null ? cachedUid : await authenticate()
    const kwargs = { fields, limit }
    const rows = await xmlRpcMethodCall(
      objectTarget,
      'execute_kw',
      [config.db, uid, config.password, model, 'search_read', [domain], kwargs],
      config.timeoutMs,
    )
    return rows
  }

  function invalidateSession() {
    cachedUid = null
  }

  return { authenticate, searchRead, invalidateSession }
}

module.exports = { createOdooClient }
