# Product Hub (legacy)

Schema Postgres `hub` nel monorepo. **Il catalogo prodotti non è più gestito qui**: i contenuti arrivano da Odoo via API Odoo catalog (`ODOO_CATALOG_*` sul server).

Rimane solo la tabella `UrlRedirect` per redirect URL legacy (import Woo storico).

## Migrazioni

```bash
npm run hub:migrate:dev   # sviluppo
npm run hub:migrate       # deploy
```

Variabile `HUB_DATABASE_URL` in `/.env` (opzionale: default `DATABASE_URL` con `schema=hub`).
