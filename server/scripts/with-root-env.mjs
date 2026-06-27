#!/usr/bin/env node
/** Esegue Prisma (o altri comandi) con le variabili caricate da /.env */
import { spawnSync } from 'node:child_process'
import { fillDatabaseUrlFromExample, loadMonorepoEnv, serverRoot } from '../../scripts/load-monorepo-env.mjs'

loadMonorepoEnv()

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Uso: node scripts/with-root-env.mjs <comando prisma> [arg…]')
  process.exit(1)
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
if (nodeEnv !== 'production') {
  fillDatabaseUrlFromExample()
}

/** generate non contatta il DB; basta un URL placeholder se env assente (es. build con secret vuoto). */
if (!process.env.DATABASE_URL?.trim() && args[0] === 'generate') {
  process.env.DATABASE_URL =
    'postgresql://build:build@127.0.0.1:5432/build?schema=public'
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    'DATABASE_URL mancante. Imposta la connection string in App Platform (api → Environment → DATABASE_URL).',
  )
  process.exit(1)
}

const result = spawnSync('npx', ['prisma', ...args], {
  cwd: serverRoot,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
