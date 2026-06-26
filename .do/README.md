# DigitalOcean App Platform — Idea di Luce

| File | Uso |
|------|-----|
| [`platform-map.yaml`](platform-map.yaml) | **Mappa collegamenti** — solo topologia, niente deploy/env/secret |
| [`GO-LIVE.md`](GO-LIVE.md) | **Mappa go-live** — architettura, sistemi annessi, checklist |
| [`app.yaml`](app.yaml) | **Produzione** — spec deploy completo (`main`) |
| [`app.staging.yaml`](app.staging.yaml) | Staging — spec deploy (`staging`) |
| [`secrets.production.env.example`](secrets.production.env.example) | Checklist secret da incollare nella UI |

## Deploy rapido

```bash
# CLI (richiede doctl autenticato)
doctl apps create --spec .do/app.yaml
doctl apps list
doctl apps update <APP_ID> --spec .do/app.yaml

# Oppure: Control Panel → Create App → GitHub → "Use existing app spec"
```

## Componenti

| Nome | Tipo | Build | Note |
|------|------|-------|------|
| `api` | Web Service | `build:server` + migrazioni Prisma + hub | Porta 8080, `/health` |
| `shop` | Web Service | Next.js `client` | Porta 3000, rewrite `/api` → BFF |
| `admin` | Static Site | Vite `admin/dist` | SPA con catchall |
| `postgres` | Managed DB | — | Schema `public` (BFF) + `hub` (catalogo) |

## Checklist post-deploy

1. Impostare secret da `secrets.production.env.example`
2. Annotare gli URL `*.ondigitalocean.app` assegnati da DO (shop / api / admin)
3. Eseguire seed admin + CMS (tunnel `DATABASE_URL`):
   ```bash
   npm run db:seed --workspace=server
   ```
4. Import catalogo Hub (una tantum o job esterno):
   ```bash
   npm run hub:import && npm run hub:enrich
   ```
5. Webhook Stripe → `https://<api-….ondigitalocean.app>/api/v1/payments/webhook/stripe`

Guida completa: [`docs/deploy-digitalocean.md`](../docs/deploy-digitalocean.md)
