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

| Nome | Tipo | Sorgente | Build | URL |
|------|------|----------|-------|-----|
| `api` | Web Service | `server/` | `build:server` + migrazioni | `${api.PUBLIC_URL}` |
| `shop` | Web Service | `client/` | Next.js workspace | `${shop.PUBLIC_URL}` |
| `admin` | Static Site | `admin/` | Vite → `admin/dist` | `${admin.PUBLIC_URL}` |
| `postgres` | Managed DB | — | — | rete interna |

Tutti i componenti usano `source_dir: /` (root monorepo npm workspaces). L’`ingress` punta l’URL principale dell’app allo shop; api e admin hanno sottodomini dedicati.

**Attenzione:** se in DO vedi un solo componente, l’app è stata creata con auto-detect. Ricrea con `doctl apps create --spec .do/app.yaml` oppure `doctl apps update <APP_ID> --spec .do/app.yaml`.

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
