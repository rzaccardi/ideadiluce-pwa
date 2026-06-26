# Report verifica Piani 01–04

**Data:** 26 giugno 2026, 12:58 CEST  
**Ambiente:** macOS, repo `/Users/roberto/Code/ideadiluce-pwa`, server locale porta 4000  
**Scope:** verifica statica (typecheck, grep, trace codice, wiring endpoint) + smoke HTTP + script integrazione API

**Documentazione di riferimento:** `docs/plans/01-dto-contratto-api.md`, `02-disponibilita-centralizzata.md`, `03-integrazione-fullstack.md`, `REPORT-TEST-CATALOGO.md`

> **Numerazione piani operativi:** 01 Odoo · 02 Catalog/Availability · 03 Pricing · 04 Cart. I file in `docs/plans/` coprono gli stessi ambiti con numerazione diversa.

---

## Riepilogo esecutivo

I quattro piani risultano **implementati a livello backend e storefront** con typecheck pulito su tutti i workspace. Il blocco principale resta **upstream staging Odoo/Arfly** (stock non acquistabile), che fa fallire l’unico test API mancante e limita i test end-to-end checkout.

| Layer | Esito | Dettaglio |
|-------|-------|-----------|
| **Server** | ✅ / ⚠️ | `tsc` OK, Prisma up to date, route montate; **35/36** test API (`cart add item` → stock staging) |
| **Client** | ✅ / ⚠️ | `tsc` OK; flussi cart/pricing/quote verificati; **doppio/triplo repricing** su `fetchCart` |
| **Admin BO** | ✅ / ⚠️ | Build OK; **pagina coda sync Odoo** presente; mancano UI preventivi/listini |

**Esito complessivo:** ✅ core funzionante · ⚠️ gap UI admin (preventivi/listini), stock staging, chiamate carrello ridondanti

| Piano | Esito | Note principali |
|-------|-------|-----------------|
| 01 Odoo | ✅ / ⚠️ | Route admin, sync queue, retry scheduler OK; UI coda sync + retry ordine; no pagine preventivi/listini |
| 02 Catalog / Availability | ✅ | 3 stati, enrich Odoo, JSON-LD, restock 201; categorie/brand vuoti in staging |
| 03 Pricing | ✅ / ⚠️ | `ex_vat`, repricing GET, freeze checkout OK; `PricelistBadge` attivo per B2C |
| 04 Cart | ✅ / ⚠️ | DTO estesi, CartPage OK, quote flow reale; add-to-cart 409 in staging; `sync-from-client` non wired client |

---

## Nuove funzionalità per piano

### Piano 01 — Odoo

| Requisito | Stato | Evidenza |
|-----------|-------|----------|
| Moduli Odoo typecheck | ✅ | `npx tsc -p tsconfig.build.json --noEmit` — 0 errori |
| `GET /admin/odoo/status` | ✅ | `odoo-admin.routes.ts`, mount `v1Router.use('/admin/odoo', …)` |
| `GET /admin/odoo/quotations` (+ `:id`) | ✅ | Route presenti |
| `GET /admin/odoo/pricelists` | ✅ | Route presente |
| `POST /admin/odoo/pricelist-assignments` | ✅ | Route presente |
| `GET /admin/odoo/sync-queue` | ✅ | Route presente |
| `POST /admin/odoo/sync-queue/:id/retry` | ✅ | Route presente |
| Checkout → update `sale.order` (no duplicati) | ✅ | `createOrUpdateSaleOrder` in `odooOrderLive.ts`: draft/sent → `write` |
| `OdooSyncQueue` su failure | ✅ | `enqueueOdooSyncFailure` da payments/stripe finalize |
| Retry automatico | ✅ | Scheduler ogni 5 min in `odooSyncRetry.scheduler.ts` |
| UI admin retry sync (dettaglio ordine) | ✅ | `order-detail-page.tsx` + badge lista |
| **UI admin coda sync globale** | ✅ **NUOVO** | `SyncQueuePage` in `admin/src/App.tsx` + nav «Coda sync Odoo» |
| UI admin preventivi/listini | ❌ | Actions in `odoo.actions.ts`; **nessuna pagina** dedicata |
| `test-checkout` bridge | ⚠️ | `odoo-integration.service.ts` non passa `odooSaleOrderId` esistente → rischio duplicati in test |

**Trace checkout → sale.order:**

```
payments.checkoutStart
  → orderAdapter.createOrUpdateSaleOrder({ odooSaleOrderId: existing?.odooSaleOrderId, … })
    → odooOrderLive: draft|sent → write + replace order_line
      → altrimenti → create
```

---

