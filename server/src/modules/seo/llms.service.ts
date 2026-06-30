import { env } from '../../config/env.js'
import { HREFLANG_CODE, HUB_LOCALES, LOCALE_PATH } from '../../lib/hub-locale.js'
import { catalogStorefrontService } from '../catalog/catalog-storefront.service.js'
import { listAmbienteRoomSlugs, listIndexedGuideSlugs } from './seo-guide-slugs.js'

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
    return `- ${label}: ${home}`
  }).join('\n')

  const guideLines = guideSlugs.map((slug) => `- ${site}/guide/${slug}`).join('\n')
  const roomLines = roomSlugs.map((room) => `- ${site}/ambienti/${room}`).join('\n')
  const topCategories = categories
    .filter((c) => c.slug)
    .slice(0, 12)
    .map((c) => `- ${site}/categoria/${c.slug}`)
    .join('\n')
  const topBrands = brands
    .filter((b) => b.slug)
    .slice(0, 12)
    .map((b) => `- ${site}/brand/${b.slug}`)
    .join('\n')

  return `# Idea di Luce

> E-commerce di illuminazione arredo e tecnica (Italia, multilingua IT/EN/ES/FR/DE).

## Pagine principali

- Home: ${site}/
- Negozio: ${site}/negozio
- Brand: ${site}/brand
- Guide: ${site}/guide
- Ambienti: ${site}/ambienti
- Professionisti: ${site}/professionisti
- Contatti: ${site}/contatti

## Lingue

${localeLines}

## Struttura URL

- Prodotto: ${site}/prodotto/{slug}/
- Categoria: ${site}/categoria/{slug}
- Brand: ${site}/brand/{slug}
- Guida: ${site}/guide/{slug}
- Ambiente: ${site}/ambienti/{room}

## Guide

${guideLines || '- (nessuna guida indicizzata)'}

## Ambienti

${roomLines}

## Categorie principali

${topCategories || '- (catalogo in aggiornamento)'}

## Brand principali

${topBrands || '- (catalogo in aggiornamento)'}

## Sitemap e feed

- ${site}/sitemap.xml
- ${site}/merchant-feed.xml
- ${site}/robots.txt

## Note per crawler

- I prezzi e la disponibilità possono dipendere dal listino e dalla sessione utente.
- Non indicizzare URL con filtri query complessi sul catalogo; usare le pagine categoria, brand e ambiente.
- Ogni pagina pubblica ha versioni localizzate (prefissi /en, /es, /fr, /de); la sitemap include i tag hreflang.
- Per l'elenco completo di URL indicizzabili usare ${site}/sitemap.xml.
`
}
