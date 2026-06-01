import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hubDatabaseUrl } from '../src/hub-database-url.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')

/** Carica /.env (root monorepo) e imposta HUB_DATABASE_URL da DATABASE_URL se assente. */
export function loadHubEnv(): void {
  const rootEnv = join(repoRoot, '.env')
  if (existsSync(rootEnv)) {
    config({ path: rootEnv })
  }
  const localEnv = join(repoRoot, 'product-hub/api/.env')
  if (existsSync(localEnv)) {
    config({ path: localEnv, override: false })
  }
  if (!process.env.HUB_DATABASE_URL?.trim() && process.env.DATABASE_URL?.trim()) {
    process.env.HUB_DATABASE_URL = hubDatabaseUrl(process.env.DATABASE_URL.trim())
  }
}

export function requireHubDatabaseUrl(): string {
  loadHubEnv()
  const url = process.env.HUB_DATABASE_URL?.trim()
  if (!url) {
    console.error(
      'HUB_DATABASE_URL mancante. Imposta DATABASE_URL o HUB_DATABASE_URL in /.env (root monorepo).',
    )
    process.exit(1)
  }
  return url
}
