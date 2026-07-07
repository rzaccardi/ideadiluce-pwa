import { env } from '../../config/env.js'
import { HREFLANG_CODE, HUB_LOCALES, LOCALE_PATH } from '../../lib/hub-locale.js'
import { catalogStorefrontService } from '../catalog/catalog-storefront.service.js'
import { listAmbienteRoomSlugs, listIndexedGuideSlugs } from './seo-guide-slugs.js'

export const LLMS_TXT_CONTENT_TYPE = 'text/markdown; charset=utf-8'

function mdLink(label: string, url: string, note?: string): string {
  const safeLabel = label.replace(/[[\]]/g, '')
  return note ? `- [${safeLabel}](${url}): ${note}` : `- [${safeLabel}](${url})`
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** Contenuto llms.txt per crawler AI — pagine indicizzabili principali. */
export async function buildLlmsTxt(): Promise<string> {
  const site = env.PUBLIC_SITE_URL.replace(/\/$/, '')
  const [guideSlugs, roomSlugs, categories, brands] = await Promise.all([
    listIndexedGuideSlugs(),
    Promise.resolve(listAmbienteRoomSlugs()),
    catalogStorefrontService.listCategories('IT'),
    catalogStorefrontService.listBrands('IT'),
  ])

  const localeLines = HUB_LOCALES.map((locale) => {
    const prefix = LOCALE_PATH[locale]
    const label = HREFLANG_CODE[locale].toUpperCase()
    const home = prefix ? `${site}${prefix}/` : `${site}/`
    return mdLink(label, home, `Homepage in ${label}`)
  }).join('\n')

  const guideLines = guideSlugs
    .map((slug) => mdLink(titleFromSlug(slug), `${site}/guide/${slug}`, 'Guida editoriale'))
    .join('\n')
  const roomLines = roomSlugs
    .map((room) => mdLink(titleFromSlug(room), `${site}/ambienti/${room}`, 'Ispirazione per ambiente'))
    .join('\n')
  const topCategories = categories
    .filter((c) => c.slug)
    .slice(0, 12)
    .map((c) => mdLink(c.name, `${site}/categoria/${c.slug}`, 'Categoria catalogo'))
    .join('\n')
  const topBrands = brands
    .filter((b) => b.slug)
    .slice(0, 12)
    .map((b) => mdLink(b.name, `${site}/brand/${b.slug}`, 'Brand illuminazione'))
    .join('\n')

  return `# Idea di Luce

> E-commerce di illuminazione arredo e tecnica (Italia, multilingua IT/EN/ES/FR/DE).

Le pagine prodotto usano \`/prodotto/{slug}/\`; categorie, brand, guide e ambienti seguono rispettivamente \`/categoria/\`, \`/brand/\`, \`/guide/\` e \`/ambienti/\` con slug dedicato. Ogni pagina pubblica ha versioni localizzate (prefissi /en, /es, /fr, /de); la sitemap include i tag hreflang. I prezzi e la disponibilità possono dipendere dal listino e dalla sessione utente: non indicizzare URL con filtri query complessi sul catalogo.

## Pagine principali

${mdLink('Home', `${site}/`, 'Homepage italiana')}
${mdLink('Negozio', `${site}/negozio`, 'Catalogo prodotti')}
${mdLink('Brand', `${site}/brand`, 'Elenco brand')}
${mdLink('Guide', `${site}/guide`, 'Guide e contenuti editoriali')}
${mdLink('Ambienti', `${site}/ambienti`, 'Illuminazione per stanza')}
${mdLink('Professionisti', `${site}/professionisti`, 'Area professionisti')}
${mdLink('Contatti', `${site}/contatti`, 'Contatti e showroom')}

## Lingue

${localeLines}

## Guide

${guideLines || mdLink('Guide', `${site}/guide`, 'Elenco guide editoriali')}

## Ambienti

${roomLines}

## Categorie principali

${topCategories || mdLink('Negozio', `${site}/negozio`, 'Catalogo in aggiornamento')}

## Brand principali

${topBrands || mdLink('Brand', `${site}/brand`, 'Catalogo in aggiornamento')}

## Sitemap e feed

${mdLink('Sitemap XML', `${site}/sitemap.xml`, 'Elenco completo URL indicizzabili')}
${mdLink('Google Merchant feed', `${site}/merchant-feed.xml`, 'Feed prodotti Google Shopping')}
${mdLink('robots.txt', `${site}/robots.txt`, 'Regole per crawler web')}
`
}
