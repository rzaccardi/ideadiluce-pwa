import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { viteLoadMonorepoEnv } from '../scripts/vite-load-env.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
viteLoadMonorepoEnv(repoRoot)

export default defineConfig({
  envDir: repoRoot,
  plugins: [react()],
  server: { port: 5174 },
})
