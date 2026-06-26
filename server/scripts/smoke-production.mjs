#!/usr/bin/env node
/**
 * Smoke test API (health, catalogo, auth forgot-password).
 * Uso: API_BASE=https://api.example.com node server/scripts/smoke-production.mjs
 */
const base = (process.env.API_BASE ?? 'http://localhost:4000').replace(/\/$/, '')

async function get(path) {
  const res = await fetch(`${base}${path}`)
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text
  }
  return { status: res.status, json }
}

async function main() {
  const checks = []

  const health = await get('/health')
  checks.push(['health', health.status === 200])

  const catalog = await get('/api/v2/products?lang=it&per_page=1')
  checks.push(['catalog', catalog.status === 200 && catalog.json?.data?.items?.length > 0])

  const forgot = await fetch(`${base}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'smoke-test@example.com' }),
  })
  checks.push(['forgot-password', forgot.status === 200])

  for (const [name, ok] of checks) {
    console.log(ok ? 'OK' : 'FAIL', name)
  }

  if (checks.some(([, ok]) => !ok)) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
