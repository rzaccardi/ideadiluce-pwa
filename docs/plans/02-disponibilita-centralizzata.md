# Piano 02 — Disponibilità centralizzata

## Obiettivo

Unificare la logica dei tre stati prodotto (`available`, `orderable`, `out_of_stock`) in utility condivise, con arricchimento stock Odoo sul BFF e consumo coerente in UI storefront.

## Stati e regole

| Stato | Condizione sintetica | `canAddToCart` | UI |
|-------|---------------------|----------------|-----|
| `available` | `qtyAvailable > 0` e qty richiesta coperta | sì | badge disponibile, low stock ≤10 |
| `orderable` | qty insufficiente o zero ma `isOrderable` | sì | copy lead time / data restock, restock notify se qty=0 |
| `out_of_stock` | `isUnrecoverable` o non ordinabile | no | CTA disabilitata, richiesta prodotto se unrecoverable |

### Utility client

**File:** `client/src/lib/product-availability.ts`

- `resolveAvailabilityData()` — bridge da campi legacy (`inStock`, `stockQty`) verso `ProductAvailabilityDataDTO`
- `getProductAvailabilityStatus()` — stati UI + label i18n + schema.org
- `isCatalogProductPurchasable()` — filtro catalogo “solo disponibili”
- `formatAvailabilityPrimaryLabel()`

### Utility server

**File:** `server/src/modules/catalog/availability.service.ts`

- `resolveVariantAvailability()`, `snapshotToAvailabilityData()`, `mergeAvailabilityData()`
- Usata da carrello e arricchimento stock

**File:** `server/src/modules/catalog/catalog-stock.enrich.ts`

- `enrichProductDetailWithStock()` — varianti + template via Odoo inventory
- `enrichProductCardsWithStock()` — batch card list
- `buildCartAvailabilityLookup()` — linee carrello

Attivo solo se `ODOO_ENABLED && isOdooConfigured()`.

## Integrazione UI

| Componente | Uso |
|------------|-----|
| `ProductCard.tsx` | `getProductAvailabilityStatus` + badge disponibile/ordinabile/esaurito |
| `ProductVariantPicker.tsx` | varianti out of stock |
| `TechnicalAddToCartButton.tsx` | gating add-to-cart |
| `TechnicalCatalogProductGrid.tsx` | label stock in griglia tecnica |
| `use-product-detail-state.ts` | selezione variante preferendo non-OOS, qty max, availability |
| `seo.ts` | JSON-LD availability |

## Restock notify

**File:** `server/src/modules/restock-notify/restock-notify.service.ts`

Accettato (201) quando prodotto ordinabile con qty=0 e non unrecoverable.  
Rifiutato (409 `PRODUCT_IN_STOCK`) se già disponibile in magazzino.

## Migrazione completata

- Nessuna occorrenza di `resolveProductAvailability` nel codebase
- Tutti i punti storefront usano `getProductAvailabilityStatus` + `resolveAvailabilityData`

## Gap / osservazioni runtime

1. **Enrichment Odoo in dev** — prodotti test tornano `inStock: false` dopo enrich (stock Odoo reale su tlb staging).
2. **Assenza `availability` su card Arfly raw** — finché Odoo non arricchisce, il client deriva stati da legacy/fallback orderable.
3. **Filtro “Solo disponibili”** — applicato post-fetch in `catalog.actions.ts`, non server-side.

## File principali

```
client/src/lib/product-availability.ts
server/src/modules/catalog/availability.service.ts
server/src/modules/catalog/catalog-stock.enrich.ts
server/src/modules/restock-notify/restock-notify.service.ts
client/src/hooks/use-product-detail-state.ts
client/src/components/product/ProductCard.tsx
```
