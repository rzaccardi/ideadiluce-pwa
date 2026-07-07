#!/usr/bin/env node
/**
 * Evita crash "ENOENT pages-manifest.json" (e manifest simili) quando .next è stale
 * (build interrotta, cache dev mista a prod, switch branch).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextDir = path.join(clientRoot, '.next')
const serverDir = path.join(nextDir, 'server')

const REQUIRED_SERVER_MANIFESTS = ['pages-manifest.json', 'app-paths-manifest.json']

function hasDevWebpackCache() {
  return fs.existsSync(path.join(nextDir, 'cache/webpack/client-development'))
}

function hasIncompleteServerManifests() {
  if (!fs.existsSync(serverDir)) return false
  return REQUIRED_SERVER_MANIFESTS.some(
    (file) => !fs.existsSync(path.join(serverDir, file)),
  )
}

function shouldCleanBeforeBuild() {
  if (!fs.existsSync(nextDir)) return false
  if (hasDevWebpackCache()) return true
  if (hasIncompleteServerManifests()) return true
  return false
}

if (shouldCleanBeforeBuild()) {
  console.warn('[client] .next incompleto o misto dev/prod — pulizia automatica prima della build…')
  fs.rmSync(nextDir, { recursive: true, force: true })
}
