/**
 * Carica /.env dalla root del monorepo.
 * Uso: node --import ./scripts/load-monorepo-env.mjs …
 *      node server/scripts/with-root-env.mjs migrate dev
 */
import { config } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(scriptsDir, '..')
export const serverRoot = path.join(repoRoot, 'server')

export function loadMonorepoEnv() {
  const rootEnv = path.join(repoRoot, '.env')
  const rootExample = path.join(repoRoot, '.env.example')

  if (fs.existsSync(rootEnv)) {
    config({ path: rootEnv })
  }

  const nodeEnv = process.env.NODE_ENV ?? 'development'
  if (!process.env.DATABASE_URL?.trim() && nodeEnv !== 'production' && fs.existsSync(rootExample)) {
    config({ path: rootExample })
  }
}

loadMonorepoEnv()
