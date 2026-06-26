import { env } from '../../config/env.js'

/** Contenuto llms.txt per crawler AI — pagine indicizzabili principali. */
export function buildLlmsTxt(): string {
  const site = env.PUBLIC_SITE_URL.replace(/\/$/, '')
  return `# Idea di Luce

> E-commerce di illuminazione arredo e tecnica (Italia, multilingua IT/EN/ES/FR/DE).

## Pagine principali

- Home: ${site}/
- Catalogo: ${site}/catalog
- Brand: ${site}/brand
- Professionisti: ${site}/professionisti
- Contatti: ${site}/contatti

## Struttura URL

- Prodotto: ${site}/prodotto/{slug}/
- Categoria: ${site}/categoria/{slug}
- Brand: ${site}/brand/{slug}

## Sitemap

- ${site}/sitemap.xml

## Note

- I prezzi e la disponibilità possono dipendere dal listino e dalla sessione utente.
- Non indicizzare URL con filtri query complessi sul catalogo; usare le pagine categoria e brand.
`
}
