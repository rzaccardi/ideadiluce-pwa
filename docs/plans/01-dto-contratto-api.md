# Piano 01 — DTO e contratto API catalogo

## Obiettivo

Allineare server e client su tipi condivisi per catalogo, disponibilità e restock, con endpoint BFF v1 che wrappano Arfly v2 e arricchimento Odoo.

## Implementato

### Tipi DTO (`ProductAvailabilityDataDTO`, card, detail, restock)

| Tipo | Server | Client |
|------|--------|--------|
| `ProductAvailabilityDataDTO` | `server/src/types/dto.ts` | `client/src/types/dto.ts` |
| `ProductCardDTO` (+ `availability`, `specTags`, `priceDisplayMode`) | ✓ | ✓ |
| `ProductDetailDTO` (+ varianti, `relatedProducts`, `accessories`, `alternatives`) | ✓ | ✓ |
| `StockRestockRequestDTO` | ✓ | ✓ |
| `ProductListDTO` (+ `nextInStockSkip` opzionale) | ✓ | parziale client |

Campi chiave `ProductAvailabilityDataDTO`:

- `qtyAvailable`, `isOrderable`, `restockDate`, `customerLeadTimeDays`, `isUnrecoverable`

### Endpoint BFF v1 catalogo

| Metodo | Path | Controller / service |
|--------|------|---------------------|
| GET | `/api/v1/catalog/categories` | `catalogPublicController.categories` → `catalogStorefrontService.listCategories` |
| GET | `/api/v1/catalog/brands` | `catalogPublicController.brands` → `catalogStorefrontService.listBrands` |
| GET | `/api/v1/catalog/products` | `catalogPublicController.products` → Arfly list + `enrichProductCardsWithStock` |
| POST | `/api/v1/catalog/availability/enrich-detail` | `enrichProductDetailWithStock` |
| POST | `/api/v1/catalog/products/:slug/restock-notify` | `restockNotifyService.requestForSlug` |

### Proxy Arfly v2 (raw Odoo hub)

| Metodo | Path | Modulo |
|--------|------|--------|
| GET | `/api/v2/products` | `arfly-proxy` |
| GET | `/api/v2/product/:productId` | `arfly-proxy` |
| GET | `/api/v2/product/by-slug` | `arfly-proxy` |

### Mapper Arfly → DTO

- Server: `server/src/adapters/arfly/arflyMapper.ts`
- Client: `client/src/lib/arfly/mapper.ts` (mirror per CSR/SSR)

### Client API layer

- `client/src/api/endpoints.ts` — `api.catalog.*`, `api.arfly.*` con `partner_id` / `pricelist_id` opzionali

## File principali toccati

```
server/src/types/dto.ts
server/src/modules/catalog/catalog-storefront.service.ts
server/src/modules/catalog/catalog.routes.ts
server/src/controllers/catalog-public.controller.ts
server/src/adapters/arfly/arflyMapper.ts
server/src/modules/arfly-proxy/
client/src/types/dto.ts
client/src/api/endpoints.ts
client/src/lib/arfly/mapper.ts
client/src/features/catalog/catalog.actions.ts
```

## Gap contrattuali noti

1. **`inStockOnly` solo client-side** — `catalog.actions.ts` filtra con `isCatalogProductPurchasable`; il parametro non viene passato al server. `ProductListDTO.nextInStockSkip` non è usato lato client.
2. **Categorie/brand vuoti in staging** — GET categories/brands risponde 200 con `items: []` (Arfly `/api/v2/categories` e `/brands` non popolati o non configurati).
3. **`categorySlug` null** — le card in lista non espongono sempre lo slug categoria dal mapper Arfly.
4. **Odoo live legacy** — `odooCatalogLive.ts` imposta ancora `inStock: true` hardcoded nel path mock/live legacy (non usato dal flusso Arfly principale).
5. **Risposta v2 wrappata** — proxy restituisce `{ data: ... }`; i client interni (`arflyClient`) consumano il payload già unwrapped.

## Verifica

- Typecheck server/client: OK (post-fix import `ArflyClientError`)
- Runtime curl (26/06/2026): products 200, categories/brands 200 (vuoti), v2 products 200, v2 product/1099 200
