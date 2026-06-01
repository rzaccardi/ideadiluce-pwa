# ideadiluce-pwa — monorepo eCommerce headless

Frontend **React + Vite + Tailwind + Valtio** e backend **Node (Express) + Prisma**. Il client parla **solo** con l’API interna (`/api/v1`). **Odoo** (o altro ERP) va integrato **esclusivamente** nel server tramite gli adapter in `server/src/adapters/odoo/`.

## Requisiti

- Node.js **≥ 20**
- PostgreSQL **≥ 14** (URL in `DATABASE_URL`)

## Installazione

```bash
npm install
cp .env.example .env
```

Un solo file **`.env` nella root** del monorepo (come su DigitalOcean App Platform): server, client Vite, admin e product-hub leggono solo da lì. Compila almeno `DATABASE_URL`; poi Odoo, Stripe (`VITE_STRIPE_PUBLISHABLE_KEY` + chiavi server), DHL/FedEx e `ADMIN_API_TOKEN` per produzione.

## Database (Prisma)

Dalla root del monorepo:

```bash
npm run db:migrate --workspace=server
# oppure sviluppo rapido:
# npm run db:push --workspace=server
```

Genera il client (es. dopo pull):

```bash
npm run db:generate --workspace=server
```

I comandi Prisma caricano automaticamente `/.env` dalla root.

Seed opzionale (utente demo + ordine in cache):

```bash
npm run db:seed --workspace=server
```

Credenziali seed: `demo@example.com` / `password123`.

## Sviluppo locale

Due terminali oppure un unico comando:

```bash
npm run dev
```

- Client: http://localhost:5173 — `VITE_API_BASE_URL` deve puntare al backend (default `http://localhost:4000`).
- API: http://localhost:4000 — `GET /health`, prefisso API `http://localhost:4000/api/v1/...`

Script utili:

| Script            | Descrizione              |
| ----------------- | ------------------------ |
| `npm run dev`     | client + server (parallel) |
| `npm run dev:client` | solo Vite             |
| `npm run dev:server` | solo Express + tsx    |
| `npm run build`   | build client + server    |

## Struttura

```
/
├── client/          # PWA / shop UI
├── server/          # API proxy, sessioni, carrelli, Prisma
├── package.json     # workspaces npm
└── README.md
```

### Backend (`server/src`)

- `modules/*` — route, controller, service, repository per dominio
- `adapters/odoo/*` — integrazione **Odoo 18 XML-RPC** (`/xmlrpc/2/common`, `/xmlrpc/2/object`); vedi `server/README.md`
- `routes/v1` — montaggio API versionate
- `prisma/schema.prisma` — modelli applicativi (utenti, carrelli, checkout, log, …)
- `openapi/openapi.yaml` — scheletro OpenAPI (da espandere)

### Frontend (`client/src`)

- `api/` — client HTTP centralizzato (`credentials: 'include'` per cookie di sessione)
- `stores/*` — stato Valtio + `*.actions.ts`
- `features/*` — re-export verso moduli (estendibile)
- `pages/`, `layouts/`, `components/`

## Deploy (es. DigitalOcean App Platform)

**Setup automatico da repo:** file [`.do/app.yaml`](.do/app.yaml) + guida [docs/deploy-digitalocean.md](docs/deploy-digitalocean.md).

Linee guida:

1. **Due componenti** (o più): static site / SPA dal `client/dist` e **Web Service** per `server`.
2. **Build**: nella root, `npm ci` (o `npm install`) poi `npm run build`.
3. **Avvio server**: dalla root `node server/dist/server.js` oppure `npm run start --workspace=server` (working directory `server` se necessario).
4. **Variabili**: `DATABASE_URL`, `NODE_ENV=production`, `CLIENT_ORIGIN` = URL pubblico del frontend, eventuali `ODOO_*` e `CHECKOUT_REDIRECT_BASE`.
5. **Migrazioni**: eseguire `prisma migrate deploy` nel passo di release del servizio Node (con `server` come cwd).

Non hardcodare URL locali in produzione: usare sempre env.

## Prossimi step (Odoo)

1. Implementare `odooClient.ts` con auth e `IntegrationLog`.
2. Sostituire i mock in `odooCatalogAdapter` con prodotti/categorie reali.
3. Popolare `OdooCustomerMap` da `odooCustomerAdapter` alla registrazione.
4. Collegare checkout redirect e webhook pagamenti (`WebhookEvent`, `odooPaymentAdapter`).
5. Worker per `AbandonedCartEvent` (vedi `server/src/jobs/abandonedCart.job.ts`).
