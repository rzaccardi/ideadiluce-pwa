#!/usr/bin/env node
/** Esegue Prisma (o altri comandi) con le variabili caricate da /.env */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { loadMonorepoEnv, serverRoot } from '../../scripts/load-monorepo-env.mjs'

loadMonorepoEnv()

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Uso: node scripts/with-root-env.mjs <comando prisma> [arg…]')
  process.exit(1)
}

const result = spawnSync('npx', ['prisma', ...args], {
  cwd: serverRoot,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
