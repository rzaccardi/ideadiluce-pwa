import type { Request } from 'express'
import http from 'node:http'
import https from 'node:https'
import { createRequire } from 'node:module'
import { Readable } from 'node:stream'
import { promisify } from 'node:util'
import zlib from 'node:zlib'
import { URL } from 'node:url'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import { writeIntegrationLog } from '../../lib/integration-log.js'
import { redactForLog } from '../../lib/redact.js'
import { AppError } from '../../types/errors.js'

const require = createRequire(import.meta.url)
const Serializer = require('xmlrpc/lib/serializer.js') as {
  serializeMethodCall: (method: string, params: unknown[], encoding: string) => string
}
const Deserializer = require('xmlrpc/lib/deserializer.js') as new (encoding?: string) => {
  deserializeMethodResponse: (
    stream: NodeJS.ReadableStream,
    callback: (err: Error | null, result?: unknown) => void,
  ) => void
}

const gunzip = promisify(zlib.gunzip)
const inflate = promisify(zlib.inflate)

export type OdooCallContext = {
  correlationId: string
  /** Per logging e pricing session; opzionale se si invoca fuori da Express */
  req?: Request
}

export class OdooClientError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
    public readonly odooName?: string,
  ) {
    super(message)
    this.name = 'OdooClientError'
  }
}

/** Origine pubblica Odoo (es. `https://www.esempio.it/odoo`). `ODOO_URL` ha priorità; `ODOO_BASE_URL` è fallback deprecato. */
export function getOdooPublicBaseUrl(): string {
  const raw = env.ODOO_URL?.trim() || env.ODOO_BASE_URL?.trim()
  if (!raw) {
    throw new AppError(
      'ODOO_MISCONFIGURED',
      'Odoo URL missing',
      'URL Odoo non configurato.',
      500,
      false,
    )
  }
  return raw.replace(/\/$/, '')
}

/** Base URL web Odoo per link admin BO; `null` se Odoo non è configurato. */
export function getOdooWebBaseUrlOrNull(): string | null {
  if (!isOdooConfigured()) return null
  const raw = env.ODOO_URL?.trim() || env.ODOO_BASE_URL?.trim()
  if (!raw) return null
  return raw.replace(/\/$/, '')
}

/** Base web Odoo con segmento `/odoo` (evita doppio `/odoo/odoo` se `ODOO_URL` lo include già). */
export function normalizeOdooWebBaseUrl(baseUrl: string): string {
  let base = baseUrl.trim().replace(/\/$/, '')
  while (/\/odoo\/odoo$/.test(base)) {
    base = base.replace(/\/odoo\/odoo$/, '/odoo')
  }
  if (base.endsWith('/odoo')) return base
  return `${base}/odoo`
}

/** ID azione menu Odoo per aprire un `product.template` nel client web. */
export function getOdooProductActionId(): number {
  return env.ODOO_PRODUCT_ACTION_ID
}

/** Form prodotto `product.template` nel client web Odoo (es. `/odoo/action-497/{id}`). */
export function buildOdooProductWebUrl(
  baseUrl: string,
  templateId: number,
  actionId: number = getOdooProductActionId(),
): string {
  const base = normalizeOdooWebBaseUrl(baseUrl)
  return `${base}/action-${actionId}/${templateId}`
}

/** Form contatto `res.partner` nel client web Odoo 17+ (path relativo a `ODOO_URL`). */
export function buildOdooPartnerWebUrl(baseUrl: string, partnerId: number): string {
  const base = baseUrl.replace(/\/$/, '')
  return `${base}/contacts/${partnerId}`
}

export function isOdooConfigured(): boolean {
  const url =
    env.ODOO_XMLRPC_URL?.trim() || env.ODOO_URL?.trim() || env.ODOO_BASE_URL?.trim()
  return Boolean(
    env.ODOO_ENABLED &&
      url &&
      env.ODOO_DB?.trim() &&
      env.ODOO_USERNAME?.trim() &&
      typeof env.ODOO_PASSWORD === 'string',
  )
}

