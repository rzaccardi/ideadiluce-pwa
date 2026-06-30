# Report ottimizzazioni performance

## Fase 4

### Feature 1 — BE: Cart batch reprice + unified product resolve

**Prima:** `dtoFromCartId` e `checkStock` risolvevano ogni `productRef` due volte (lookup catalogo display/prezzo + lookup availability) con `resolveCatalogProduct` in parallelo duplicato.

**Dopo:** una sola `resolveProductMapForCartLines` per GET carrello completo; `buildCartAvailabilityLookup` accetta `preResolvedProducts`. Il reprice Odoo era già in batch (`resolveCartLineUnitPricesCents`, max 2 read Odoo).

**Impatto misurabile:** per un carrello con N righe uniche → da ~2N chiamate Arfly a ~N (stima −50% round-trip catalogo su GET/reprice).

**Test:** `cd server && npm run build && npm run test` — OK.

### Feature 2 — BE: Merchant feed parallel build + persistence

**Prima:** batch parallelo a 24 slug; cache solo in memoria (cold start = rebuild O(n) al primo hit).

**Dopo:** batch limitato a 8 slug; persistenza su disco `.cache/seo/*.json` + `hydrateSeoCacheFromDisk()` all'avvio.

**Impatto:** cold start serve feed da disco se presente; build più graduale sotto carico Arfly.

**Test:** server build + 131 test — OK.

### Feature 3 — BE: Session middleware skip DB su route pubbliche

**Prima:** ogni richiesta `/api/v1/*` senza cookie creava sessione guest in DB.

**Dopo:** `loadV1Session` — senza cookie su path non-privati (`catalog`, `site`, `seo`, …) nessun hit DB; con cookie carica sessione per listino B2B; path privati (`cart`, `checkout`, …) invariati.

**Test:** 133 test — OK.

### Feature 4 — FE: Catalog bootstrap SSR

**Prima:** primo paint catalogo → `fetchCatalogBootstrap` client (`/api/v1/catalog/bootstrap`).

**Dopo:** `fetchCatalogBootstrapServer` in `catalog-route.tsx` + `seedCatalogBootstrap` con `skipIfFresh` sul client.

**Test:** client build + 46 test — OK.

### Feature 5 — FE: waterfall catalogo/landing residui

**Dopo:** bootstrap SSR anche su landing categoria (arredo/tecnica); `skipIfFresh` su search palette e autocomplete.

**Test:** client build + 46 test — OK.

### Feature 6 — BO: endpoint allLocales batch

**Prima:** `fetchSitePageAllLocales` = 5 richieste HTTP parallele.

**Dopo:** `GET /admin/site/pages/:pageKey?allLocales=1` → 1 richiesta.

**Test:** server 133 test + admin build — OK.

### Feature 7 — Cleanup: FloatingCartMonitor rimosso

Componente non montato (duplicava polling di `useCartSync` in `HeaderMiniCart`). File eliminato.
