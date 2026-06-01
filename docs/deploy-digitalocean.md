# Deploy su DigitalOcean (Idea di Luce PWA)

Guida per mettere online monorepo, database e (opzionale) storage media con **App Platform** — il prodotto giusto per questo stack, senza gestire server Linux a mano.

## Cosa usare su DigitalOcean

| Prodotto | Ruolo | Note |
|----------|--------|------|
| **App Platform** | API Node + PWA statica + admin statico | Definito in [`.do/app.yaml`](../.do/app.yaml) |
| **Managed PostgreSQL** | DB BFF (`public`) + catalogo hub (`hub`) | Creato dall’app spec come componente `postgres` |
| **Spaces** (opzionale) | CDN per file caricati in futuro | **Oggi** le immagini catalogo sono URL esterni (import Woo); Spaces serve solo se aggiungi upload |
| ~~Droplet~~ | — | Non necessario salvo esigenze speciali (Odoo self-hosted, job pesanti) |

Costo indicativo di partenza (EU `fra1`): API ~5–12 €/mese, 2 static site inclusi nel piano app, DB dev ~15 €/mese — verifica i prezzi aggiornati nel pannello.

## Setup “repo-aware” (già pronto nel progetto)

Il file **`.do/app.yaml`** è la *App Spec*: quando colleghi GitHub, DigitalOcean può importarla e creare automaticamente:

- **api** — Web Service Node (Express, porta `8080`, health `/health`)
- **shop** — Static site da `client/dist` (SPA con `catchall_document`)
- **admin** — Static site da `admin/dist`
- **postgres** — PostgreSQL 16 gestito

Build e migrazioni Prisma (server + schema `hub`) partono nel `build_command` del servizio API.

### Passi operativi

1. **GitHub** — push del codice (branch `main` o quello che usi).

2. **DigitalOcean** → **Apps** → **Create App** → scegli il repository.

3. Se compare **“App spec detected”** / **Use existing app spec** → conferma (legge `.do/app.yaml`).

4. Modifica in `.do/app.yaml` (o nella UI, poi sincronizza):
   ```yaml
   github:
     repo: tua-org/ideadiluce-pwa
     branch: main
   ```

5. **Environment variables** (Settings → la tua app → Environment) — aggiungi i secret **non** committati:

   | Variabile | Componente | Note |
   |-----------|------------|------|
   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | api | + `STRIPE_ENABLED=true` |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | shop | scope **BUILD_TIME** |
   | `ODOO_*` | api | se ERP attivo |
   | `ADMIN_API_TOKEN`, `VITE_ADMIN_TOKEN` | api + admin | admin spedizioni |
   | `INTEGRATIONS_TOKEN`, `VITE_INTEGRATIONS_TOKEN` | api + shop | se usi token integrazioni |
   | DHL / FedEx / bonifico | api | come in `.env.example` |

   `DATABASE_URL` è già collegato a `${postgres.DATABASE_URL}` nell’app spec.

6. **Primo deploy** — attendi build verde. Annota gli URL `*.ondigitalocean.app` di `api`, `shop`, `admin`.

7. **Domini custom** (consigliato in produzione):
   - `shop.tuodominio.it` → componente **shop**
   - `api.tuodominio.it` → componente **api**
   - `admin.tuodominio.it` → componente **admin**
   - Aggiorna `CLIENT_ORIGIN` e `CHECKOUT_REDIRECT_BASE` con l’URL reale dello shop (non solo `${shop.PUBLIC_URL}` se usi dominio custom).

8. **Dati catalogo** — da locale (con `DATABASE_URL` di produzione in VPN/tunnel) o da un job one-off:
   ```bash
   npm run hub:migrate
   npm run hub:import
   npm run hub:enrich
   ```
   Non eseguire import massivi nel `build_command` di App Platform.

9. **Stripe webhooks** — endpoint pubblico: `https://api.tuodominio.it/api/v1/...` (vedi route webhook nel server).

## Media / immagini

- **Catalogo attuale**: immagini in DB come URL (es. `ideadiluce.com/wp-content/uploads/...`). Non serve Spaces per andare live.
- **Upload futuri** (PDF ordini, foto prodotto caricate dall’admin):
  1. Crea un **Space** (es. `fra1`, CDN abilitato).
  2. Aggiungi env su **api**: `SPACES_KEY`, `SPACES_SECRET`, `SPACES_BUCKET`, `SPACES_ENDPOINT`, `SPACES_CDN_URL`.
  3. Implementa adapter S3-compatible nel server (non ancora nel repo).

## Alternative CLI (`doctl`)

```bash
doctl apps create --spec .do/app.yaml
doctl apps update <APP_ID> --spec .do/app.yaml
```

Utile per CI/CD senza passare dalla UI.

## Produzione vs sviluppo

Nell’app spec, `postgres.production: false` crea un DB “dev”. Per produzione:

- imposta `production: true` e un `size` adeguato nel pannello o nello spec;
- abilita backup e connection pool se il traffico cresce;
- valuta `instance_count` / `instance_size_slug` più alti per **api**.

## Limitazioni da tenere a mente

- **CORS**: `CLIENT_ORIGIN` accetta una sola origine; con admin su dominio diverso potrebbe servire estendere `server/src/app.ts`.
- **Cookie di sessione**: dietro il proxy DO, in produzione potrebbero servire `trust proxy` e flag `secure` sui cookie (verifica login guest/checkout).
- **Odoo**: resta sul tuo ERP (cloud o altro hosting), non su questo deploy — solo variabili `ODOO_*` verso l’istanza esterna.

## Riferimenti nel repo

- Variabili: [`.env.example`](../.env.example)
- Deploy generico: [README.md](../README.md#deploy-es-digitalocean-app-platform)
- API: [server/README.md](../server/README.md)
