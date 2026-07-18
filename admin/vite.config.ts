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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react'
          if (id.includes('@radix-ui') || id.includes('@base-ui')) return 'vendor-ui'
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('valtio')) return 'vendor-state'
        },
      },
    },
  },
  server: {
    port: 5274,
    proxy: {
      '/api': { target: process.env.VITE_API_URL ?? 'http://localhost:4100', changeOrigin: true },
    },
  },
})
