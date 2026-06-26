# Report test catalogo Emil — 26 giugno 2026

## Riepilogo piani eseguiti

| Piano | Titolo | Stato verifica |
|-------|--------|----------------|
| 01 | DTO e contratto API | Implementato; gap documentati |
| 02 | Disponibilità centralizzata | Implementato; UI allineata |
| 03 | Integrazione fullstack | Fix applicati in sessione |

Documentazione dettagliata: `01-dto-contratto-api.md`, `02-disponibilita-centralizzata.md`, `03-integrazione-fullstack.md`.

---

## Test automatici (typecheck, unit)

| Check | Comando | Esito | Note |
|-------|---------|-------|------|
| Server typecheck | `cd server && npx tsc -p tsconfig.build.json --noEmit` | **PASS** | Dopo fix `ArflyClientError` import |
| Client typecheck | `cd client && npx tsc --noEmit` | **PASS** | |
| Admin typecheck | `cd admin && npx tsc -b --noEmit` | **PASS** | |
| Unit test client | — | **N/A** | Nessuno script `test` in `package.json` |
| Unit test server | — | **N/A** | Nessuno script `test` |
| Unit test admin | — | **N/A** | Nessuno script `test` |

### Grep controlli statici

| Pattern | Esito | Dettaglio |
|---------|-------|-----------|
| `resolveProductAvailability` | **PASS** | 0 occorrenze (migrazione completata) |
| `getProductAvailabilityStatus` | **PASS** | Usato in card, PDP, SEO, griglia tecnica |
| `inStock: true` hardcoded | **WARN** | Solo `catalog.mock.ts` e `odooCatalogLive.ts` (path legacy) |
| Loop `useEffect` catalogo | **PASS** | `CatalogPage`: deps stabili + debounce 350ms su `q`; no re-fetch infinito |
| Duplicate fetch | **PASS** | `dedupeAsync` su categories/brands/products |

**Conteggio automatici:** 5 PASS · 0 FAIL · 1 WARN · 3 N/A

---

## Flussi testati (pass/fail/warn + note)

### Catalogo API

| Flusso | Metodo | Esito | HTTP | Note |
|--------|--------|-------|------|------|
| Lista prodotti v1 | GET `/api/v1/catalog/products` | **PASS** | 200 | 2 items, `inStock:false` post-enrich Odoo |
| Filtro `q=led` | GET + query | **WARN** | 200 | Stessi 2 prodotti (catalogo minimo staging) |
| Filtro `category=illuminazione-tecnica` | GET + query | **WARN** | 200 | Nessuna restrizione effettiva |
| Categorie | GET `/api/v1/catalog/categories` | **WARN** | 200 | `items: []` |
| Brand | GET `/api/v1/catalog/brands` | **WARN** | 200 | `items: []` |
| Lista v2 raw | GET `/api/v2/products` | **PASS** | 200 | Payload Arfly con spec_tags |
| Detail v2 | GET `/api/v2/product/1099` | **PASS** | 200 | Varianti, specs, gallery |

Snippet risposta prodotti v1 (estratto):

```json
{"data":{"items":[{"slug":"eclisse-lampada-da-tavolo-artemide-design-vico-magistretti","inStock":false,"priceCents":17213}],"page":1,"total":2}}
```

### Client catalogo

| Flusso | Esito | Note |
|--------|-------|------|
| `catalog.actions.ts` infinite scroll | **PASS** | `fetchNextProductsPage` merge + `applyClientFilters` |
| Filtro `inStockOnly` | **WARN** | Solo client-side; server ignora parametro |
| `CatalogPage` useEffect | **PASS** | Fetch su cambio filtri URL; debounce ricerca |

### Slug lookup

| Flusso | Esito | Note |
|--------|-------|------|
| `arfly/lookup.ts` | **WARN** | Scan O(n) fino a 2000 prodotti; CSR preferisce `productBySlug` |
| `server-catalog.ts` | **WARN** | Stesso pattern SSR |

### PDP

| Flusso | Esito | Note |
|--------|-------|------|
| SSR `product-detail-route` | **PASS** | Static analysis + enrich-detail |
| `use-product-detail-state` | **PASS** | Variante default non-OOS, availability, max qty |
| 3 stati availability | **PASS** | `getProductAvailabilityStatus` copre available/orderable/out_of_stock |
| `relatedProducts` Odoo | **PASS** | Fix SSR: da `product.relatedProducts`; CSR già OK |