export function assertOdooConfigured(): void {
  if (!env.ODOO_ENABLED) {
    throw new AppError(
      'ODOO_DISABLED',
      'Odoo integration disabled',
      'Integrazione Odoo disattivata sul server.',
      503,
      false,
    )
  }
  if (!isOdooConfigured()) {
    throw new AppError(
      'ODOO_MISCONFIGURED',
      'Odoo env incomplete',
      'Configurazione Odoo incompleta (ODOO_URL o ODOO_XMLRPC_URL o ODOO_BASE_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD).',
      500,
      false,
    )
  }
}

type RpcTarget = {
  isHttps: boolean
  host: string
  port: number
  path: string
}

let cachedCommonTarget: RpcTarget | null = null
let cachedObjectTarget: RpcTarget | null = null

function baseUrlForXmlRpc(): string {
  return (
    env.ODOO_XMLRPC_URL?.trim() || env.ODOO_URL?.trim() || env.ODOO_BASE_URL?.trim() || ''
  )
}

function resolveRpcTarget(suffix: '/xmlrpc/2/common' | '/xmlrpc/2/object'): RpcTarget {
  const baseStr = baseUrlForXmlRpc()
  if (!baseStr) {
    throw new OdooClientError('URL Odoo assente', 500)
  }
  const u = new URL(baseStr)
  const isHttps = u.protocol === 'https:'
  const port = u.port ? parseInt(u.port, 10) : isHttps ? 443 : 80
  const host = u.hostname
  const pathPrefix = u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '')
  const path = `${pathPrefix}${suffix}`
  return { isHttps, host, port, path }
}

function getCommonRpcTarget(): RpcTarget {
  if (!cachedCommonTarget) cachedCommonTarget = resolveRpcTarget('/xmlrpc/2/common')
  return cachedCommonTarget
}

function getObjectRpcTarget(): RpcTarget {
  if (!cachedObjectTarget) cachedObjectTarget = resolveRpcTarget('/xmlrpc/2/object')
  return cachedObjectTarget
}

function buildAbsoluteUrl(t: RpcTarget): string {
  const scheme = t.isHttps ? 'https' : 'http'
  const defPort = t.isHttps ? 443 : 80
  const portPart = t.port === defPort ? '' : `:${t.port}`
  const path = t.path.startsWith('/') ? t.path : `/${t.path}`
  return `${scheme}://${t.host}${portPart}${path}`
}

/** Risolve `Location` (assoluto o relativo) rispetto alla richiesta corrente. */
function locationToRpcTarget(current: RpcTarget, locationHeader: string): RpcTarget {
  const u = new URL(String(locationHeader).trim(), buildAbsoluteUrl(current))
  const isHttps = u.protocol === 'https:'
  const port = u.port ? parseInt(u.port, 10) : isHttps ? 443 : 80
  return {
    isHttps,
    host: u.hostname,
    port,
    path: `${u.pathname}${u.search}`,
  }
}

/** Dopo un redirect Odoo, allinea common/object alla URL canonica (stesso host, path sotto `/xmlrpc/2/`). */
function syncRpcTargetCachesFromFinalTarget(t: RpcTarget): void {
  if (/\/xmlrpc\/2\/common\/?$/i.test(t.path)) {
    cachedCommonTarget = t
    cachedObjectTarget = {
      ...t,
      path: t.path.replace(/\/xmlrpc\/2\/common\/?$/i, '/xmlrpc/2/object'),
    }
  } else if (/\/xmlrpc\/2\/object\/?$/i.test(t.path)) {
    cachedObjectTarget = t
    cachedCommonTarget = {
      ...t,
      path: t.path.replace(/\/xmlrpc\/2\/object\/?$/i, '/xmlrpc/2/common'),
    }
  }
}

