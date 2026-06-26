# Piano 03 — Integrazione fullstack catalogo

## Obiettivo

Collegare storefront SSR/CSR, BFF, Arfly v2 e Odoo inventory con pricing autenticato e fix di integrazione emersi dal worker.

## Fix applicati in questa sessione di verifica

### 1. Typecheck server — `ArflyClientError`

**File:** `server/src/modules/arfly-proxy/arfly-proxy.service.ts`

`ArflyClientError` era importato con `import type` ma usato come valore in `throw`. Corretto in import value.

### 2. SSR related products da Odoo

**File:** `client/src/lib/server-catalog.ts`

Prima: `relatedProducts` in SSR derivati da lista generica `/api/v2/products` (non relazioni Odoo).  
Dopo: priorità a `product.relatedProducts` dal detail Arfly; fallback lista solo se vuoto.

Allineato al CSR in `product.actions.ts` (`p.relatedProducts ?? []`).

## Flussi integrati

### Catalogo CSR

```
CatalogPage → fetchProducts → api.catalog.products (v1)
  → catalogStorefrontService → Arfly list + enrichProductCardsWithStock
  → applyClientFilters (inStock, prezzo, sort)
  → infinite scroll fetchNextProductsPage
```

Dedup richieste: `dedupeAsync` in `catalog.actions.ts`.

### PDP SSR

```
product-detail-route → fetchProductDetailServer
  → findProductIdBySlug (O(n) scan max 20×100)
  → GET /api/v2/product/:id
  → mapArflyProductDetail
  → POST /api/v1/catalog/availability/enrich-detail
  → relatedProducts da Odoo
```

### PDP CSR (hydration / navigazione client)

```
fetchProduct → api.arfly.productBySlug | product
  → getCatalogPricingOptions() (partner/pricelist se loggato)
  → mapArflyProductDetail → productStore.relatedProducts
```

### Pricing autenticato

| Layer | Meccanismo |
|-------|------------|
| Server v1 products | `resolvePricingContext(req)` → `partnerId`, `pricelistId` ad Arfly |
| Client Arfly calls | `getCatalogPricingOptions()` da `authStore.me.odooPartnerId/odooPricelistId` |
| Proxy v2 query | `partner_id`, `pricelist_id` query params |

**Nota SSR:** `fetchProductDetailServer` non passa ancora pricing context (session cookie server-side possibile ma non implementato nel helper attuale).

### Admin BO restock

Tipi admin (`admin/src/types/restock.ts`) allineati a DTO server con campi estesi (`productSlug`, `notifiedAt`, `odooTemplateId`).  
Pagine `restock-page.tsx` / `restock-detail-page.tsx` usano store/actions senza dipendere da shape card catalogo.

## Pattern problematici (non fixati)

### Slug lookup O(n)

`client/src/lib/arfly/lookup.ts` e `client/src/lib/server-catalog.ts` paginano fino a 20×100 prodotti per risolvere slug → id.  
Preferire endpoint `/api/v2/product/by-slug` (già usato in CSR via `api.arfly.productBySlug`).

### Proxy list N+1

`arfly-proxy.service.ts` fetcha detail per ogni item senza `spec_tags` — potenziale overhead su liste lunghe.

### Filtri categoria/brand

Parametri passati ad Arfly ma in staging non restringono il set (2 prodotti totali, stesso risultato con/senza filtro).

## File integrazione

```
client/src/lib/server-catalog.ts
client/src/lib/catalog-pricing.ts
client/src/features/product/product.actions.ts
client/src/features/catalog/catalog.actions.ts
server/src/modules/catalog/catalog-storefront.service.ts
server/src/modules/pricing/pricelist.service.ts
server/src/modules/arfly-proxy/
server/src/controllers/catalog-public.controller.ts
```
