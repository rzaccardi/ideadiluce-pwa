#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ensurePostgresForDev } from '../../scripts/ensure-postgres-dev.mjs'

const serverRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(serverRoot, '..')

await ensurePostgresForDev()

const freePort = spawn('node', [join(repoRoot, 'scripts/free-port.mjs'), '4100'], {
  cwd: serverRoot,
  stdio: 'inherit',
  env: process.env,
})

freePort.on('exit', (code) => {
  if (code !== 0) process.exit(code ?? 1)
})

const server = spawn('npx', ['tsx', 'watch', 'src/server.ts'], {
  cwd: serverRoot,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
})

server.on('exit', (code) => process.exit(code ?? 0))

process.on('SIGINT', () => {
  server.kill('SIGINT')
})
process.on('SIGTERM', () => {
  server.kill('SIGTERM')
})