### Piano 02 — Catalog / Availability

| Requisito | Stato | Evidenza |
|-----------|-------|----------|
| DTO `ProductAvailabilityDataDTO` condiviso | ✅ | `server/src/types/dto.ts` ↔ `client/src/types/dto.ts` |
| Endpoint BFF v1 catalogo | ✅ | GET categories/brands/products, POST enrich-detail |
| Proxy Arfly v2 | ✅ | GET `/api/v2/products`, `/product/:id`, `/product/by-slug` |
| 3 stati availability | ✅ | `available`, `orderable`, `out_of_stock` in `availability.service.ts` + `product-availability.ts` |
| Fallback 10 giorni | ✅ | `RESTOCK_LEAD_DAYS_FALLBACK = 10` |
| `resolveProductAvailability` | ✅ | **0 occorrenze** nel codice applicativo (solo docs) |
| `getProductAvailabilityStatus` | ✅ | 7 file storefront (card, PDP, SEO, griglia tecnica) |
| `catalog-stock.enrich` | ✅ | Odoo inventory → card/detail/cart lookup |
| JSON-LD availability | ✅ | `client/src/lib/seo.ts` |
| Restock notify | ✅ | `POST …/products/:slug/restock-notify` → **201** smoke test |
| SSR related products | ✅ | `server-catalog.ts` usa `product.relatedProducts` |
| `inStock: true` hardcoded | ⚠️ | `catalog.mock.ts` (OK); **`odooCatalogLive.ts` L151** (legacy) |
| Categorie/brand staging | ⚠️ | GET 200, `items: []` |
| Filtro `inStockOnly` | ⚠️ | Solo client-side in `catalog.actions.ts` |
| Slug lookup O(n) | ⚠️ | `lookup.ts` / `server-catalog.ts` scan paginato |

**Attenzione carrello:** `cart.mappers.ts` default `purchasable: true` se lookup availability manca → incoerenza vs `assertLineStock` (409).

---

### Piano 03 — Pricing

| Requisito | Stato | Evidenza |
|-----------|-------|----------|
| `priceDisplayMode: 'ex_vat'` | ✅ | DTO server/client + mapper Arfly |
| GET `/cart` repricing | ✅ | `cart.service.ts` `dtoFromCartId` → `syncCartPricing` → `repriceCartFromOdoo` (salvo freeze) |
| POST `/cart/reprice` | ✅ | Route montata; **client chiama anche da `loadCart`** se items > 0 |
| Freeze prezzi checkout | ✅ | `CheckoutSession.priceSnapshotJson`; `cart-price-freeze.service.ts` |
| Pricing B2B session | ✅ | `resolvePricingContext` server; `getCatalogPricingOptions()` client |
| SSR pricing PDP | ⚠️ | `fetchProductDetailServer` senza partner/pricelist da cookie |
| `PricelistBadge` | ✅ | Renderizza label listino B2C in `CartSummary.tsx` (non più stub null) |
| Segmento `PROFESSIONAL` | ✅ | Enum Prisma + fallback B2C in `pricelist.service.ts` |

---

### Piano 04 — Cart

| Requisito | Stato | Evidenza |
|-----------|-------|----------|
| GET `/cart`: `purchasable`, `warnings`, `deliveryLeadDays` | ✅ | DTO + smoke curl 200 |
| POST `/cart/sync-from-client` | ⚠️ | Route server OK (curl 200); **client non invoca** `api.cart.syncFromClient` |
| Mirror localStorage | ✅ **CAMBIATO** | Chiave `emil_cart_mirror_v1` (solo `cartId` + scadenza riserva); legacy `emil_cart_v1` rimosso |
| Bootstrap guest | ✅ | Session cookie server-side; `bootstrapSession()` → `fetchCart({ force: true })` |
| Login → merge carrello | ✅ | `mergeCartsForUser` in `auth.service.ts` |
| Stock gate add-to-cart | ✅ | `assertLineStock` → 409 `STOCK_UNAVAILABLE` |
| CartPage: badge non acquistabile | ✅ | Badge, qty disabilitata, line-through |
| CartPage: CTA preventivo | ✅ | Link `/checkout/quote` in `CartSummary.tsx` |
| CartPage: banner consegna | ✅ | `CartDeliveryBanner` |
| **`/checkout/quote` flow reale** | ✅ **NUOVO** | `CheckoutQuotePage` + `submitQuoteRequest` → `POST /api/v1/quotes/request` (login richiesto) |
| Smoke test API add item | ❌ | **409** — nessun prodotto acquistabile in staging Odoo |

---

## Test eseguiti (sessione 26/06/2026 12:58)

