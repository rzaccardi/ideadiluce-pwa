import { config } from 'dotenv'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
config({ path: join(root, '.env') })

const port = process.env.PORT ?? '4000'

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
