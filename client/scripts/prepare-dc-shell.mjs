#!/usr/bin/env node
/**
 * Genera header e footer condivisi per le pagine DC statiche.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

function extractXdcInner(html) {
  const open = html.indexOf('<x-dc>')
  const close = html.lastIndexOf('</x-dc>')
  if (open === -1 || close === -1) throw new Error('Missing <x-dc> wrapper')
  return html.slice(open + '<x-dc>'.length, close)
}

function stripHelmet(inner) {
  return inner.replace(/<helmet>[\s\S]*?<\/helmet>/gi, '').trim()
}

function stripScIf(html) {
  let prev = ''
  let out = html
  while (out !== prev) {
    prev = out
    out = out.replace(/<sc-if\b[^>]*>[\s\S]*?<\/sc-if>/gi, '')
  }
  return out
}

const DOC_ROUTE_MAP = {
  'IdeaDiLuce - Home.dc.html': '/',
  'IdeaDiLuce - Categoria Arredo.dc.html': '/categoria-prodotto/illuminazione-arredo/',
  'IdeaDiLuce - Categoria Tecnica.dc.html': '/categoria-prodotto/illuminazione-tecnica/',
  'IdeaDiLuce - Scegli per ambiente.dc.html': '/ambienti',
  'IdeaDiLuce - Scegli per brand.dc.html': '/brand',
  'IdeaDiLuce - Guide.dc.html': '/guide',
  'IdeaDiLuce - Scegli per attacco.dc.html': '/attacco',
  'IdeaDiLuce - Prodotto non trovato.dc.html': '/prodotto-non-trovato',
  'Professionisti - desktop.dc.html': '/professionisti',
  'IdeaDiLuce - Professionisti.dc.html': '/professionisti',
}

function fixDocLinks(html) {
  let out = html
  for (const [file, route] of Object.entries(DOC_ROUTE_MAP)) {
    out = out.replaceAll(`href="${file}"`, `href="${route}"`)
  }
  out = out.replace(/href="IdeaDiLuce - [^"]+\.dc\.html"/g, 'href="#"')
  out = out.replace(
    '<span>Professionisti</span>',
    '<a href="/professionisti" style="color:inherit;text-decoration:none;">Professionisti</a>',
  )
  out = out.replace(
    '<span>Aiuto</span>',
    '<a href="/guide" style="color:inherit;text-decoration:none;">Aiuto</a>',
  )
  return out
}

function extractFooterFromHome(raw) {
  const inner = stripHelmet(extractXdcInner(raw))
  const start = inner.indexOf('<!-- ============ NEWSLETTER ============ -->')
  if (start === -1) {
    throw new Error('Marker NEWSLETTER non trovato in Home - desktop.dc.html')
  }
  const wrapperClose = inner.lastIndexOf('</div>')
  return inner.slice(start, wrapperClose).trim()
}

function main() {
  const headerPath = path.join(repoRoot, 'docs/IdeaDiLuce Header.dc.html')
  const homePath = path.join(repoRoot, 'docs/Home - desktop.dc.html')
  const outDir = path.join(repoRoot, 'client/src/templates/dc-shell')

  const headerRaw = fs.readFileSync(headerPath, 'utf8')
  let headerHtml = stripHelmet(extractXdcInner(headerRaw))
  headerHtml = stripScIf(headerHtml)
  headerHtml = fixDocLinks(headerHtml)

  const homeRaw = fs.readFileSync(homePath, 'utf8')
  const footerHtml = extractFooterFromHome(homeRaw)

  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(
    path.join(outDir, 'header.partial.html'),
    `<!-- Generated from IdeaDiLuce Header.dc.html — npm run prepare:dc-shell -->\n${headerHtml.trim()}\n`,
    'utf8',
  )
  fs.writeFileSync(
    path.join(outDir, 'footer.partial.html'),
    `<!-- Generated from Home - desktop.dc.html (newsletter + trust + footer) — npm run prepare:dc-shell -->\n${footerHtml}\n`,
    'utf8',
  )

  console.log(`Wrote ${outDir}/header.partial.html`)
  console.log(`Wrote ${outDir}/footer.partial.html`)
}

main()
