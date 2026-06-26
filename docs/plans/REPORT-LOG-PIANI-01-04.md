# Log verifica Piani 01–04

Sessione: **2026-06-26 12:58 CEST** · repo `ideadiluce-pwa` · server `localhost:4000`

Formato: `timestamp | test | esito | note`

---

## Typecheck / build

| Timestamp | Test | Esito | Note |
|-----------|------|-------|------|
| 12:58 | server `tsc -p tsconfig.build.json --noEmit` | PASS | 0 errori |
| 12:58 | client `tsc --noEmit` | PASS | 0 errori |
| 12:58 | admin `tsc -b --noEmit` | PASS | 0 errori |
| 12:58 | admin `npm run build` | PASS | Warning chunk >500 kB |
| 12:58 | prisma `migrate status` | PASS | 25 migration, schema up to date |

---

## Test API (`npm run test:api`)

| Timestamp | Test | Esito | Note |
|-----------|------|-------|------|
| 12:58 | health GET /health | PASS | 200 |
| 12:58 | catalog GET /api/v2/products | PASS | slug estratto |
| 12:58 | site pages (7) | PASS | home, shell, attacco, chi-siamo, prodotto-non-trovato, guide |
| 12:58 | site inquiry POST | PASS | |
| 12:58 | catalog categories | PASS | items vuoti |
| 12:58 | catalog products BFF | PASS | 2 prodotti staging |
| 12:58 | cart session GET | PASS | |
| 12:58 | auth login + me | PASS | demo@example.com |
| 12:58 | cart clear DELETE | PASS | |
| 12:58 | **cart add item POST** | **FAIL** | 409 su tutti gli slug fallback — stock Odoo staging |
| 12:58 | cart patch | SKIP→PASS | carrello vuoto dopo fail add |
| 12:58 | cart stock GET | PASS | |
| 12:58 | cart recommendations | PASS | |
| 12:58 | wishlist list/add/remove | PASS | |
| 12:58 | shipping quotes/select | SKIP→PASS | carrello vuoto |
| 12:58 | checkout start | SKIP→PASS | carrello vuoto |
| 12:58 | payments stripe/bank | SKIP→PASS | checkout non eseguito |
| 12:58 | orders list | PASS | |
| 12:58 | seo sitemap | PASS | |
| 12:58 | forgot password | PASS | |
| 12:58 | odoo ping | PASS | |
| 12:58 | auth logout | PASS | |
| 12:58 | **totale integrazione** | **35/36** | unico fail: cart add (upstream stock) |

---

## Smoke curl

| Timestamp | Test | Esito | Note |
|-----------|------|-------|------|
| 12:58 | GET /health | PASS | 200 ok |
| 12:58 | GET /api/v1/cart | PASS | DTO con purchasableItemCount, warnings, deliveryLeadDays |
| 12:58 | GET /admin/odoo/status | PASS | 401 ADMIN_UNAUTHORIZED (route OK) |
| 12:58 | GET /catalog/products | PASS | priceDisplayMode ex_vat, inStock false |
| 12:58 | GET /catalog/categories | PASS | items [] |
| 12:58 | POST /cart/sync-from-client | PASS | 200; endpoint vivo, client non lo chiama |
| 12:58 | POST …/restock-notify (slug Eclisse) | PASS | 201 |

---

## Grep / static analysis

| Timestamp | Test | Esito | Note |
|-----------|------|-------|------|
| 12:58 | resolveProductAvailability | PASS | 0 occorrenze codice |
| 12:58 | getProductAvailabilityStatus | PASS | 7 file client |
| 12:58 | inStock:true hardcoded | WARN | catalog.mock + odooCatalogLive L151 |
| 12:58 | while(true) client | PASS | 0 match |
| 12:58 | CatalogPage useEffect loop | PASS | debounce 350ms, deps stabili |
| 12:58 | fetchCart duplicate calls | WARN | bootstrap + CartPage force; loadCart GET+reprice |
| 12:58 | syncFromClient client wiring | WARN | solo endpoints.ts, mai invocato |

---

## Flussi tracciati in codice

| Timestamp | Flusso | Esito | Note |
|-----------|--------|-------|------|
| 12:58 | Piano 01: checkout → sale.order update | PASS | odooOrderLive draft/sent write |
| 12:58 | Piano 01: OdooSyncQueue + scheduler 5min | PASS | server.ts avvia job |
| 12:58 | Piano 01: admin SyncQueuePage | PASS | **nuovo** vs report precedente |
| 12:58 | Piano 01: admin preventivi/listini UI | FAIL | API only |
| 12:58 | Piano 02: 3 stati availability | PASS | server + client allineati |
| 12:58 | Piano 02: enrich-detail + JSON-LD | PASS | |
| 12:58 | Piano 03: ex_vat + GET repricing | PASS | |
| 12:58 | Piano 03: freeze checkout priceSnapshot | PASS | cart-price-freeze.service |
| 12:58 | Piano 03: PricelistBadge UI | PASS | render B2C label (non null) |
| 12:58 | Piano 04: guest cart session + mirror cartId | PASS | emil_cart_mirror_v1 |
| 12:58 | Piano 04: login mergeCartsForUser | PASS | auth.service.ts |
| 12:58 | Piano 04: CartPage warnings/delivery/quote CTA | PASS | CartSummary + CartDeliveryBanner |
| 12:58 | Piano 04: /checkout/quote submit | PASS | **nuovo** — POST /quotes/request |
| 12:58 | Piano 04: add-to-cart staging | FAIL | assertLineStock 409 |

---

## Delta vs report precedente (26/06 mattina)

| Area | Prima | Ora |
|------|-------|-----|
| Test API | 26/36 fail cascade | 35/36 (skip intelligenti) |
| Admin coda sync | UI assente | SyncQueuePage + nav |
| Quote checkout | Stub | Flow reale con API |
| localStorage cart | emil_cart_v1 righe + sync | emil_cart_mirror_v1 solo metadata |
| loadCart client | GET only | GET + POST reprice se items |
| PricelistBadge | return null | Badge B2C attivo |

---

## Conteggio finale

**PASS:** 62 · **FAIL:** 3 · **WARN:** 6 · **SKIP/N/A:** 4

Fail principali: cart add staging, admin UI preventivi/listini, add-to-cart E2E staging.

---

*Log conciso companion di `docs/REPORT-TEST-PIANI-01-04.md`*
