/**
 * Esegue Prisma CLI con env Hub caricato da /.env (root).
 * Uso: tsx scripts/prisma-cli.ts migrate deploy
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hubDatabaseUrl } from '../src/hub-database-url.js'
import { loadHubEnv } from './load-hub-env.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const apiRoot = join(__dirname, '..')

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Uso: tsx scripts/prisma-cli.ts <comando prisma> [argomenti...]')
  process.exit(1)
}

/** generate non contatta il DB; basta un URL placeholder se env assente (es. build shop/admin). */
function ensureHubDatabaseUrlForCli(): void {
  loadHubEnv()
  if (process.env.HUB_DATABASE_URL?.trim()) return
  if (process.env.DATABASE_URL?.trim()) {
    process.env.HUB_DATABASE_URL = hubDatabaseUrl(process.env.DATABASE_URL.trim())
    return
  }
  if (args[0] === 'generate') {
    process.env.HUB_DATABASE_URL =
      'postgresql://build:build@127.0.0.1:5432/build?schema=hub'
    return
  }
  console.error(
    'HUB_DATABASE_URL mancante. Imposta DATABASE_URL o HUB_DATABASE_URL in /.env (root monorepo).',
  )
  process.exit(1)
}

ensureHubDatabaseUrlForCli()

const result = spawnSync('prisma', args, {
  cwd: apiRoot,
  env: process.env,
  stdio: 'inherit',
})

process.exit(result.status === null ? 1 : result.status)
