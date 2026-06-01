/**
 * Esegue Prisma CLI con env Hub caricato da /.env (root).
 * Uso: tsx scripts/prisma-cli.ts migrate deploy
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { requireHubDatabaseUrl } from './load-hub-env.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const apiRoot = join(__dirname, '..')

requireHubDatabaseUrl()

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Uso: tsx scripts/prisma-cli.ts <comando prisma> [argomenti...]')
  process.exit(1)
}

const result = spawnSync('prisma', args, {
  cwd: apiRoot,
  env: process.env,
  stdio: 'inherit',
})

process.exit(result.status === null ? 1 : result.status)
