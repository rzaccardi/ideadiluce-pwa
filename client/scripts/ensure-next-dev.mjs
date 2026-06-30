#!/usr/bin/env node
/**
 * Evita crash "ENOENT prerender-manifest.json" quando .next è stale
 * (build prod interrotta, HMR corrotto, switch branch).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextDir = path.join(clientRoot, '.next')

const REQUIRED_DEV_FILES = ['prerender-manifest.json', 'routes-manifest.json']

function hasStaleProductionCache() {
  return (
    fs.existsSync(path.join(nextDir, 'cache/webpack/server-production')) &&
    !fs.existsSync(path.join(nextDir, 'cache/webpack/client-development'))
  )
}

function isBrokenNextDir() {
  if (!fs.existsSync(nextDir)) return false
  for (const file of REQUIRED_DEV_FILES) {
    if (!fs.existsSync(path.join(nextDir, file))) return true
  }
  return hasStaleProductionCache()
}

if (isBrokenNextDir()) {
  console.warn('[client] .next incompleto o misto prod/dev — pulizia automatica…')
  fs.rmSync(nextDir, { recursive: true, force: true })
}
