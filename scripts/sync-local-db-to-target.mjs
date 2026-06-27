#!/usr/bin/env node
/**
 * Copia i dati dal Postgres locale (docker compose) verso DATABASE_URL in /.env.
 * Schema: public (esclude _prisma_migrations). Eseguire dopo db:deploy + hub:migrate sul target.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadMonorepoEnv } from './load-monorepo-env.mjs'

loadMonorepoEnv()

const targetUrlRaw = process.env.DATABASE_URL?.trim()
if (!targetUrlRaw) {
  console.error('DATABASE_URL mancante in /.env')
  process.exit(1)
}

const target = new URL(targetUrlRaw)
const dumpPath = join(tmpdir(), `ideadiluce-local-public-${Date.now()}.dump`)
const containerDump = '/tmp/ideadiluce_local_public.dump'

function run(label, cmd, args, opts = {}) {
  console.log(`\n→ ${label}`)
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts })
  if ((result.status ?? 1) !== 0) {
    console.error(`✗ ${label} fallito (exit ${result.status ?? 1})`)
    process.exit(result.status ?? 1)
  }
}

run('Dump dati locali (schema public)', 'docker', [
  'exec',
  'ideadiluce-postgres',
  'pg_dump',
  '-U',
  'ideadiluce',
  '-d',
  'ideadiluce',
  '--schema=public',
  '--data-only',
  '--no-owner',
  '--no-acl',
  '--exclude-table=public._prisma_migrations',
  '-Fc',
  '-f',
  containerDump,
])

run('Copia dump dal container', 'docker', ['cp', `ideadiluce-postgres:${containerDump}`, dumpPath])

const pgRestoreArgs = [
  'run',
  '--rm',
  '-v',
  `${dumpPath}:/dump.dump:ro`,
  '-e',
  `PGPASSWORD=${target.password}`,
  '-e',
  'PGSSLMODE=require',
  'postgres:16-alpine',
  'pg_restore',
  '-h',
  target.hostname,
  '-p',
  target.port || '5432',
  '-U',
  target.username,
  '-d',
  target.pathname.slice(1),
  '--data-only',
  '--no-owner',
  '--no-acl',
  '--single-transaction',
  '/dump.dump',
]

run(`Restore su ${target.hostname}/${target.pathname.slice(1)}`, 'docker', pgRestoreArgs)

try {
  unlinkSync(dumpPath)
} catch {
  /* ignore */
}

console.log('\n✔ Dati public copiati dal DB locale a staging (senza _prisma_migrations).')
