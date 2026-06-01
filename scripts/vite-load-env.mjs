/** Carica /.env dalla root prima che Vite legga envDir. */
import { config } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

export function viteLoadMonorepoEnv(repoRoot) {
  const file = path.join(repoRoot, '.env')
  if (fs.existsSync(file)) config({ path: file })
}
