import 'server-only'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const templatesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates')

export type DcStaticHtmlDocument = {
  headLinks: string[]
  stylesCss: string
  bodyHtml: string
}

function extractBetween(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(pattern)].map((match) => match[0])
}

export function loadDcStaticHtml(templateFile: string): DcStaticHtmlDocument {
  const candidates = [
    path.join(templatesDir, templateFile),
    path.join(process.cwd(), 'src/templates', templateFile),
    path.join(process.cwd(), 'client/src/templates', templateFile),
  ]
  const fullPath = candidates.find((candidate) => fs.existsSync(candidate))
  if (!fullPath) {
    throw new Error(`Template DC non trovato: ${templateFile}`)
  }
  const raw = fs.readFileSync(fullPath, 'utf8').replace(/^<!--[\s\S]*?-->\n?/, '')

  const headLinks = extractBetween(raw, /<link\b[^>]*>/gi)
  const stylesBlock = raw.match(/<style>[\s\S]*?<\/style>/i)?.[0] ?? ''
  const stylesCss = stylesBlock.match(/<style>([\s\S]*?)<\/style>/i)?.[1]?.trim() ?? ''
  const bodyHtml = raw
    .replace(/<link\b[^>]*>\n?/gi, '')
    .replace(/<style>[\s\S]*?<\/style>\n?/i, '')
    .trim()

  return { headLinks, stylesCss, bodyHtml }
}