async function readXmlRpcResponseBody(res: http.IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of res) {
    chunks.push(chunk as Buffer)
  }
  let buf = Buffer.concat(chunks)
  const enc = String(res.headers['content-encoding'] ?? '')
    .toLowerCase()
    .trim()
  if (enc.includes('gzip')) {
    buf = await gunzip(buf)
  } else if (enc.includes('deflate')) {
    buf = await inflate(buf)
  } else if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    /* Alcuni proxy comprimono ma omettono Content-Encoding. */
    try {
      buf = await gunzip(buf)
    } catch {
      /* lascia buf così com'è, il deserializzatore segnalerà l'errore */
    }
  }
  return buf
}

function faultToOdooClientError(err: unknown): OdooClientError {
  if (err instanceof OdooClientError) return err
  const o = err as { faultCode?: number; faultString?: string; code?: string }
  const msg =
    typeof o.faultString === 'string'
      ? o.faultString
      : err instanceof Error
        ? err.message
        : String(err)
  const name = o.faultCode != null ? String(o.faultCode) : o.code
  const lower = msg.toLowerCase()
  let httpStatus = 502
  if (lower.includes('access denied') || lower.includes('credentials')) httpStatus = 401
  if (lower.includes('database') && lower.includes('not')) httpStatus = 400
  return new OdooClientError(msg, httpStatus, name)
}

const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308])

/** Es. `/odoo/xmlrpc/2/common` → `/xmlrpc/2/common` quando la RPC è servita alla radice del vhost. */
function rootXmlRpcPathFromNested(path: string): string | null {
  const marker = '/xmlrpc/2/'
  const i = path.indexOf(marker)
  if (i <= 0) return null
  return path.slice(i)
}

/**
 * POST XML-RPC con body bufferizzato e decompressione gzip/deflate se presente;
 * segue redirect 301/302/307/308 (Node non li segue da solo) e aggiorna la cache degli endpoint.
 * Il client ufficiale `xmlrpc` in streaming non decomprime: le risposte grandi (es. `search_read` prodotti)
 * dietro proxy che forzano gzip causano "Invalid XML-RPC message".
 */
