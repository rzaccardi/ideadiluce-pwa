#!/usr/bin/env node
/**
 * Verifica configurazione Stripe locale e stampa webhook secret per sviluppo.
 * Uso: node server/scripts/stripe-setup.mjs
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
config({ path: path.join(repoRoot, '.env') })

const sk = process.env.STRIPE_SECRET_KEY?.trim()
const pk =
  process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
  process.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim()
const enabled = String(process.env.STRIPE_ENABLED ?? '').toLowerCase() === 'true'
const webhook = process.env.STRIPE_WEBHOOK_SECRET?.trim()

console.log('Stripe setup — Idea di Luce PWA\n')

if (!enabled) {
  console.log('✗ STRIPE_ENABLED=false — imposta STRIPE_ENABLED=true nel .env root')
} else {
  console.log('✓ STRIPE_ENABLED=true')
}

if (!sk) {
  console.log('✗ STRIPE_SECRET_KEY mancante')
} else {
  const res = await fetch('https://api.stripe.com/v1/account', {
    headers: { Authorization: `Bearer ${sk}` },
  })
  if (res.ok) {
    const acct = await res.json()
    console.log(`✓ STRIPE_SECRET_KEY valida (account: ${acct.id}, ${acct.business_profile?.name ?? '—'})`)
    if (!pk) {
      console.log(
        `\n⚠ Chiave pubblica mancante. Copia pk_test_… da:\n  https://dashboard.stripe.com/${acct.id}/test/apikeys\n` +
          'e imposta STRIPE_PUBLISHABLE_KEY e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY nel .env root.',
      )
    }
  } else {
    console.log('✗ STRIPE_SECRET_KEY non valida o scaduta')
  }
}

if (pk) {
  console.log(`✓ Publishable key configurata (${pk.slice(0, 12)}…)`)
}

if (webhook) {
  console.log(`✓ STRIPE_WEBHOOK_SECRET configurato (${webhook.slice(0, 10)}…)`)
} else if (sk) {
  console.log('\nWebhook secret locale (stripe listen):')
  const listen = spawnSync(
    'stripe',
    ['listen', '--print-secret', '--api-key', sk],
    { encoding: 'utf8' },
  )
  const secret = listen.stdout?.trim()
  if (secret?.startsWith('whsec_')) {
    console.log(`  ${secret}`)
    console.log('\nAggiungi al .env root:')
    console.log(`STRIPE_WEBHOOK_SECRET=${secret}`)
    console.log('\nAvvia il forward webhook in un altro terminale:')
    console.log(
      `  stripe listen --forward-to localhost:4000/api/v1/payments/webhook/stripe --api-key ${sk.slice(0, 20)}…`,
    )
  } else {
    console.log('  (stripe CLI non disponibile o errore — installa stripe CLI)')
  }
}

const bankOk =
  process.env.BANK_TRANSFER_HOLDER?.trim() &&
  process.env.BANK_TRANSFER_IBAN?.trim()
if (bankOk) {
  console.log('\n✓ Bonifico configurato (BANK_TRANSFER_HOLDER + IBAN)')
} else {
  console.log('\n⚠ Bonifico: imposta BANK_TRANSFER_HOLDER e BANK_TRANSFER_IBAN nel .env')
}

if (!enabled || !sk || !pk) {
  process.exitCode = 1
}
