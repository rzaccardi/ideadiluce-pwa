import { config } from 'dotenv'
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
config({ path: join(root, '.env') })

const port = process.argv[2] ?? process.env.PORT
if (!port) {
  console.error('Usage: node scripts/free-port.mjs <port>')
  process.exit(1)
}

try {
  const out = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim()
  if (!out) process.exit(0)
  const pids = out.split(/\n/).filter(Boolean)
  for (const pid of pids) {
    try {
      execSync(`kill -9 ${pid}`)
    } catch {
      /* processo già terminato */
    }
  }
} catch {
  /* lsof termina con errore se nessuno usa la porta */
}
