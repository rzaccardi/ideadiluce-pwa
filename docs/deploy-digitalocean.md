# Deploy su DigitalOcean (Idea di Luce PWA)

Guida per mettere online monorepo, database e (opzionale) storage media con **App Platform**.

## File nel repo

| File | Ambiente |
|------|----------|
| [`.do/platform-map.yaml`](../.do/platform-map.yaml) | **Mappa collegamenti** — solo topologia, no deploy |
| [`.do/GO-LIVE.md`](../.do/GO-LIVE.md) | **Mappa go-live** — piattaforma + sistemi annessi + checklist |
| [`.do/app.yaml`](../.do/app.yaml) | **Produzione** (`main`, Postgres `production: true`) |
| [`.do/app.staging.yaml`](../.do/app.staging.yaml) | Staging (`staging`, Postgres dev) |
| [`.do/secrets.production.env.example`](../.do/secrets.production.env.example) | Secret da impostare in UI |
| [`.do/README.md`](../.do/README.md) | Riferimento rapido |

## Architettura

Tre componenti **separati** nello stesso monorepo (ognuno con URL proprio `*.ondigitalocean.app`):

| Prodotto DO | Nome componente | Sorgente | Stack | URL |
|-------------|-----------------|----------|-------|-----|
| **Web Service** | `api` | `server/` | Express :8080, Prisma, Hub | `${api.PUBLIC_URL}` |
| **Web Service** | `shop` | `client/` | Next.js :3000 | `${shop.PUBLIC_URL}` (anche URL principale app) |
| **Static Site** | `admin` | `admin/` | Vite SPA → `admin/dist` | `${admin.PUBLIC_URL}` |
| **Managed PostgreSQL** | `db-ideadiluce-pwa` | — | PG 18, pool `ideadiluce-api`, schema `public` + `hub` | interno |

Lo spec usa `source_dir: /` (root monorepo) perché i build npm workspaces devono vedere `package.json` root, `client/`, `server/` e `admin/` insieme.

Costo indicativo EU `fra1`: API + shop ~10–20 €/mese, static site admin incluso, DB produzione ~15–30 €/mese — verifica prezzi aggiornati nel pannello.

## Setup produzione

### 1. Collega il repository

**Importante:** non usare l’auto-detect di DigitalOcean (rileva un solo componente Node). Serve lo spec esplicito.

**Opzione A — CLI (consigliata):**

```bash
doctl apps create --spec .do/app.yaml
```

**Opzione B — Control Panel:**

1. **Apps** → **Create App** → GitHub → repo `ideadiluce-pwa`
2. Seleziona **Use existing app spec** e conferma il path `.do/app.yaml`
3. Verifica che compaiano **3 componenti** (`api`, `shop`, `admin`) + database `db-ideadiluce-pwa`
4. Verifica `github.repo` e branch `main`

**Se l’app esiste già con un solo componente**, non sovrascrivere lo spec live con `.do/app.yaml` (perderebbe domini e secret). Scarica lo spec (`doctl apps spec get`) e allinea solo il blocco `databases:` al cluster `db-ideadiluce-pwa`.

### 2. Secret (Environment)

Copia l’elenco da [`.do/secrets.production.env.example`](../.do/secrets.production.env.example) e imposta i valori nella UI per ogni componente.

| Variabile | Componente | Obbligatoria |
|-----------|------------|--------------|
| `ODOO_CATALOG_API_KEY` | api | Sì (catalogo Odoo REST) |
| `ODOO_DB`, `ODOO_USERNAME`, `ODOO_PASSWORD` | api | Sì (ordini/stock XML-RPC) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | api | Sì se pagamenti live |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | shop (BUILD) | Sì se Stripe |
| `DIRECT_URL` | api (BUILD+RUN) | Sì per `prisma migrate deploy` (defaultdb:25060) |
| `SHIPPING_CREDENTIALS_KEY` | api | Consigliata (32+ char) |
| `ADMIN_SEED_*` | api | Solo primo deploy |

`DATABASE_URL` e `DIRECT_URL` sono secret (pool PgBouncer `ideadiluce-api` + connessione diretta `defaultdb:25060`). Non usare `${db-ideadiluce-pwa.DATABASE_URL}`: punta a defaultdb diretto e bypassa il pool.

### 3. Primo deploy

Attendi build verde su tutti e tre i componenti + DB. Annota:

- `https://api-….ondigitalocean.app`
- `https://shop-….ondigitalocean.app`
- `https://admin-….ondigitalocean.app`

### 4. Dati iniziali (non nel build_command)

Con tunnel verso il Postgres di produzione:

```bash
# Admin BO + pagine CMS
npm run db:seed --workspace=server

# Catalogo Hub (import Woo — può richiedere ore)
npm run hub:import
npm run hub:enrich
npm run hub:import-content
```

Non eseguire import massivi nel `build_command` di App Platform.

### 5. Stripe webhooks e wallet

Endpoint: `https://<api-….ondigitalocean.app>/api/v1/payments/webhook/stripe`

Eventi: `checkout.session.completed` (obbligatorio per finalizzare ordini PWA).

**Apple Pay:** in Stripe Dashboard aggiungi l’URL shop assegnato da DO.

**Chiavi:** `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` su `api`; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` su `shop` (BUILD). In locale: `npm run stripe:setup` e `npm run stripe:webhook`.

### 6. Verifica post-go-live

```bash
curl -s https://<api-….ondigitalocean.app>/health
curl -s "https://<api-….ondigitalocean.app>/api/v1/site/pages/home?locale=IT" | head
curl -s "https://<api-….ondigitalocean.app>/api/v1/catalog/products?pageSize=2&locale=IT" | head
```

Login admin BO → verifica CORS se shop e admin sono su domini diversi (già gestito in `server/src/app.ts` con `CLIENT_ORIGIN` + `ADMIN_ORIGIN`).

## Staging

App separata con spec dedicata:

```bash
doctl apps create --spec .do/app.staging.yaml
```

Branch `staging`, Postgres dev (`production: false`).

## CLI (`doctl`)

```bash
doctl apps create --spec .do/app.yaml
doctl apps spec get <APP_ID>
doctl apps logs <APP_ID> api --type run
```

## Media / Spaces (opzionale)

Catalogo attuale: URL immagini Woo/Odoo in DB — **Spaces non obbligatorio** per go-live.

Per upload futuri dall’admin: crea Space `fra1` + env `SPACES_*` su `api` (vedi `.env.example`).

## Limitazioni

- **Odoo** restano su `tlbdb.odoo.com` — solo variabili verso l’istanza esterna
- **Cookie sessione**: `trust proxy` già attivo su Express
- **Re-build shop** necessario dopo cambio `NEXT_PUBLIC_*`

## Riferimenti

- Variabili complete: [`.env.example`](../.env.example)
- Import Hub: [`docs/hub-production-import.md`](hub-production-import.md)
- README: [README.md](../README.md#deploy-es-digitalocean-app-platform)