### Restock / availability UI

| Flusso | Esito | Note |
|--------|-------|------|
| POST restock-notify | **PASS** | 201 su prodotto con `inStock:false` ordinabile |
| `ProductCard` availability | **PASS** | Usa utility centralizzata, non `inStock` raw |
| enrich-detail | **PASS** | 200; imposta `inStock` da Odoo |

### Auth / pricing

| Flusso | Esito | Note |
|--------|-------|------|
| Server `resolvePricingContext` | **PASS** | partner + pricelist da session/Odoo map |
| Client `getCatalogPricingOptions` | **PASS** | Passa a `api.arfly.*` quando loggato |
| SSR pricing | **WARN** | `fetchProductDetailServer` non passa partner/pricelist |

### Admin BO

| Flusso | Esito | Note |
|--------|-------|------|
| Pagine restock | **PASS** | DTO admin compatibili; nessun typecheck error |

**Conteggio flussi:** 14 PASS · 0 FAIL · 8 WARN

---

## Nuovi funzionamenti

1. **DTO `ProductAvailabilityDataDTO`** condiviso server/client con arricchimento Odoo su list e detail.
2. **Utility `getProductAvailabilityStatus`** unica per card, PDP, varianti, SEO e filtro catalogo.
3. **Endpoint `POST /api/v1/catalog/availability/enrich-detail`** per SSR e arricchimento post-mapper.
4. **Restock notify** con regole su `isUnrecoverable` / qty / orderable.
5. **Pricing B2B/B2C** propagato ad Arfly via session server e auth client.
6. **SSR related products** ora da relazioni Odoo/Arfly (`related_products`), non lista arbitraria.

---

## Errori trovati e fix applicati

| # | Severità | Problema | Fix |
|---|----------|----------|-----|
| 1 | Blocker build | `ArflyClientError` import type usato come valore | Import value in `arfly-proxy.service.ts` |
| 2 | Bug UX SSR | Related products da lista generica | `server-catalog.ts` usa `product.relatedProducts` |

---

## Loop/chiamate problematiche

1. **Slug resolution O(n)** — `lookup.ts` / `server-catalog.ts` paginano fino a 20 pagine. Mitigazione consigliata: usare sempre `/api/v2/product/by-slug`.
2. **Proxy spec_tags N+1** — `proxyArflyProductList` può fetchare detail per item senza tag.
3. **Filtro inStock client-only** — paginazione server non aware; scroll infinito può caricare pagine con prodotti filtrati via client (accettabile finché catalogo piccolo).

Nessun loop infinito `useEffect` rilevato nel catalogo.

---

## Blocker Odoo upstream

1. **Categories/brands vuoti** — API Arfly v2 non restituisce dati in ambiente testato.
2. **Stock sempre false post-enrich** — inventory Odoo staging segna prodotti non disponibili (`inStock:false` su tutti i test).
3. **Filtri category/brand** — non efficaci con catalogo di 2 prodotti; da rivalidare con dataset più grande.
4. **`odooCatalogLive.ts`** — path legacy con `inStock: true` hardcoded se riattivato adapter Odoo diretto.

---

## Prossimi step consigliati

1. Usare `/api/v2/product/by-slug` in SSR (`fetchProductDetailServer`) eliminando scan O(n).
2. Propagare `partner_id`/`pricelist_id` in SSR se session presente (cookie forwarding).
3. Spostare filtro `inStockOnly` server-side o documentare limite client-side.
4. Popolare categories/brands su Arfly staging per test filtri UI.
5. Aggiungere script `test` minimi (availability service, mapper) per regressioni future.
6. Verificare stock Odoo su varianti test (1099/1178) per sbloccare UX “disponibile”.

---

## Riepilogo numerico finale

| Categoria | PASS | FAIL | WARN | N/A |
|-----------|------|------|------|-----|
| Test automatici | 5 | 0 | 1 | 3 |
| Flussi funzionali | 14 | 0 | 8 | 0 |
| **Totale** | **19** | **0** | **9** | **3** |

Fix applicati: **2**  
Blocker upstream Odoo: **4**
