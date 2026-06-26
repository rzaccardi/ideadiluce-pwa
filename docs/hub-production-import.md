# Migrazione catalogo WooCommerce in staging/produzione

L'import **non** è incluso nel `build_command` di App Platform (evita timeout e dump enormi in CI).

## Prerequisiti

- VPN o IP allowlist verso il Postgres gestito DigitalOcean
- Dump SQL in `product-hub/import/` (non versionato)
- Variabili `DATABASE_URL` e `HUB_DATABASE_URL` puntate al DB target

## Sequenza consigliata

```bash
# 1. Schema hub
npm run hub:migrate

# 2. Import prodotti da dump Woo
npm run hub:import

# 3. Arricchimento metadati / immagini
npm run hub:enrich
npm run hub:patch-images

# 4. Contenuti lunghi e normalizzazione HTML
npm run hub:import-content
npm run hub:normalize-content
npm run hub:extract-specs

# 5. Mapping SKU → Odoo (con ODOO_ENABLED=true)
npm run hub:sync-odoo

# 6. Validazione
npm run hub:validate
```

## Post-import

- Verificare slug e SEO in admin (`/hub/products`)
- Controllare `GET /api/v1/catalog/products?pageSize=5`
- Eseguire smoke test: `npm run smoke:prod --workspace=server`

## Note

- In staging usare `.do/app.staging.yaml` (branch `staging`)
- Per produzione impostare `production: true` sul database in `.do/app.yaml`
