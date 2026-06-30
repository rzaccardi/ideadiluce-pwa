# AGENTS.md

## Cursor Cloud specific instructions

Monorepo eCommerce headless **ideadiluce-pwa** (npm workspaces). Servizi:

| Servizio | Workspace | Porta dev | Avvio |
| -------- | --------- | --------- | ----- |
| API (Express + Prisma) | `server` | 4000 | `npm run dev:server` (avvia anche Postgres via Docker) |
| Shop (Next.js) | `client` | 5173 | `npm run dev:client` (richiede API attiva) |
| Backoffice admin (Vite) | `admin` | 5174 | `npm run dev:admin` (richiede API attiva) |
| Hub utilities | `product-hub/api` | — | libreria, nessun server |

Comandi aggregati dalla root: `npm run dev` (shop + API + admin), `npm run dev:shop` (shop + API). Vedi `README.md` per l'elenco completo.

### Postgres / Docker (non ovvio)
- Il DB gira in Docker (`docker-compose.yml`): Postgres 16 su host **5433** → container 5432. `npm run dev:server` esegue `docker compose up -d --wait` automaticamente.
- Docker è installato e il daemon è configurato con `fuse-overlayfs` + `containerd-snapshotter: false` (necessario con Docker 29 in questo ambiente). Se `docker` non risponde dopo un riavvio del pod, avvia il daemon manualmente: `sudo bash -c 'nohup dockerd >/var/log/dockerd.log 2>&1 &'` e poi `sudo chmod 666 /var/run/docker.sock`.
- In alternativa al solo DB: `npm run db:up` (avvia Postgres) / `npm run db:down`.

### File `.env` (non ovvio — gotcha importante)
- Tutto il monorepo legge un **unico `.env` nella root** (gitignored). Crearlo con `cp .env.example .env`.
- **GOTCHA:** lo schema Zod in `server/src/config/env.ts` valida `SMTP_FROM` e `PAID_SYNC_ALERT_EMAIL` come `.email().optional()`. La stringa **vuota** presente in `.env.example` per queste due variabili **fa fallire la validazione** (e quindi l'avvio del server e il seed). Dopo `cp .env.example .env`, **commentare/rimuovere** le righe `SMTP_FROM=` e `PAID_SYNC_ALERT_EMAIL=` (lasciarle non impostate → `undefined` → valido).

### Database (Prisma)
- Prima esecuzione su DB vuoto: `npm run db:migrate:deploy --workspace=server` (applica tutte le migrazioni senza prompt interattivi; preferire `deploy` a `migrate dev` per evitare interattività).
- Seed dati demo: `npm run db:seed --workspace=server`. Crea utente shop `demo@example.com` / `password123` e utente backoffice `admin@ideadiluce.local` / `admin123456`.
- Il client Prisma è generato (`npm run db:generate --workspace=server`); rigenerarlo dopo un reinstall delle dipendenze.

### Lint / Test / Build
- Test: `npm run test --workspace=server` (vitest) e `npm run test --workspace=client` (vitest).
- Lint: `npm run lint --workspace=client` (eslint). **Nota:** il repo ha attualmente alcuni errori di lint preesistenti nel codice del client (non legati al setup).
- Build: `npm run build` (client + server).

### Catalogo vuoto in locale (atteso)
- Senza credenziali Odoo/Arfly (`ODOO_ENABLED`/`ARFLY_CATALOG_ENABLED=false` di default), il catalogo storefront è **vuoto**: `GET /api/v1/catalog/products` ritorna `items: []`. È il comportamento atteso in dev senza ERP. Il login backoffice e le API basate su DB funzionano comunque.
