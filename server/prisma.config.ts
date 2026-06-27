/**
 * Carica DATABASE_URL da /.env del monorepo così `npx prisma …` funziona da server/
 * senza dover esportare manualmente le variabili.
 */
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config, parse } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

const serverRoot = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(serverRoot, '..')
const rootEnv = path.join(repoRoot, '.env')
const rootExample = path.join(repoRoot, '.env.example')

if (fs.existsSync(rootEnv)) {
  config({ path: rootEnv })
}
if (!process.env.DATABASE_URL?.trim() && fs.existsSync(rootExample)) {
  config({ path: rootExample })
  /** dotenv non sovrascrive variabili già presenti (anche vuote, es. secret DO senza valore). */
  if (!process.env.DATABASE_URL?.trim()) {
    try {
      const fromExample = parse(readFileSync(rootExample, 'utf8')).DATABASE_URL?.trim()
      if (fromExample) process.env.DATABASE_URL = fromExample
    } catch {
      /* .env.example assente */
    }
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
