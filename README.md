# ideadiluce-pwa — monorepo eCommerce headless

Frontend **Next.js + React + Tailwind + Valtio** e backend **Node (Express) + Prisma**. Il client parla **solo** con l’API interna (`/api/v1`). **Odoo** (o altro ERP) va integrato **esclusivamente** nel server tramite gli adapter in `server/src/adapters/odoo/`.

## Requisiti

- Node.js **≥ 20**
- PostgreSQL **≥ 14** (URL in `DATABASE_URL`)

## Installazione

```bash
npm install
cp .env.example .env
```

Un solo file **`.env` nella root** del monorepo (come su DigitalOcean App Platform): server, client Next.js, admin e product-hub leggono solo da lì. Compila almeno `DATABASE_URL`; poi Odoo, Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — verifica con `npm run stripe:setup`), DHL/FedEx e `ADMIN_API_TOKEN` per produzione.

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

### Shop (frontend client)

Per lavorare sullo **shop Next.js** servono **Postgres + API + client**. Dalla root:

```bash
npm run dev:shop
```

Apri **http://localhost:5173**

Il comando avvia in parallelo:
- **client** — Next.js dev server (porta **5173**)
- **server** — API Express (porta **4000**; avvia anche Postgres via Docker se non è già in esecuzione)

In `.env` (root) verifica almeno:

```bash
CLIENT_ORIGIN=http://localhost:5173
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
DATABASE_URL=postgresql://ideadiluce:ideadiluce_dev@localhost:5433/ideadiluce?schema=public
```

In dev il browser chiama `/api/...` sullo stesso host; Next.js fa **rewrite** verso `API_URL` (vedi `client/next.config.ts`).

### Stack completo (shop + admin + API)

```bash
npm run dev
```

| Servizio | URL |
| -------- | --- |
| **Shop (client)** | http://localhost:5173 |
| **Admin (backoffice)** | http://localhost:5174 |
| **API** | http://localhost:4000 — `GET /health`, prefisso `http://localhost:4000/api/v1/...` |

### Script utili

| Script | Descrizione |
| ------ | ----------- |
| `npm run dev:shop` | **shop + API** (caso più comune per il FE) |
| `npm run dev` | shop + API + admin |
| `npm run dev:client` | solo Next.js shop (:5173) — richiede API già avviata |
| `npm run dev:server` | solo Express + Postgres Docker |
| `npm run dev:admin` | solo backoffice Vite (:5174) — richiede API già avviata |
| `npm run db:up` | avvia solo Postgres (Docker) |
| `npm run build` | build client + server |
| `npm run start:shop` | shop in modalità produzione (porta 3000, dopo `build:client`) |

### Backoffice admin (login)

1. In `.env`: `ADMIN_ORIGIN=http://localhost:5174` (per CORS con cookie di sessione).
2. Migrazioni + seed: `npm run db:migrate --workspace=server` e `npm run db:seed --workspace=server`.
3. Utente demo seed: `admin@ideadiluce.local` / `admin123456` (override con `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`).
4. Altri utenti: `npm run admin:create-user --workspace=server -- email@azienda.it "passwordSicura" "Nome"`.
5. Apri http://localhost:5174/login — dopo l’accesso: catalogo Hub su `/hub/products`.

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

**Setup automatico da repo:** [`.do/app.yaml`](.do/app.yaml) (produzione) + [`.do/app.staging.yaml`](.do/app.staging.yaml) + guida [docs/deploy-digitalocean.md](docs/deploy-digitalocean.md).

Linee guida:

1. **Tre componenti** (o più): **Web Service** Next.js per lo shop, **Web Service** per `server`, static site per `admin`.
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
