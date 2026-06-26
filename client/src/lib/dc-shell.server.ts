import 'server-only'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolveDcHeaderVars, type DcHeaderActive } from '@/lib/dc-shell-header'

const shellDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'dc-shell')

function readShellPartial(name: string): string {
  const candidates = [
    path.join(shellDir, name),
    path.join(process.cwd(), 'src/templates/dc-shell', name),
    path.join(process.cwd(), 'client/src/templates/dc-shell', name),
  ]
  const fullPath = candidates.find((candidate) => fs.existsSync(candidate))
  if (!fullPath) {
    throw new Error(`Partial DC shell non trovato: ${name}`)
  }
  return fs.readFileSync(fullPath, 'utf8').trim()
}

export function loadDcStaticHeaderHtml(active: DcHeaderActive = 'none'): string {
  const raw = readShellPartial('header.partial.html')
  return resolveDcHeaderVars(raw, active)
}

export function loadDcStaticFooterHtml(): string {
  return readShellPartial('footer.partial.html')
}

export type DcStaticShell = {
  headerHtml: string
  footerHtml: string
}

export function loadDcStaticShell(active: DcHeaderActive = 'none'): DcStaticShell {
  return {
    headerHtml: loadDcStaticHeaderHtml(active),
    footerHtml: loadDcStaticFooterHtml(),
  }
}

export type { DcHeaderActive }