function xmlRpcMethodCall(
  target: RpcTarget,
  method: string,
  params: unknown[],
  timeoutMs: number,
): Promise<unknown> {
  const xml = Serializer.serializeMethodCall(method, params, 'utf8')
  const bodyBuffer = Buffer.from(xml, 'utf8')
  const deadline = Date.now() + timeoutMs
  let didTryXmlRpcRootPathFallback = false

  const attempt = (current: RpcTarget, redirectDepth: number): Promise<unknown> => {
    const remainingMs = deadline - Date.now()
    if (remainingMs <= 0) {
      return Promise.reject(new OdooClientError(`Timeout XML-RPC su ${method}`, 408))
    }
    if (redirectDepth > 8) {
      return Promise.reject(
        new OdooClientError(
          'Troppi redirect HTTP verso Odoo (xmlrpc). Imposta ODOO_URL sulla URL finale (es. https o slash finale se richiesto dal server).',
          502,
        ),
      )
    }

    const transport = current.isHttps ? https : http

    return new Promise((resolve, reject) => {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), remainingMs)

      const req = transport.request(
        {
          hostname: current.host,
          port: current.port,
          path: current.path,
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            Accept: 'text/xml',
            'Accept-Encoding': 'identity',
            'Content-Length': String(bodyBuffer.length),
            'User-Agent': 'ideadiluce-pwa-server/1.0',
          },
        },
        (res) => {
          void (async () => {
            clearTimeout(t)
            try {
              const status = res.statusCode ?? 0

              if (REDIRECT_STATUS.has(status)) {
                const rawLoc = res.headers.location
                await readXmlRpcResponseBody(res).catch(() => undefined)
                if (!rawLoc || typeof rawLoc !== 'string') {
                  reject(
                    new OdooClientError(
                      `HTTP ${status} senza Location su ${current.path}. Imposta ODOO_URL sulla URL canonica del gestionale.`,
                      502,
                    ),
                  )
                  return
                }
                const next = locationToRpcTarget(current, rawLoc)
                try {
                  resolve(await attempt(next, redirectDepth + 1))
                } catch (e) {
                  reject(e)
                }
                return
              }

              const buf = await readXmlRpcResponseBody(res)
              const textPreview = buf.toString('utf8', 0, Math.min(400, buf.length))

              if (status === 404) {
                reject(
                  new OdooClientError(
                    `HTTP 404 su ${current.path}. Verifica ODOO_URL (path deploy, es. /odoo). Anteprima: ${textPreview}`,
                    404,
                  ),
                )
                return
              }

              if (status !== 200) {
                if (status === 400 && !didTryXmlRpcRootPathFallback) {
                  const low = textPreview.toLowerCase()
                  const likelyWebCsrf =
                    low.includes('csrf') ||
                    (low.includes('session expired') && low.includes('invalid'))
                  const altPath = rootXmlRpcPathFromNested(current.path)
                  if (likelyWebCsrf && altPath) {
                    didTryXmlRpcRootPathFallback = true
                    try {
                      resolve(await attempt({ ...current, path: altPath }, redirectDepth))
                      return
                    } catch (e2) {
                      reject(e2)
                      return
                    }
                  }
                }
                reject(
                  new OdooClientError(
                    `HTTP ${status} da Odoo su ${current.path}. Anteprima body:\n${textPreview}`,
                    status >= 400 && status < 600 ? status : 502,
                  ),
                )
                return
              }

              if (buf.length === 0) {
                reject(
                  new OdooClientError(
                    `Risposta vuota da ${current.path} (HTTP ${String(status)}). Proxy o URL errato?`,
                    502,
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
                      new OdooClientError(
                        `Invalid XML-RPC message (body non valido come methodResponse). HTTP ${String(status)}, inizio:\n${textPreview}`,
                        502,
                      ),
                    )
                  } else {
                    reject(faultToOdooClientError(err))
                  }
                  return
                }
                syncRpcTargetCachesFromFinalTarget(current)
                resolve(result)
              })
            } catch (e) {
              reject(e instanceof OdooClientError ? e : faultToOdooClientError(e))
            }
          })()
        },
      )

      req.on('error', (e: NodeJS.ErrnoException) => {
        clearTimeout(t)
        const aborted = controller.signal.aborted || e.name === 'AbortError' || e.code === 'ABORT_ERR'
        if (aborted) {
          reject(new OdooClientError(`Timeout XML-RPC su ${method}`, 408))
          return
        }
        reject(faultToOdooClientError(e))
      })

      req.write(bodyBuffer)
      req.end()
    })
  }

  return attempt(target, 0)
}

function methodCallAsync(
  suffix: '/xmlrpc/2/common' | '/xmlrpc/2/object',
  method: string,
  params: unknown[],
  timeoutMs: number,
): Promise<unknown> {
  const target = suffix === '/xmlrpc/2/common' ? getCommonRpcTarget() : getObjectRpcTarget()
  return xmlRpcMethodCall(target, method, params, timeoutMs)
}

function shouldRetryAuthAfterFault(e: unknown): boolean {
  if (!(e instanceof OdooClientError)) return false
  if (e.httpStatus === 401) return true
  return /access denied|session expired|cheating|auth/i.test(e.message)
}

let cachedUid: number | null = null

/** Invalida la sessione XML-RPC in-memory (es. dopo errori di permesso). */
export function invalidateOdooSession(): void {
  cachedUid = null
}

