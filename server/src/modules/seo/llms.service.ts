import { env } from '../../config/env.js'
import { listAmbienteRoomSlugs, listIndexedGuideSlugs } from './seo-guide-slugs.js'

/** Contenuto llms.txt per crawler AI — pagine indicizzabili principali. */
export async function buildLlmsTxt(): Promise<string> {
  const site = env.PUBLIC_SITE_URL.replace(/\/$/, '')
  const [guideSlugs, roomSlugs] = await Promise.all([
    listIndexedGuideSlugs(),
    Promise.resolve(listAmbienteRoomSlugs()),
  ])
  const guideLines = guideSlugs.map((slug) => `- ${site}/guide/${slug}`).join('\n')
  const roomLines = roomSlugs.map((room) => `- ${site}/ambienti/${room}`).join('\n')

  return `# Idea di Luce

> E-commerce di illuminazione arredo e tecnica (Italia, multilingua IT/EN/ES/FR/DE).

## Pagine principali

- Home: ${site}/
- Catalogo: ${site}/catalogo
- Brand: ${site}/brand
- Guide: ${site}/guide
- Ambienti: ${site}/ambienti
- Professionisti: ${site}/professionisti
- Contatti: ${site}/contatti

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

## Sitemap e feed

- ${site}/sitemap.xml
- ${site}/merchant-feed.xml

## Note

- I prezzi e la disponibilità possono dipendere dal listino e dalla sessione utente.
- Non indicizzare URL con filtri query complessi sul catalogo; usare le pagine categoria, brand e ambiente.
`
}
