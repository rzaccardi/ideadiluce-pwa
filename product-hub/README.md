# Product Hub

PIM / catalogo importato da WooCommerce. Il BFF (`server/`) legge le tabelle Hub quando `HUB_CATALOG_ENABLED=true`.

## Setup rapido

```bash
npm run db:up
npm run hub:migrate
npm run hub:import
npm run hub:enrich          # gallery, attributi varianti (dump completo in import/)
npm run hub:import-content  # post_content HTML da dump completo
npm run hub:sync-odoo       # mappa SKU → odooTemplateId / odooVariantId (richiede Odoo attivo)
```

Con `HUB_CATALOG_ENABLED=true`, il BFF compone catalogo Hub + **prezzi/stock live** da Odoo quando i prodotti sono mappati (`hub:sync-odoo`). Il carrello salva `productRef` = ID template Odoo e `variantRef` = ID variante Odoo.
```

Esegui **un comando per riga** (non incollare commenti `# ...` sulla stessa riga: npm li interpreta come argomenti).

`HUB_DATABASE_URL` in `/.env` è opzionale: se manca, migrate/import usano `DATABASE_URL` con `schema=hub`.

Variabili nel file unificato `/.env` (root monorepo): `HUB_DATABASE_URL` con `schema=hub` (stesso Postgres del BFF, schema separato da `public` del server). Se omesso, il server e gli script hub derivano l’URL da `DATABASE_URL` sostituendo lo schema con `hub`.

## Contenuti

- **`api/`** — Prisma schema, client `@ideadiluce/hub-api`, script import
- **`import/`** — dump SQL (gitignored)
