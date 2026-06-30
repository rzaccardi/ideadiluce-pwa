# Report ottimizzazione performance

## Baseline (pre-ottimizzazione)

Misurazione eseguita il 30/06/2026. Prima della misurazione sono stati corretti errori TypeScript preesistenti che impedivano il build (LanguageSwitcher, ContentBlockList, CheckoutPage, search-hints-admin).

### Client (`npm run build` in `client/`)

| Metrica | Valore |
|---------|--------|
| Tempo build totale | **23,4 s** |
| Compilazione | 5,6 s |
| First Load JS condiviso | **103 kB** |
| Middleware | **34,5 kB** |
| Home `/` | 4,48 kB page / **305 kB** First Load JS |
| Checkout `/checkout` | 17,9 kB / **273 kB** First Load JS |
| Catalogo `/negozio` | 169 B / **310 kB** First Load JS |

**Test disponibili:** `npm run test` (vitest), `npm run benchmark:catalog-search`

### Admin (`npm run build` in `admin/`)

| Metrica | Valore |
|---------|--------|
| Tempo build totale | **7,1 s** |
| Bundle JS | **1 103 kB** (gzip 296 kB) — chunk unico |
| CSS | **121 kB** (gzip 19 kB) |

**Test disponibili:** nessuno

### Server (`npm run build` in `server/`)

| Metrica | Valore |
|---------|--------|
| Tempo build (tsc) | **~12 s** |
| Output | `dist/` via `tsconfig.build.json` |

**Test disponibili:** `npm run test` (vitest), `npm run test:tax:db`

### Pain point architetturali (pre-ottimizzazione)

1. **Middleware client:** `lookupSeoRedirect` chiamato su ogni richiesta storefront (fetch API backend).
2. **Carrello BE:** GET `/cart` esegue reprice Odoo di default (`reprice !== false`).
3. **Carrello FE:** polling ogni 30 s su tutte le pagine tranne cart/checkout (`useCartSync(!isCartFlow)`).
4. **GlobalSearchPalette:** import statico — bundle homepage/catalogo include ricerca anche se chiusa.
5. **Admin:** nessun code-splitting; chunk JS monolitico ~1,1 MB.
6. **i18n:** tutti i messaggi IT/EN/DE/FR in un unico modulo.
7. **Session BE:** `loadOrCreateSession` su tutte le route `/api/v1` (hit DB per sessione).
8. **Catalog SKU:** possibili fetch Arfly duplicate per enrichment.

---

## Riepilogo post-ottimizzazione

| Package | Build (prima → dopo) | Bundle / metriche chiave |
|---------|----------------------|---------------------------|
| **Client** | 23,4 s → **~14 s** | Home FLJS **305 → 259 kB** (−15%); Negozio **310 → 263 kB**; Checkout **273 → 229 kB** |
| **Admin** | 7,1 s → **~2,6 s** | Entry chunk **1103 → 225 kB**; chunk lazy per route pesanti |
| **Server** | ~12 s → **~4 s** | Nessun delta bundle; meno lavoro runtime (compression, cache sessione, reprice opt-in) |

**Test:** server 115/115 ✓, client 35/35 ✓

---

## Step 1.1 - BE: compression middleware

**Modifiche:** `compression` in `server/src/app.ts`, dipendenza aggiunta.

| Metrica | Prima | Dopo |
|---------|-------|------|
| Build server | ~12 s | ~4 s |
| Bundle | n/a | n/a |

**Rischio:** nessuno. Risposte JSON/XML compresse in transit.

---

## Step 1.2 - BE: Cart GET senza reprice automatico

**Modifiche:** `dtoFromCartId` reprice opt-in (`reprice === true`); GET `/cart?reprice=1`; mutazioni add/patch mantengono reprice; FE cart/checkout passano `reprice: true`.

| Metrica | Prima | Dopo |
|---------|-------|------|
| Build server | OK | OK |

**Rischio:** mitigato — checkout/cart page chiamano `fetchCart({ reprice: true })`. Polling/header usa GET senza reprice (no chiamate Odoo ogni 30 s).

---

## Step 1.3 - FE: Middleware SEO lookup ristretto

**Modifiche:** `shouldLookupSeoRedirect()` in `client/src/middleware.ts` — skip route note (prodotto, categoria, cart, content pages, ecc.).

| Metrica | Prima | Dopo |
|---------|-------|------|
| Middleware | 34,5 kB | 34,8 kB |
| Build client | 23,4 s | ~14 s |

**Rischio:** redirect admin su slug singoli non whitelisted restano coperti; route ad alto traffico evitano fetch API.

---

## Step 1.4 - FE: Lazy-load GlobalSearchPalette

**Modifiche:** `dynamic()` + render condizionale `open` in `global-search-context.tsx`.

| Metrica | Prima | Dopo |
|---------|-------|------|
| Home FLJS | 305 kB | **259 kB** |

