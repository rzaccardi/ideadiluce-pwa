/**
 * Carica /.env dalla root del monorepo.
 * Uso: node --import ./scripts/load-monorepo-env.mjs …
 *      node server/scripts/with-root-env.mjs migrate dev
 */
import { config, parse } from 'dotenv'
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(scriptsDir, '..')
export const serverRoot = path.join(repoRoot, 'server')

/** dotenv non sovrascrive chiavi già presenti (anche se vuote, es. secret DO senza valore). */
export function fillDatabaseUrlFromExample() {
  if (process.env.DATABASE_URL?.trim()) return

  const rootExample = path.join(repoRoot, '.env.example')
  if (!fs.existsSync(rootExample)) return

  try {
    const fromExample = parse(readFileSync(rootExample, 'utf8')).DATABASE_URL?.trim()
    if (fromExample) process.env.DATABASE_URL = fromExample
  } catch {
    /* .env.example assente o illeggibile */
  }
}

export function loadMonorepoEnv() {
  const rootEnv = path.join(repoRoot, '.env')
  const rootExample = path.join(repoRoot, '.env.example')

  if (fs.existsSync(rootEnv)) {
    config({ path: rootEnv })
  }

  const nodeEnv = process.env.NODE_ENV ?? 'development'
  if (!process.env.DATABASE_URL?.trim() && nodeEnv !== 'production' && fs.existsSync(rootExample)) {
    config({ path: rootExample })
    fillDatabaseUrlFromExample()
  }
}

loadMonorepoEnv()