### Typecheck e build

| Comando | Esito | Note |
|---------|-------|------|
| `cd server && npx tsc -p tsconfig.build.json --noEmit` | ✅ **PASS** | 0 errori |
| `cd client && npx tsc --noEmit` | ✅ **PASS** | 0 errori |
| `cd admin && npx tsc -b --noEmit` | ✅ **PASS** | 0 errori |
| `cd admin && npm run build` | ✅ **PASS** | Warning chunk >500 kB |
| Unit test server/client/admin | **N/A** | Nessuno script `test` nei package.json |

### Migration Prisma

| Verifica | Esito |
|----------|-------|
| `prisma migrate status` | ✅ **Database schema is up to date** (25 migration) |

### Script integrazione API (`npm run test:api`)

Eseguito contro `http://localhost:4000`: **35/36 passed**.

| Esito | Test |
|-------|------|
| ✅ OK (35) | health, catalog v2, site pages, inquiry, categories, products BFF, cart session, auth, clear, stock, recommendations, wishlist, shipping (skip), checkout (skip), payments (skip), orders, sitemap, forgot password, odoo ping, logout, … |
| ❌ FAIL (1) | **`cart add item`** — nessun slug acquistabile dopo fallback multiplo; messaggio: impostare `API_TEST_PRODUCT_REF` |

**Causa 409:** inventory Odoo staging segna prodotti non acquistabili post-enrich. Non è errore di wiring route.

### Grep controlli statici

| Pattern | Esito | Dettaglio |
|---------|-------|-----------|
| `resolveProductAvailability` | ✅ PASS | 0 occorrenze codice (solo markdown piani/report) |
| `getProductAvailabilityStatus` | ✅ PASS | 7+ file storefront |
| `inStock: true` hardcoded | ⚠️ WARN | `catalog.mock.ts` + `odooCatalogLive.ts` (legacy) |
| Loop `while(true)` client | ✅ PASS | 0 match |
| `useEffect` CatalogPage | ✅ PASS | Deps stabili + debounce 350 ms |
| `dedupeAsync` cart/catalog | ✅ PASS | Previene fetch concorrenti |
| Odoo sync retry scheduler | ✅ PASS | Flag `running` evita overlap |
| `fetchCart` call sites | ⚠️ WARN | Bootstrap + CartPage + checkout → doppio GET; `loadCart` aggiunge POST reprice |

### Wiring endpoint client ↔ server

| Client | Server | Stato |
|--------|--------|-------|
| `api.cart.get` | `GET /api/v1/cart` | ✅ |
| `api.cart.syncFromClient` | `POST /api/v1/cart/sync-from-client` | ⚠️ API OK · **non chiamato client** |
| `api.cart.addItem` | `POST /api/v1/cart/items` | ✅ |
| `api.cart.reprice` | `POST /api/v1/cart/reprice` | ✅ (invocato da `loadCart`) |
| `api.quotes.request` | `POST /api/v1/quotes/request` | ✅ |
| `fetchOdooSyncQueue` | `GET /admin/odoo/sync-queue` | ✅ + UI `SyncQueuePage` |
| `fetchOdooQuotations/Pricelists` | Route server | ✅ API · ❌ no UI |

### Smoke HTTP (curl)

| Endpoint | Esito | Note |
|----------|-------|------|
| `GET /health` | ✅ 200 | |
| `GET /api/v1/cart` | ✅ 200 | `purchasableItemCount`, `warnings`, `deliveryLeadDays` |
| `POST /api/v1/cart/sync-from-client` | ✅ 200 | Body test ignorato (prodotto invalido) |
| `GET /api/v1/admin/odoo/status` | ✅ 401 | Route raggiungibile |
| `GET /api/v1/catalog/products` | ✅ 200 | 2 prodotti, `priceDisplayMode: ex_vat`, `inStock: false` |
| `GET /api/v1/catalog/categories` | ✅ 200 | `items: []` |
| `POST …/products/:slug/restock-notify` | ✅ 201 | Eclisse slug test |

---

## Errori trovati