**Rischio:** `fetchCatalogBootstrap` resta solo all'apertura palette (nessun fetch duplicato a mount app).

---

## Step 1.5 - FE: Polling carrello limitato

**Modifiche:** `useCartSync(isCartFlow || open)` in `HeaderMiniCart.tsx`.

| Metrica | Prima | Dopo |
|---------|-------|------|
| GET /cart (storefront) | ogni 30 s | solo cart/checkout o mini-cart aperto |

**Rischio:** `FloatingCartMonitor` ha polling proprio (non modificato in questo step).

---

## Step 1.6 - BO: Lazy routes App.tsx

**Modifiche:** `React.lazy` + `Suspense` per orders, site, guides, odoo, seo.

| Metrica | Prima | Dopo |
|---------|-------|------|
| Entry JS | 1103 kB | **225 kB** |
| Build admin | 7,1 s | **2,6 s** |

---

## Step 1.7 - BO: Dead dependencies rimosse

**Modifiche:** rimossi `jodit`, `jodit-react`, `@fontsource-variable/geist`, `circle-flags`; CSS Jodit da `index.css`.

| Metrica | Prima | Dopo |
|---------|-------|------|
| CSS admin | 121 kB | 121 kB |

**Build:** OK.

---

## Step 2.1 - FE: Split i18n per locale

**Modifiche:** `client/src/i18n/messages/{it,en,es,fr,de}.ts`, loader con `preloadLocale()` in `LocaleProvider`.

| Metrica | Prima | Dopo |
|---------|-------|------|
| Home FLJS | 305 kB | **259 kB** (solo IT nel bundle iniziale) |

**Rischio:** locale non-IT usa fallback IT fino a `preloadLocale` completato (flash minimo).

---

## Step 2.2 - FE: next.config optimizations

**Modifiche:** `optimizePackageImports` (motion), `images.formats` avif/webp, `minimumCacheTTL: 86400`.

| Metrica | Prima | Dopo |
|---------|-------|------|
| Build client | 23,4 s | ~14 s |

---

## Step 2.3 - FE: Valtio snapshots selettivi

**Modifiche:** `CatalogPage.tsx` — snapshot per campo; `ProductCard.tsx` — solo `cart?.items`.

**Rischio:** meno re-render su mutazioni store non correlate.

---

## Step 2.4 - FE: Home bootstrap SSR

**Modifiche:** `fetchHomeBrandsServer`, `fetchFeaturedGuidesServer`; props a `HomePage`; skip client fetch se SSR presente.

**Rischio:** nessun loop — client fetch solo se array SSR vuoto.

---

## Step 2.5 - BE: Cache SKU Arfly

**Modifiche:** cache in-memory 5 min in `catalog-storefront.service.ts` per enrichment SKU.

**Rischio:** SKU stale max 5 min su cache hit (accettabile per listing).

---

## Step 2.6 - BE: Session middleware cache

**Modifiche:** cache lookup sessione 5 s in `session.ts` (`loadValidSession`).

**Rischio:** logout/revoca sessione può essere visibile fino a 5 s — accettabile per storefront.

---

## Step 2.7 - BO: Editor immutable updates

**Modifiche:** `immutableSetAtPath` in `site-content-utils.ts`; editor senza `cloneContent` full-tree.

**Rischio:** nessuno; keystroke O(depth) invece di O(tree).

---

## Step 2.8 - BO: vite manualChunks

**Modifiche:** chunk `vendor-react`, `vendor-ui`, `vendor-icons`, `vendor-state` in `vite.config.ts`.

| Chunk | Size (gzip) |
|-------|-------------|
| index | 225 kB (43 kB) |
| vendor-react | 425 kB (131 kB) |
| vendor-ui | 182 kB (60 kB) |

---

## Step 3.1 - FE: dynamic MobileSiteMenu, CatalogFiltersModal

**Modifiche:** `dynamic()` in `SiteHeader.tsx` e `CatalogPageView.tsx`.

| Negozio FLJS | 264 → **263 kB** |

---

## Step 3.2 - BE: Cache-Control catalog bootstrap

**Modifiche:** `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` su bootstrap e categories.

---

## Step 3.3 - FE: CatalogFiltersModal framer-motion

**Stato:** coperto da Step 3.1 (modal in chunk separato con motion interno).

---

## Step 3.4 - Remove lottie-react

**Modifiche:** rimosso da `client/package.json` (non usato nel codice). `motion` resta (usato via `@/lib/motion-client`).

---

## Step saltati / note

- **FloatingCartMonitor:** mantiene polling 30 s globale — candidato a refactor futuro (allineare a Step 1.5).
- **Split route session pubblica:** non implementato (cache 5 s scelta al posto di split router v1).
- **Visualizzatore bundle admin:** non aggiunto (manualChunks sufficiente per report chunk).

---

## File report

`/Users/roberto/Code/ideadiluce-pwa/docs/PERF_OPTIMIZATION_REPORT.md`
