# Report ottimizzazioni performance

## Fase 4

### Feature 1 — BE: Cart batch reprice + unified product resolve

**Prima:** `dtoFromCartId` e `checkStock` risolvevano ogni `productRef` due volte (lookup catalogo display/prezzo + lookup availability) con `resolveCatalogProduct` in parallelo duplicato.

**Dopo:** una sola `resolveProductMapForCartLines` per GET carrello completo; `buildCartAvailabilityLookup` accetta `preResolvedProducts`. Il reprice Odoo era già in batch (`resolveCartLineUnitPricesCents`, max 2 read Odoo).

**Impatto misurabile:** per un carrello con N righe uniche → da ~2N chiamate Arfly a ~N (stima −50% round-trip catalogo su GET/reprice).

**Test:** `cd server && npm run build && npm run test` — OK.