| # | Severità | Problema | Root cause | Stato |
|---|----------|----------|------------|-------|
| 1 | Test API | `cart add item` FAIL | Stock Odoo staging: tutti i prodotti test → 409 `STOCK_UNAVAILABLE` | ⚠️ Aperto (upstream) |
| 2 | UX/API | `sync-from-client` non usato dal client | Architettura migrata a session server + mirror `cartId`; endpoint legacy non wired | ⚠️ Gap documentazione/implementazione |
| 3 | Performance | Repricing ridondante | `loadCart`: GET (server repricing) + POST `/reprice`; bootstrap + CartPage = 2× ciclo | ⚠️ Basso |
| 4 | Mapper | `purchasable: true` default | `cart.mappers.ts` quando lookup availability assente | ⚠️ Incoerenza vs 409 add |
| 5 | Admin UI | No pagine preventivi/listini | API pronte, route admin assenti in `App.tsx` | ⚠️ Aperto |
| 6 | Test bridge | `test-checkout` Odoo | Non passa `odooSaleOrderId` esistente | ⚠️ Solo ambiente test |
| 7 | Upstream | Categories/brands vuoti | Arfly v2 staging non popolato | ⚠️ Blocker test filtri |
| 8 | Legacy | `odooCatalogLive.ts` `inStock: true` | Path adapter legacy se riattivato | ⚠️ Basso |

Nessun fix TS applicato in questa sessione (typecheck già pulito).

---

## Rischi loop / chiamate duplicate

| Scenario | Rischio | Dettaglio |
|----------|---------|-----------|
| Bootstrap + CartPage | ⚠️ Medio | Entrambi `fetchCart({ force: true })` → 2× (GET + reprice) all’apertura carrello |
| `loadCart` GET + reprice | ⚠️ Medio | Server repricing su GET **e** client POST reprice se items > 0 |
| FloatingCartMonitor poll | ✅ OK | Poll 30 s senza `force` |
| `dedupeAsync('cart:get')` | ✅ OK | Previene richieste concorrenti duplicate |
| `useCartStockPolling` | ✅ OK | 30 s + focus/visibility; `dedupeAsync('cart:stock')` |
| CatalogPage infinite scroll | ✅ OK | Debounce + deps stabili |
| Proxy spec_tags N+1 | ⚠️ Medio | Detail fetch per item senza tag |
| Odoo sync retry scheduler | ✅ OK | Flag overlap |

---

## Checklist flussi utente

| Flusso | Esito | Note |
|--------|-------|------|
| Browse catalogo BFF v1 | ✅ | Enrich Odoo su lista |
| Filtro «Solo disponibili» | ⚠️ | Client-side only |
| PDP 3 stati + restock | ✅ | Utility centralizzata; restock 201 |
| JSON-LD Google Shopping | ✅ | Mapping schema.org |
| Pricing B2B loggato (CSR) | ✅ | Session → Arfly |
| Carrello guest (session cookie) | ✅ | Mirror localStorage solo metadata |
| Bootstrap → GET cart | ✅ | No più sync righe localStorage |
| Login → merge carrello | ✅ | `mergeCartsForUser` server-side |
| Add to cart (staging) | ❌ | 409 stock Odoo |
| GET cart → repricing | ✅ | Server-side su ogni GET |
| Checkout → freeze prezzi | ✅ | `priceSnapshotJson` |
| Availability in carrello | ✅ | Enrich + mapper; banner lead time |
| Preventivo da carrello | ✅ | Form + API quotes (non stub) |
| Checkout pagamento → Odoo | ✅ | Update sale.order draft/sent |
| BO coda sync Odoo | ✅ | Pagina `/sync-queue` + retry |
| BO preventivi/listini | ❌ | API only |
| Pagamento → sync funnel Odoo | ✅ | Enqueue on failure + scheduler |

---

## Riepilogo numerico

| Categoria | PASS | FAIL | WARN | N/A |
|-----------|------|------|------|-----|
| Typecheck/build | 4 | 0 | 0 | 0 |
| Grep statici | 5 | 0 | 2 | 0 |
| Test API integrazione | 35 | 1 | 0 | 0 |
| Smoke curl | 7 | 0 | 0 | 0 |
| Flussi utente | 15 | 2 | 3 | 0 |

Blocker upstream staging: **3** (stock, categories/brands, filtri catalogo)

---

## Raccomandazioni prioritarie

1. Seed Odoo staging con almeno una variante acquistabile o `API_TEST_PRODUCT_REF` documentato per CI.
2. Ridurre repricing ridondante: rimuovere POST reprice da `loadCart` (GET già repricing) o skip force in CartPage post-bootstrap.
3. Valutare rimozione o re-wiring `sync-from-client` se architettura session-only è definitiva.
4. UI admin per preventivi Odoo e listini (API già pronte).
5. Default `purchasable: false` in `cart.mappers.ts` quando lookup assente.
6. Passare `odooSaleOrderId` in `odoo-integration.service.ts` (`test-checkout`).
7. SSR slug via `/api/v2/product/by-slug` + forwarding pricelist cookie.

---

*Report unificato — verifica fresca 26 giugno 2026 (typecheck, test API, curl, trace codice).*
