import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { viteLoadMonorepoEnv } from '../scripts/vite-load-env.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
viteLoadMonorepoEnv(repoRoot)

export default defineConfig({
  envDir: repoRoot,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
      '@runplay/shared': path.resolve(repoRoot, '../runplay/packages/shared/src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': { target: process.env.VITE_API_URL ?? 'http://localhost:4000', changeOrigin: true },
    },
  },
})