async function rpcAuthenticate(ctx: OdooCallContext): Promise<number> {
  const db = env.ODOO_DB!.trim()
  const login = env.ODOO_USERNAME!.trim()
  const password = env.ODOO_PASSWORD ?? ''
  const operation = 'common/authenticate'
  const startedAt = new Date()
  const reqRedacted = { db, login, password: '[redacted]', extra: {} }

  try {
    const uid = await methodCallAsync(
      '/xmlrpc/2/common',
      'authenticate',
      [db, login, password, {}],
      env.ODOO_TIMEOUT_MS,
    )
    const finishedAt = new Date()
    const okAuth = typeof uid === 'number' && Number.isFinite(uid) && uid > 0

    void writeIntegrationLog({
      service: 'odoo',
      operation,
      correlationId: ctx.correlationId,
      success: okAuth,
      statusCode: okAuth ? 200 : 401,
      requestRedacted: redactForLog(reqRedacted),
      responseRedacted: okAuth ? { uid } : { result: uid },
      startedAt,
      finishedAt,
    })

    logger.info(
      'odoo.xmlrpc',
      { operation, ok: okAuth, durationMs: finishedAt.getTime() - startedAt.getTime() },
      ctx.req,
    )

    if (!okAuth) {
      throw new OdooClientError(
        'Autenticazione Odoo non riuscita (controlla ODOO_DB, utente e password).',
        401,
      )
    }
    return uid
  } catch (e) {
    const finishedAt = new Date()
    const oe = e instanceof OdooClientError ? e : faultToOdooClientError(e)
    void writeIntegrationLog({
      service: 'odoo',
      operation,
      correlationId: ctx.correlationId,
      success: false,
      statusCode: oe.httpStatus,
      requestRedacted: redactForLog(reqRedacted),
      responseRedacted: { message: oe.message, name: oe.odooName },
      startedAt,
      finishedAt,
    })
    logger.error('odoo.xmlrpc.auth_failed', { err: String(oe) }, ctx.req)
    throw oe
  }
}

async function getAuthenticatedUid(ctx: OdooCallContext): Promise<number> {
  if (cachedUid != null) return cachedUid
  const uid = await rpcAuthenticate(ctx)
  cachedUid = uid
  return uid
}

/** `common.version` — non richiede autenticazione. */
export async function odooXmlRpcVersion(ctx: OdooCallContext): Promise<unknown> {
  assertOdooConfigured()
  const operation = 'common/version'
  const startedAt = new Date()
  try {
    const ver = await methodCallAsync('/xmlrpc/2/common', 'version', [], env.ODOO_TIMEOUT_MS)
    const finishedAt = new Date()
    void writeIntegrationLog({
      service: 'odoo',
      operation,
      correlationId: ctx.correlationId,
      success: true,
      requestRedacted: { method: 'version' },
      responseRedacted: redactForLog(ver),
      startedAt,
      finishedAt,
    })
    return ver
  } catch (e) {
    const finishedAt = new Date()
    const oe = e instanceof OdooClientError ? e : faultToOdooClientError(e)
    void writeIntegrationLog({
      service: 'odoo',
      operation,
      correlationId: ctx.correlationId,
      success: false,
      statusCode: oe.httpStatus,
      requestRedacted: { method: 'version' },
      responseRedacted: { message: oe.message },
      startedAt,
      finishedAt,
    })
    throw oe
  }
}

/**
 * Esegue `execute_kw` su `/xmlrpc/2/object` (Odoo 18).
 * @param args Argomenti posizionali ORM (es. domain per `search_read`: `[[["sale_ok","=",true]]]`).
 * @param kwargs Opzioni ORM (`fields`, `limit`, `context`, …).
 */
