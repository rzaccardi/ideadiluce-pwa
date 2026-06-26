#!/usr/bin/env node
/**
 * Estrae il template x-dc da un export bundler (docs/IdeaDiLuce - *.html)
 * e scrive docs/IdeaDiLuce - {Nome}.dc.html con helmet Google Fonts + support.js.
 *
 * Usage: node scripts/unpack-bundled-dc.mjs "docs/IdeaDiLuce - Professionisti.html"
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

function extractBundledTemplate(html) {
  const m = html.match(/<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/)
  if (!m) throw new Error('Missing __bundler/template block')
  return JSON.parse(m[1].trim())
}

function extractHelmetFromDc(html) {
  const m = html.match(/<helmet>([\s\S]*?)<\/helmet>/i)
  return m ? m[1].trim() : ''
}

function normalizeDcDoc(decoded, helmetFromDesktop) {
  const innerOpen = decoded.indexOf('<x-dc>')
  const innerClose = decoded.lastIndexOf('</x-dc>')
  if (innerOpen === -1 || innerClose === -1) throw new Error('Missing <x-dc> in unpacked template')

  let body = decoded.slice(innerOpen, innerClose + '</x-dc>'.length)
  if (helmetFromDesktop) {
    body = body.replace(/<helmet>[\s\S]*?<\/helmet>/i, `<helmet>\n${helmetFromDesktop}\n</helmet>`)
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
${body}
</body>
</html>
`
}

function resolveDesktopFallback(bundledName) {
  const map = {
    'IdeaDiLuce - Professionisti.html': 'Professionisti - desktop.dc.html',
    'IdeaDiLuce - Account.html': null,
    'IdeaDiLuce - Thank You.html': null,
    'IdeaDiLuce - Errore Acquisto.html': null,
  }
  const desktop = map[path.basename(bundledName)]
  if (!desktop) return ''
  const desktopPath = path.join(repoRoot, 'docs', desktop)
  if (!fs.existsSync(desktopPath)) return ''
  return extractHelmetFromDc(fs.readFileSync(desktopPath, 'utf8'))
}

function main() {
  const [sourceRel] = process.argv.slice(2)
  if (!sourceRel) {
    console.error('Usage: node unpack-bundled-dc.mjs <bundled-html>')
    process.exit(1)
  }

  const source = path.resolve(repoRoot, sourceRel)
  const base = path.basename(source, '.html')
  const output = path.join(repoRoot, 'docs', `${base}.dc.html`)

  const raw = fs.readFileSync(source, 'utf8')
  const decoded = extractBundledTemplate(raw)
  const helmet = resolveDesktopFallback(source)
  const doc = normalizeDcDoc(decoded, helmet)

  fs.writeFileSync(output, doc, 'utf8')
  console.log(`Wrote ${output} (${doc.length} bytes)`)
}

main()
