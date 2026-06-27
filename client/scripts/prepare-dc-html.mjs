#!/usr/bin/env node
/**
 * Prepara un template .dc.html per il rendering statico nel client Next.js.
 * Usage: node scripts/prepare-dc-html.mjs <source> <output> [--content-only]
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

function fixAssetPaths(html) {
  return html.replace(/src="images\//g, 'src="/site/images/')
}

function fixDocLinks(html) {
  const DOC_ROUTE_MAP = {
    'IdeaDiLuce - Home.dc.html': '/',
    'IdeaDiLuce - Catalogo.dc.html': '/catalog',
    'IdeaDiLuce - Categoria Arredo.dc.html': '/categoria-prodotto/illuminazione-arredo/',
    'IdeaDiLuce - Categoria Tecnica.dc.html': '/categoria-prodotto/illuminazione-tecnica/',
    'IdeaDiLuce - Scegli per ambiente.dc.html': '/ambienti',
    'IdeaDiLuce - Scegli per brand.dc.html': '/brand',
    'IdeaDiLuce - Guide.dc.html': '/guide',
    'IdeaDiLuce - Scegli per attacco.dc.html': '/attacco',
    'IdeaDiLuce - Prodotto non trovato.dc.html': '/prodotto-non-trovato',
    'IdeaDiLuce - Professionisti.dc.html': '/professionisti',
    'Professionisti - desktop.dc.html': '/professionisti',
  }

  let out = html
  for (const [file, route] of Object.entries(DOC_ROUTE_MAP)) {
    out = out.replaceAll(`href="${file}"`, `href="${route}"`)
  }
  return out.replace(/href="IdeaDiLuce - [^"]+\.dc\.html"/g, 'href="#"')
}

function stripSharedHeader(body) {
  let out = body.replace(/<dc-import\b[^>]*>\s*<\/dc-import>\s*/gi, '')
  out = out.replace(
    /^[\s\n]*(?:<!--[^>]*-->\s*)*<div style="background:#efe6d5;border-bottom:1px solid #e6dcc9;">[\s\S]*?<\/div>\s*/i,
    '',
  )
  out = out.replace(
    /^[\s\n]*(?:<!--[^>]*-->\s*)*<div style="background:#f7f1e8;border-bottom:1px solid #e6dcc9;position:sticky;[\s\S]*?<\/div>\s*(?:<!--[\s\S]*?-->\s*)*/i,
    '',
  )
  return out
}

function stripSharedFooter(body) {
  let out = body
  out = out.replace(
    /\s*<div style="background:#efe6d5;border-top:1px solid #e6dcc9;">\s*<div style="max-width:1320px[^"]*">[\s\S]*?Resta aggiornato[\s\S]*?<\/div>\s*<\/div>/i,
    '',
  )
  out = out.replace(
    /\s*<div style="background:#efe6d5;border-top:1px solid #e6dcc9;border-bottom:1px solid #e6dcc9;">[\s\S]*?<div style="background:#16130d;color:#9a8e78;">[\s\S]*?<\/div>\s*<\/div>\s*$/i,
    '',
  )
  return out.trim()
}

function tagHomeEmbeddedFooter(body) {
  return body.replace(
    /(<div)( style="background:#16130d;color:#9a8e78;">\s*<div style="max-width:1320px)/,
    '$1 data-dc-section="embedded-footer"$2',
  )
}

function tagHomeAnimationSections(html) {
  const sections = [
    ['SPLIT HERO', 'hero'],
    ['SEARCH (the bridge)', 'search'],
    ['SCEGLI PER ATTACCO', 'sockets'],
    ['SCEGLI COME CERCARE', 'paths'],
    ['ESPLORA PER AMBIENTE', 'rooms'],
    ['ARREDO SHOWCASE', 'design-showcase'],
    ['TECNICO SHOWCASE', 'technical-showcase'],
    ['I NOSTRI BRAND', 'brands'],
    ['GUIDE ALLA LUCE', 'guides'],
    ['PROFESSIONISTI', 'professionals'],
    ['ESPRESSIONI DI DESIGN', 'expressions'],
    ['DAL BLOG', 'blog'],
    ['PRODOTTO NON TROVATO', 'consult'],
    ['NEWSLETTER', 'newsletter'],
    ['TRUST + FOOTER', 'trust'],
  ]

  let out = html
  for (const [marker, id] of sections) {
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(
      `<!--(?:(?!-->).)*${escaped}(?:(?!-->).)*-->\\s*(<div)`,
      'i',
    )
    out = out.replace(re, `<div data-dc-section="${id}"`)
  }
  return out
}

function extractHelmetStyles(html) {
  const helmet = html.match(/<helmet>([\s\S]*?)<\/helmet>/i)
  if (!helmet) return { fonts: '', styles: '' }
  const content = helmet[1]
  const fonts = (content.match(/<link\b[^>]*>/gi) ?? []).join('\n')
  const styles = (content.match(/<style>[\s\S]*?<\/style>/gi) ?? []).join('\n')
  return { fonts, styles }
}

function unwrapOuterDiv(body) {
  return body
    .replace(/^<div style="width:100%;overflow:hidden;">\s*/i, '')
    .replace(/\s*<\/div>\s*$/i, '')
    .trim()
}

function main() {
  const args = process.argv.slice(2)
  const contentOnly = args.includes('--content-only')
  const filtered = args.filter((a) => a !== '--content-only')
  const [sourceRel, outputRel] = filtered

  if (!sourceRel || !outputRel) {
    console.error('Usage: node prepare-dc-html.mjs <source> <output> [--content-only]')
    process.exit(1)
  }

  const source = path.resolve(repoRoot, sourceRel)
  const output = path.resolve(repoRoot, 'client', outputRel)
  const raw = fs.readFileSync(source, 'utf8')
  const { fonts, styles } = extractHelmetStyles(raw)
  const isHome = /Home - desktop\.dc\.html$/i.test(source)

  let body = stripHelmet(extractXdcInner(raw))
  if (isHome) body = tagHomeAnimationSections(body)
  body = body.replace(/<!--[\s\S]*?-->/g, '')

  if (contentOnly) {
    body = stripSharedHeader(body)
    body = stripSharedFooter(body)
  }

  if (isHome) body = tagHomeEmbeddedFooter(body)

  body = unwrapOuterDiv(body)
  body = fixAssetPaths(body)
  body = fixDocLinks(body)
  body = body.trim()

  const doc = `<!-- Generated from ${path.basename(source)} — do not edit by hand. Re-run prepare-dc-html.mjs -->
${fonts}
${styles}
${body}
`

  fs.mkdirSync(path.dirname(output), { recursive: true })
  fs.writeFileSync(output, doc, 'utf8')
  console.log(`Wrote ${output} (${doc.length} bytes)`)
}

main()