export async function odooExecuteKw<T>(
  ctx: OdooCallContext,
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  assertOdooConfigured()
  const db = env.ODOO_DB!.trim()
  const password = env.ODOO_PASSWORD ?? ''
  const operation = `${model}/${method}`
  const startedAt = new Date()
  const reqForLog = { model, method, args: redactForLog(args), kwargs: redactForLog(kwargs) }

  const run = (uid: number) =>
    methodCallAsync(
      '/xmlrpc/2/object',
      'execute_kw',
      [db, uid, password, model, method, args, kwargs],
      env.ODOO_TIMEOUT_MS,
    ) as Promise<T>

  const logSuccess = (result: T, finishedAt: Date) => {
    void writeIntegrationLog({
      service: 'odoo',
      operation,
      correlationId: ctx.correlationId,
      success: true,
      requestRedacted: reqForLog as object,
      responseRedacted: redactForLog(result) as object,
      startedAt,
      finishedAt,
    })
    logger.info(
      'odoo.xmlrpc',
      { operation, durationMs: finishedAt.getTime() - startedAt.getTime() },
      ctx.req,
    )
  }

  const logFailure = (e: unknown, finishedAt: Date) => {
    const oe = e instanceof OdooClientError ? e : faultToOdooClientError(e)
    void writeIntegrationLog({
      service: 'odoo',
      operation,
      correlationId: ctx.correlationId,
      success: false,
      statusCode: oe.httpStatus,
      requestRedacted: reqForLog as object,
      responseRedacted: { message: oe.message, name: oe.odooName },
      startedAt,
      finishedAt,
    })
    logger.error('odoo.xmlrpc.failed', { operation, err: String(oe) }, ctx.req)
  }

  try {
    const uid = await getAuthenticatedUid(ctx)
    try {
      const result = await run(uid)
      logSuccess(result, new Date())
      return result
    } catch (first) {
      if (!shouldRetryAuthAfterFault(first)) {
        logFailure(first, new Date())
        throw first instanceof OdooClientError ? first : faultToOdooClientError(first)
      }
      invalidateOdooSession()
      const uid2 = await getAuthenticatedUid(ctx)
      try {
        const result = await run(uid2)
        logSuccess(result, new Date())
        return result
      } catch (second) {
        logFailure(second, new Date())
        throw second instanceof OdooClientError ? second : faultToOdooClientError(second)
      }
    }
  } catch (e) {
    /* Autenticazione: log già scritto in `rpcAuthenticate`. */
    if (e instanceof OdooClientError) throw e
    throw faultToOdooClientError(e)
  }
}

/** GET HTTP opzionale sulla stessa origine Odoo (es. `/doc`) — senza API key JSON-2. */
export async function odooHttpGetSimple(
  ctx: OdooCallContext,
  absolutePath: string,
): Promise<{ ok: boolean; status: number; textSnippet: string | null }> {
  assertOdooConfigured()
  const base = getOdooPublicBaseUrl()
  const path = absolutePath.startsWith('/') ? absolutePath : `/${absolutePath}`
  const url = `${base}${path}`
  const operation = `GET ${path}`
  const startedAt = new Date()
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), env.ODOO_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'ideadiluce-pwa-server/1.0' },
    })
    const finishedAt = new Date()
    const text = await res.text()
    const snippet = text.length > 400 ? `${text.slice(0, 400)}…` : text
    void writeIntegrationLog({
      service: 'odoo',
      operation,
      correlationId: ctx.correlationId,
      success: res.ok,
      statusCode: res.status,
      requestRedacted: { method: 'GET', path },
      responseRedacted: res.ok ? { bytes: text.length } : { status: res.status, snippet },
      startedAt,
      finishedAt,
    })
    return { ok: res.ok, status: res.status, textSnippet: snippet || null }
  } catch (e) {
    const finishedAt = new Date()
    void writeIntegrationLog({
      service: 'odoo',
      operation,
      correlationId: ctx.correlationId,
      success: false,
      requestRedacted: { method: 'GET', path },
      responseRedacted: { error: String(e) },
      startedAt,
      finishedAt,
    })
    return { ok: false, status: 0, textSnippet: null }
  } finally {
    clearTimeout(t)
  }
}

/**
 * Diagnostica per GET /integrations/odoo/ping: versione RPC, autenticazione, lettura minima ORM.
 */
/** Autenticazione credenziali utente portal su `/xmlrpc/2/common` (non usa la cache del service account). */
export async function odooAuthenticatePortalUser(
  ctx: OdooCallContext,
  login: string,
  password: string,
): Promise<number | null> {
  if (!isOdooConfigured()) return null
  const db = env.ODOO_DB!.trim()
  const normalizedLogin = login.toLowerCase().trim()
  const operation = 'common/authenticate_portal'
  const startedAt = new Date()

  try {
    const uid = await methodCallAsync(
      '/xmlrpc/2/common',
      'authenticate',
      [db, normalizedLogin, password, {}],
      env.ODOO_TIMEOUT_MS,
    )
    const okAuth = typeof uid === 'number' && Number.isFinite(uid) && uid > 0
    const finishedAt = new Date()
    void writeIntegrationLog({
      service: 'odoo',
      operation,
      correlationId: ctx.correlationId,
      success: okAuth,
      statusCode: okAuth ? 200 : 401,
      requestRedacted: redactForLog({ db, login: normalizedLogin, password: '[redacted]' }),
      responseRedacted: okAuth ? { uid } : { result: uid },
      startedAt,
      finishedAt,
    })
    return okAuth ? uid : null
  } catch {
    return null
  }
}

