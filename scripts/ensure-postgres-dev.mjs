#!/usr/bin/env node
/**
 * Avvia Postgres in Docker se necessario, oppure continua se il DB è già raggiungibile.
 * In sviluppo, se DATABASE_URL remoto non risponde, usa il Postgres locale da .env.example.
 */
import { parse } from 'dotenv'
import { execSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import net from 'node:net'
import { join } from 'node:path'
import { fillDatabaseUrlFromExample, loadMonorepoEnv, repoRoot } from './load-monorepo-env.mjs'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

function parseDbTarget(databaseUrl) {
  const parsed = new URL(databaseUrl)
  return {
    host: parsed.hostname || 'localhost',
    port: parsed.port ? Number(parsed.port) : 5432,
    isLocal: LOCAL_HOSTS.has(parsed.hostname || 'localhost'),
  }
}

function readLocalDatabaseUrls() {
  const examplePath = join(repoRoot, '.env.example')
  const fromExample = parse(readFileSync(examplePath, 'utf8'))
  const databaseUrl = fromExample.DATABASE_URL?.trim()
  const directUrl = fromExample.DIRECT_URL?.trim() || databaseUrl
  if (!databaseUrl) {
    throw new Error('DATABASE_URL locale mancante in .env.example')
  }
  return { databaseUrl, directUrl }
}

function canConnect(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port })
    const done = (ok) => {
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

function dockerAvailable() {
  const result = spawnSync('docker', ['info'], { stdio: 'ignore' })
  return result.status === 0
}

function startDockerCompose() {
  console.log('[postgres] Avvio container Postgres (docker compose)…')
  execSync('docker compose -f docker-compose.yml up -d --wait', {
    cwd: repoRoot,
    stdio: 'inherit',
  })
}

async function ensureLocalPostgres(databaseUrl) {
  const { host, port } = parseDbTarget(databaseUrl)

  if (await canConnect(host, port)) {
    console.log(`[postgres] Già raggiungibile su ${host}:${port}`)
    return
  }

  if (!dockerAvailable()) {
    console.error(
      [
        '[postgres] Postgres locale non raggiungibile e Docker non è in esecuzione.',
        '',
        '  1. Avvia Docker Desktop, poi rilancia: npm run dev',
        '  2. Oppure avvia solo il DB: npm run db:up',
        '',
        `     Atteso in locale: ${host}:${port}`,
      ].join('\n'),
    )
    process.exit(1)
  }

  try {
    startDockerCompose()
  } catch {
    console.error('[postgres] Impossibile avviare Postgres con docker compose.')
    process.exit(1)
  }

  if (!(await canConnect(host, port, 5000))) {
    console.error(`[postgres] Container avviato ma ${host}:${port} non risponde.`)
    process.exit(1)
  }

  console.log(`[postgres] Pronto su ${host}:${port}`)
}

/**
 * Risolve DATABASE_URL per `npm run dev` e garantisce che Postgres risponda.
 * Può sovrascrivere process.env.DATABASE_URL / DIRECT_URL con il DB locale.
 */
export async function ensurePostgresForDev() {
  loadMonorepoEnv()

  const nodeEnv = process.env.NODE_ENV ?? 'development'
  if (nodeEnv === 'production') {
    if (!process.env.DATABASE_URL?.trim()) {
      console.error('[postgres] DATABASE_URL mancante in produzione.')
      process.exit(1)
    }
    return
  }

  fillDatabaseUrlFromExample()

  let databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    console.error(
      '[postgres] DATABASE_URL mancante. Copia .env.example in .env oppure imposta DATABASE_URL.',
    )
    process.exit(1)
  }

  const target = parseDbTarget(databaseUrl)

  if (!target.isLocal) {
    const reachable = await canConnect(target.host, target.port, 2500)
    if (!reachable) {
      const local = readLocalDatabaseUrls()
      console.warn(
        `[postgres] DATABASE_URL remoto (${target.host}:${target.port}) non raggiungibile; uso Postgres locale.`,
      )
      process.env.DATABASE_URL = local.databaseUrl
      process.env.DIRECT_URL = local.directUrl
      databaseUrl = local.databaseUrl
    } else {
      console.log(`[postgres] Connessione remota raggiungibile (${target.host}:${target.port})`)
      return
    }
  }

  await ensureLocalPostgres(databaseUrl)
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
if (isMain || process.argv[1]?.endsWith('ensure-postgres-dev.mjs')) {
  await ensurePostgresForDev()
}
