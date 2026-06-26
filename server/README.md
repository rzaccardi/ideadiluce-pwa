# Server — API proxy eCommerce headless

Backend **Express + TypeScript + Prisma + Zod**. Il frontend deve chiamare solo queste API; **Odoo** è integrato solo qui (`src/adapters/odoo/`), tramite **XML-RPC** ([Odoo 18 External API](https://www.odoo.com/documentation/18.0/developer/reference/external_api.html)) su `/xmlrpc/2/common` e `/xmlrpc/2/object`.

> **Nota:** un’integrazione basata su **JSON-2** (Odoo 19+) non è più l’implementazione attiva in questo repo; restano in `.env` solo `ODOO_BASE_URL` / `ODOO_API_KEY` come opzioni deprecate per compatibilità futura.

## Requisiti

- Node.js ≥ 20  
- PostgreSQL e variabile `DATABASE_URL`

## Configurazione

```bash
cp ../.env.example ../.env   # dalla root del monorepo
# compila DATABASE_URL, CLIENT_ORIGIN, ODOO_* se usi Odoo, ecc.
```

## Script

| Comando | Descrizione |
|--------|-------------|
| `npm run dev` | `tsx watch` (consigliato) |
| `npm run dev:nodemon` | nodemon + tsx |
| `npm run build` | emit in `dist/` |
| `npm start` | `node dist/server.js` |
| `npm run db:generate` | Prisma Client |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | schema sync senza migration (solo dev) |
| `npm run db:seed` | dati demo |

## Database

Prima esecuzione:

```bash
npx prisma migrate dev --name init
# oppure: npx prisma db push
npm run db:seed
```

Demo seed: `demo@example.com` / `password123`.

### Drift migrazione Product Hub (catalogo locale)

Se il DB locale contiene la migrazione `20260601160000_hub_catalog_init` (catalogo Product Hub applicato in passato sul DB del server) ma non è presente in `server/prisma/migrations`, Prisma segnala drift e tabelle legacy (`Product`, `Brand`, `Category`, …).

**Non usare `migrate reset` su DB con dati utili.** Procedura sicura (dev):

1. Rimuovere il record orfano dalla tabella `_prisma_migrations` (non è in stato *failed*, quindi `migrate resolve --rolled-back` non è applicabile):

   ```bash
   cd server
   node scripts/with-root-env.mjs db execute --schema prisma/schema.prisma --stdin <<'SQL'
   DELETE FROM "_prisma_migrations" WHERE migration_name = '20260601160000_hub_catalog_init';
   SQL
   ```

2. Applicare le migrazioni pendenti (include `20260626190000_drop_legacy_hub_catalog` che elimina le tabelle hub):

   ```bash
   npm run db:migrate:deploy
   ```

In produzione/staging: eseguire solo `migrate deploy` dopo il merge del branch con la migration di drop.

## Endpoint principali

- `GET /health` — liveness  
- Prefisso API: `/api/v1` (auth, catalog, cart, wishlist, checkout, orders, users, **integrations**)  

### Catalogo prodotti

`GET /api/v1/catalog/products` supporta paginazione lato backend, utile sia per infinite scroll sia per paginazione classica:

| Query | Default | Note |
|-------|---------|------|
| `category` | assente | Slug categoria opzionale. |
| `page` | `1` | Numero pagina, intero positivo. |
| `pageSize` | `24` | Massimo `60`. |

Risposta in envelope `{ data: ... }`:

```json
{
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 24,
    "total": 0,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Sessione guest/authenticated: cookie `sid` (nome da `SESSION_COOKIE_NAME`) con token opaco; nel DB è salvato solo **SHA-256** (`tokenHash`).

## Endpoint integrazione Odoo (tecnici)

Tutti sotto **`/api/v1/integrations/`**, protetti così:

- se `INTEGRATIONS_TOKEN` è valorizzato: header obbligatorio **`X-Integrations-Token`** uguale al valore in `.env`;
- altrimenti: basta **cookie di sessione** `sid` (guest o autenticato), per consentire il test checkout dal browser senza login obbligatorio.

| Metodo | Path | Scopo |
|--------|------|--------|
| GET | `/api/v1/integrations/odoo/ping` | `common.version`, `common.authenticate`, `execute_kw` minimo (`res.lang` `search_read`). Risposta include `versionMode: "odoo18-xmlrpc"`, `uid`, `notes`, `serverVersion`, … |
| GET | `/api/v1/integrations/odoo/doc-check` | Come ping + GET opzionale su `/doc` (senza API key; può essere HTML). |
| POST | `/api/v1/integrations/odoo/test-checkout` | Bridge: carrello locale → partner Odoo → `sale.order` → aggiorna `CheckoutSession` e `OdooCustomerMap` (vedi body Zod). |

Body **`test-checkout`** (JSON) — indirizzi con nome/cognome e CAP:

```json
{
  "cartId": "cuid-carrello",
  "email": "cliente@example.com",
  "billingAddress": {
    "firstName": "Mario",
    "lastName": "Rossi",
    "line1": "Via Roma 1",
    "line2": "",
    "city": "Milano",
    "postalCode": "20100",
    "country": "IT",
    "phone": "+39..."
  },
  "shippingAddress": { "...": "stessa shape" }
}
```

Risposta (envelope `{ data: ... }`): `success`, `odooPartnerId` / `odooSaleOrderId` come stringhe, `checkoutState`, `redirectUrl` (nullable), `rawDebugSummary` (requestMode, cartSnapshot, odooSummary, notes, correlationId, …).

Ogni chiamata XML-RPC Odoo viene registrata in **`IntegrationLog`** (campi `requestPayloadRedacted`, `responsePayloadRedacted`, `durationMs`, `correlationId`, `success`, `operation`, `service=odoo`).

## Endpoint Odoo backoffice

Tutti sotto **`/api/v1/admin/odoo/`** e protetti dal login backoffice (`admin_sid`):

| Metodo | Path | Scopo |
|--------|------|--------|
| GET | `/api/v1/admin/odoo/status` | Stato configurazione Odoo (`enabled`, `configured`, modalità XML-RPC). |
| GET | `/api/v1/admin/odoo/orders` | Storico ordini Odoo confermati/completati da `sale.order` (`state=sale/done`). Query: `page`, `pageSize`, `q`, `email`, `partnerId`, `state`, `days`. |
| GET | `/api/v1/admin/odoo/quotations` | Preventivi Odoo da `sale.order` (`state=draft/sent`) con la stessa query degli ordini. |
| GET | `/api/v1/admin/odoo/quotations/:id` | Dettaglio preventivo Odoo: partner, righe, totali, note e date (`validityDate`, `commitmentDate`). |
| GET | `/api/v1/admin/odoo/pricelists` | Listini `product.pricelist` paginati. Query: `page`, `pageSize`, `q`, `active`. |
| POST | `/api/v1/admin/odoo/pricelist-assignments` | Assegna `property_product_pricelist` su `res.partner`; body con `pricelistId` e uno tra `partnerId`, `email`, `userId`. Se passa `userId`, aggiorna anche `User.odooPricelistId`. |

Se Odoo non è configurato, le letture admin rispondono con pagina vuota e `configured=false`; le scritture richiedono invece configurazione completa e falliscono con errore applicativo.

Lo storico ordini utente (`GET /api/v1/orders`) mantiene cache/PWA locale e aggiunge, quando possibile, gli ordini confermati letti live da Odoo usando `OdooCustomerMap` o l’email dell’utente.

## Risposte errore

Formato unificato:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Internal readable message",
    "userMessage": "Friendly message for frontend",
    "retriable": false,
    "correlationId": "uuid",
    "details": {}
  }
}
```

I dettagli grezzi Odoo **non** sono esposti al client; errori upstream vengono mappati in `ApiErrorDTO` (es. `ODOO_UPSTREAM_ERROR`, `ODOO_MISCONFIGURED`).

## Variabili Odoo (riepilogo)

| Variabile | Significato |
|------------|-------------|
| `ODOO_ENABLED` | `true`/`false` — abilita catalogo live e pipeline Odoo negli adapter. |
| `ODOO_URL` | Origine Odoo incluso path di deploy (es. `https://www.esempio.it/odoo`). I path XML-RPC sono `<ODOO_URL>/xmlrpc/2/common` e `.../object`. |
| `ODOO_DB` | Nome database Odoo (come in login). |
| `ODOO_USERNAME` | Login utente tecnico (diritti minimi consigliati). |
| `ODOO_PASSWORD` | Password utente. |
| `ODOO_TIMEOUT_MS` | Timeout richieste XML-RPC / HTTP di servizio. |
| `ODOO_CATALOG_LANG` | Contesto lingua ORM catalogo (default `it_IT`). |
| `ODOO_PRODUCT_DOMAIN` | JSON: domain `product.template` (default `[["sale_ok","=",true]]`). |
| `ODOO_CATEGORY_DOMAIN` | JSON: domain `product.public.category` (default `[]`). |
| `ODOO_BASE_URL` | **Deprecato:** fallback se `ODOO_URL` assente. |
| `ODOO_API_KEY` | **Deprecato:** solo per un ipotetico ritorno a JSON-2 Odoo 19+; non usato dall’XML-RPC attuale. |
| `CHECKOUT_REDIRECT_BASE` | Fallback legacy per redirect manuali; il checkout PWA proprietario usa `/payments/*`. |
| `NEXI_ENABLED` / `NEXI_ENV` | Abilita adapter Nexi (`sandbox` o `production`) per carte e Google Pay se supportato dal contratto. |
| `NEXI_API_KEY` / `NEXI_TERMINAL_ID` | Credenziali Nexi lato server. Non esporre al client. |
| `NEXI_CHECKOUT_BASE_URL` | Base opzionale per flusso hosted/redirect Nexi quando il metodo richiede uscita dal browser PWA. |
| `PAYPAL_ENABLED` / `PAYPAL_ENV` | Abilita adapter PayPal (`sandbox` o `production`). |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Credenziali PayPal server-side. |
| `PAYPAL_CHECKOUT_BASE_URL` | Base opzionale per redirect PayPal sandbox/produzione. |
| `BANK_TRANSFER_HOLDER` / `BANK_TRANSFER_IBAN` / `BANK_TRANSFER_BANK_NAME` | Dati mostrati nella PWA per il bonifico bancario. |
| `INTEGRATIONS_TOKEN` | Token opzionale per gli endpoint `/integrations/*`. |

### Test rapidi (dopo `npm run dev`)

Supponendo cookie `sid` da browser loggato **oppure** header `X-Integrations-Token`:

```bash
curl -sS -H "Cookie: sid=..." http://localhost:4000/api/v1/integrations/odoo/ping
curl -sS -H "Cookie: sid=..." http://localhost:4000/api/v1/integrations/odoo/doc-check
```

`test-checkout` (esempio):

```bash
curl -sS -X POST http://localhost:4000/api/v1/integrations/odoo/test-checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: sid=..." \
  -d '{"cartId":"...","email":"a@b.it","billingAddress":{"firstName":"M","lastName":"R","line1":"Via 1","city":"MI","postalCode":"20100","country":"IT"},"shippingAddress":{"firstName":"M","lastName":"R","line1":"Via 1","city":"MI","postalCode":"20100","country":"IT"}}'
```

## Checkout PWA proprietario

Endpoint principali:

```bash
POST /api/v1/checkout/start
POST /api/v1/shipping/quotes
POST /api/v1/shipping/select
POST /api/v1/payments/create-session
POST /api/v1/payments/confirm
GET  /api/v1/payments/stripe/return?session_id=|order_id=
POST /api/v1/payments/webhook/stripe
POST /api/v1/payments/webhook/nexi
POST /api/v1/payments/webhook/paypal
GET  /api/v1/admin/shipping/zones  (header X-Admin-Token)
POST /api/v1/orders/:id/abandon
GET  /api/v1/orders/:id/status
```

Stati interni:

- `PwaOrderStatus`: `cart_created`, `checkout_started`, `payment_started`, `payment_pending`, `paid`, `payment_failed`, `abandoned`, `cancelled`, `confirmed`, `completed`.
- `PwaPaymentStatus`: `not_started`, `created`, `pending`, `authorized`, `captured`, `failed`, `cancelled`, `refunded`.
- `PwaPaymentMethod`: `stripe`, `bank_transfer`, (+ legacy `card_nexi`, `paypal`, `google_pay`).

### Stripe (Payment Element)

- `STRIPE_ENABLED=true`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Client: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (o `STRIPE_PUBLISHABLE_KEY` servita da `GET /api/v1/payments/stripe/config`)
- Verifica locale: `npm run stripe:setup` (root monorepo)
- Webhook locale: `npm run stripe:webhook` oppure `stripe listen --forward-to localhost:4000/api/v1/payments/webhook/stripe --api-key $STRIPE_SECRET_KEY`
- Checkout Session `ui_mode: elements` → `clientSecret` per Payment Element in PWA (carte + Apple/Google Pay via Express Checkout)
- Bonifico: `BANK_TRANSFER_HOLDER`, `BANK_TRANSFER_IBAN`, `BANK_TRANSFER_BANK_NAME`

### Spedizioni

- Zone/metodi in DB (seed automatico: Italia flat + free + DHL/FedEx live stub)
- `DHL_ENABLED` / `FEDEX_ENABLED` + credenziali opzionali; `DHL_RATES_URL` / `FEDEX_RATES_URL` per API custom
- BO: workspace `admin/` su porta 5174, token `ADMIN_API_TOKEN`

Sincronizzazione Odoo:

- `checkout/start` crea/aggiorna cliente e `sale.order`.
- Gli stati PWA vengono scritti su campi custom `x_pwa_*` se presenti su `sale.order`.
- Se i campi custom non esistono, il sync non fallisce: aggiorna almeno `client_order_ref` quando disponibile.
- A pagamento catturato, il backend prova a confermare il `sale.order` con `action_confirm`.

Nota provider:

- Bonifico è operativo come metodo offline/pending.
- Nexi, Google Pay e PayPal hanno adapter server-side e contratti API predisposti; le chiamate reali vanno collegate alle credenziali/API sandbox del provider scelto. Fino ad allora, se non configurati, rispondono con `PAYMENT_PROVIDER_NOT_CONFIGURED`.

## Cosa è reale vs mock / placeholder

| Area | Stato |
|------|--------|
| **Catalogo** | Con `ODOO_ENABLED=true` e env XML-RPC complete: categorie/prodotti da `product.public.category`, `product.template`. Se env incomplete con flag on: log di warning e **fallback mock**. |
| **Client Odoo** | `xmlrpc` → `common.authenticate`, `execute_kw` su `/xmlrpc/2/object`, timeout, cache `uid`, `IntegrationLog`. |
| **Customer** | `res.partner` search/create + persistenza **`OdooCustomerMap`**. |
| **Ordine test-checkout** | `sale.order` `create` con righe da varianti risolte via slug su `product.template`. |
| **Checkout PWA** | Flusso interno con `PwaOrder` / `PwaPayment`, scelta metodo, esito e sync stato verso Odoo. |
| **Provider pagamento** | Bonifico operativo; Nexi/PayPal/Google Pay predisposti con adapter e env, da collegare alle API reali del contratto. |
| **Stato ordine / webhook** | Stato PWA disponibile da `/orders/:id/status`; webhook Nexi/PayPal accettati come entrypoint e da completare con verifica firma specifica provider. |
| **Reprice** | Stime locali (IVA + spedizione esempio). |

### Troubleshooting XML-RPC

- Errori **Access Denied**: utente, DB (`ODOO_DB`) o password; controlla anche permessi su `sale.order` / `product.template`.  
- **`create` / `write`**: nomi campi dipendono dai moduli (es. `website_slug`). Dettagli redatti in **`IntegrationLog`**.  
- Aggiusta **`ODOO_PRODUCT_DOMAIN`** se i prodotti non compaiono (`is_published` richiede modulo website).

## Google Places — autocomplete indirizzi checkout

Il backend espone proxy sicuro (chiave **non** nel browser):

| Endpoint | Descrizione |
|----------|-------------|
| `GET /api/v1/address/status` | `{ enabled, provider: "google" \| "mapbox" \| null }` |
| `GET /api/v1/address/search?q=via+roma&country=IT` | Suggerimenti (min 3 caratteri) |
| `GET /api/v1/address/resolve?id=PLACE_ID&provider=google` | Dettaglio indirizzo strutturato |

### Configurazione Google Cloud

1. [Google Cloud Console](https://console.cloud.google.com/) → progetto con **fatturazione** attiva.
2. Abilita **Places API (New)** (non la legacy “Places API”).
3. **API e servizi → Credenziali** → Crea chiave API.
4. Restrizioni consigliate:
   - **Applicazioni** → IP del server (produzione) oppure nessuna restrizione in dev locale.
   - **API** → limita a **Places API (New)**.
5. Nel `.env` della root monorepo:

```env
GOOGLE_MAPS_API_KEY=AIza...
```

6. Riavvia il server. In log dovresti vedere: `Google Places autocomplete attivo`.

Placeholder come `la_tua_chiave` vengono **ignorati** (autocomplete disattivato).

### Mapbox (alternativa)

```env
MAPBOX_ACCESS_TOKEN=pk....
```

Se sono impostate entrambe le chiavi, ha priorità **Google**.

## Checklist produzione

1. `STRIPE_ENABLED` + chiavi live + webhook endpoint HTTPS pubblico.
2. `SHIPPING_CREDENTIALS_KEY` (32+ caratteri) + credenziali DHL/FedEx nel BO admin (cifrate in DB).
3. `ADMIN_API_TOKEN` forte; admin su rete interna o VPN.
4. `ODOO_ENABLED` + campi `qty_available` / `weight` su `product.product`.
5. Prodotto servizio **Spedizione** in Odoo per righe delivery.
6. `CLIENT_ORIGIN` e CORS allineati al dominio PWA.
7. Test E2E: quote → checkout → Stripe test card → ordine Odoo confermato.

## Prossimi passi consigliati

1. Allineare slug carrello ↔ `product.template` in Odoo (o campo dedicato per ref esterno).  
2. Collegare adapter Nexi/PayPal alle API sandbox reali e verificare firma webhook.  
3. Creare in Odoo i campi custom `x_pwa_*` per rendere visibili agli operatori gli stati funnel/pagamento.
