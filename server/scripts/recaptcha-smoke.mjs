#!/usr/bin/env node
/**
 * Smoke test reCAPTCHA su login/registrazione (richiede server avviato).
 * Uso: node server/scripts/recaptcha-smoke.mjs
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
config({ path: path.join(repoRoot, '.env') })

const base = (process.env.API_BASE ?? 'http://localhost:4000').replace(/\/$/, '')
const recaptchaEnabled =
  String(process.env.RECAPTCHA_ENABLED ?? '').toLowerCase() === 'true' &&
  Boolean(process.env.RECAPTCHA_SECRET_KEY?.trim())
const demoEmail = process.env.API_TEST_EMAIL ?? 'demo@example.com'
const demoPassword = process.env.API_TEST_PASSWORD ?? 'password123'

const jar = new Map()

function parseSetCookie(headers) {
  for (const c of headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';')
    const [k, v] = pair.split('=')
    if (k && v) jar.set(k.trim(), v.trim())
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function req(method, path, body) {
  const headers = { Accept: 'application/json' }
  if (cookieHeader()) headers.Cookie = cookieHeader()
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  parseSetCookie(res.headers)
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { _raw: text.slice(0, 300) }
  }
  return { status: res.status, json }
}

const results = []

async function check(name, fn) {
  try {
    const detail = await fn()
    const ok = detail === true || detail?.ok === true
    results.push({ name, ok })
    console.log(ok ? 'OK' : 'FAIL', name, detail?.note ?? '')
    if (!ok && detail?.note) console.error(' ', detail.note)
  } catch (e) {
    results.push({ name, ok: false })
    console.log('FAIL', name, e.message)
  }
}

console.log(`API: ${base}`)
console.log(`RECAPTCHA_ENABLED: ${recaptchaEnabled}`)
if (
  recaptchaEnabled &&
  process.env.RECAPTCHA_SECRET_KEY?.trim() === process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim()
) {
  console.warn(
    'WARN: RECAPTCHA_SECRET_KEY e NEXT_PUBLIC_RECAPTCHA_SITE_KEY sono identici — su Google sono due chiavi diverse.',
  )
}

await check('health', async () => (await req('GET', '/health')).status === 200)

if (!recaptchaEnabled) {
  console.log('\nSKIP test reCAPTCHA: RECAPTCHA_ENABLED=false o secret assente')
} else {
  await check('login senza token → 400 RECAPTCHA_REQUIRED', async () => {
    const r = await req('POST', '/api/v1/auth/login', { email: demoEmail, password: demoPassword })
    const code = r.json?.error?.code
    return {
      ok: r.status === 400 && code === 'RECAPTCHA_REQUIRED',
      note: `status=${r.status} code=${code ?? r.json?._raw ?? 'n/a'}`,
    }
  })

  await check('register senza token → 400 RECAPTCHA_REQUIRED', async () => {
    const r = await req('POST', '/api/v1/auth/register', {
      email: `recaptcha-smoke-${Date.now()}@example.com`,
      password: 'password12345',
    })
    const code = r.json?.error?.code
    return {
      ok: r.status === 400 && code === 'RECAPTCHA_REQUIRED',
      note: `status=${r.status} code=${code ?? 'n/a'}`,
    }
  })

  await check('checkout-register senza token → 400 RECAPTCHA_REQUIRED', async () => {
    const r = await req('POST', '/api/v1/auth/checkout-register', {
      email: `recaptcha-smoke-${Date.now()}@example.com`,
      password: 'password12345',
      firstName: 'Test',
      lastName: 'Recaptcha',
    })
    const code = r.json?.error?.code
    return {
      ok: r.status === 400 && code === 'RECAPTCHA_REQUIRED',
      note: `status=${r.status} code=${code ?? 'n/a'}`,
    }
  })

  await check('admin login senza token → 400 RECAPTCHA_REQUIRED', async () => {
    const r = await req('POST', '/api/v1/admin/auth/login', {
      email: process.env.ADMIN_SEED_EMAIL ?? 'admin@ideadiluce.local',
      password: process.env.ADMIN_SEED_PASSWORD ?? 'admin123456',
    })
    const code = r.json?.error?.code
    return {
      ok: r.status === 400 && code === 'RECAPTCHA_REQUIRED',
      note: `status=${r.status} code=${code ?? 'n/a'}`,
    }
  })

  await check('login con token falso → 400 RECAPTCHA_FAILED', async () => {
    const r = await req('POST', '/api/v1/auth/login', {
      email: demoEmail,
      password: demoPassword,
      recaptchaToken: 'invalid-token-smoke-test',
    })
    const code = r.json?.error?.code
    return {
      ok: r.status === 400 && code === 'RECAPTCHA_FAILED',
      note: `status=${r.status} code=${code ?? 'n/a'}`,
    }
  })
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passati`)
process.exit(failed.length ? 1 : 0)