/** Autenticazione XML-RPC su `/xmlrpc/2/common` → `uid` (cache in-process quando possibile). */
export async function authenticate(ctx: OdooCallContext): Promise<number> {
  return getAuthenticatedUid(ctx)
}

/** Alias di `odooExecuteKw` per allineamento alla convenzione Odoo (`execute_kw`). */
export const executeKw = odooExecuteKw

export async function odooRunPingDiagnostics(ctx: OdooCallContext): Promise<{
  version: unknown
  uid: number
  smokeSample: unknown
}> {
  invalidateOdooSession()
  const version = await odooXmlRpcVersion(ctx)
  const uid = await rpcAuthenticate(ctx)
  cachedUid = uid
  const smokeSample = await odooExecuteKw(
    ctx,
    'res.lang',
    'search_read',
    [[['active', '=', true]]],
    { fields: ['code'], limit: 1 },
  )
  return { version, uid, smokeSample }
}

/** Il client `xmlrpc` segnala tag sconosciuti quando il body è HTML (404, login, proxy) invece di XML-RPC. */
function isLikelyHtmlInsteadOfXmlRpc(message: string): boolean {
  return /Unknown XML-RPC tag\s+'(TITLE|HTML|HEAD|BODY|!DOCTYPE|META|SCRIPT|LINK|DIV|SPAN)'/i.test(
    message,
  )
}

export function toAppError(e: unknown, correlationId: string): AppError {
  if (e instanceof OdooClientError) {
    const msg = e.message
    const lower = msg.toLowerCase()
    const webCsrfPage =
      lower.includes('csrf') &&
      (lower.includes('<!doctype') || lower.includes('<html') || lower.includes('<h1>'))
    if (webCsrfPage) {
      return new AppError(
        'ODOO_XMLRPC_PATH',
        msg,
        'La POST XML-RPC è stata gestita come pagina web (CSRF), non come endpoint RPC. Usa ODOO_XMLRPC_URL con la base corretta (spesso `https://host` senza `/odoo`) oppure verifica il proxy verso `/xmlrpc/2/*`.',
        e.httpStatus >= 400 && e.httpStatus < 600 ? e.httpStatus : 502,
        false,
        { correlationId, odooName: e.odooName },
      )
    }
    const htmlInsteadOfRpc = isLikelyHtmlInsteadOfXmlRpc(msg)
    const retriable = htmlInsteadOfRpc ? false : e.httpStatus >= 500 || e.httpStatus === 408
    return new AppError(
      htmlInsteadOfRpc ? 'ODOO_XMLRPC_NOT_XML' : 'ODOO_UPSTREAM_ERROR',
      msg,
      htmlInsteadOfRpc
        ? 'La risposta del server non è XML-RPC (spesso pagina HTML). Verifica ODOO_URL: deve essere la base pubblica di Odoo (es. https://dominio/odoo) così che /xmlrpc/2/object sia raggiungibile.'
        : 'Errore temporaneo dal gestionale. Riprova più tardi.',
      e.httpStatus >= 400 && e.httpStatus < 600 ? e.httpStatus : 502,
      retriable,
      { correlationId, odooName: e.odooName },
    )
  }
  return new AppError(
    'ODOO_UNEXPECTED',
    String(e instanceof Error ? e.message : e),
    'Errore durante la comunicazione con il gestionale.',
    502,
    true,
    { correlationId },
  )
}
