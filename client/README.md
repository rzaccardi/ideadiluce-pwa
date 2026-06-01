# Client — frontend eCommerce headless

React 19, Vite 8, TypeScript, Tailwind 4, React Router 7, Valtio. Tutte le chiamate passano da **`api/client.ts`** verso il backend interno (`VITE_API_URL` + path `/api/v1/...`). **Nessuna** integrazione Odoo lato browser.

## Configurazione

```bash
cp ../.env.example ../.env   # dalla root del monorepo
```

- **`VITE_API_URL`**: origine del server API (es. `http://localhost:4000`). Se assente, si usa `VITE_API_BASE_URL`, poi il default locale `http://localhost:4000`.
- Il client invia sempre `credentials: 'include'` per i cookie di sessione (`sid`).

## Script

| Comando | Descrizione |
|--------|-------------|
| `npm run dev` | Vite dev server (porta 5173) |
| `npm run build` | `tsc` + build produzione |
| `npm run preview` | anteprima build |

Dalla root monorepo: `npm run dev:client`.

## Struttura (`src/`)

- **`app/`** — `App.tsx` (bootstrap `fetchMe` + `fetchCart`), `RequireAuth.tsx`
- **`api/`** — `client.ts` (GET/POST/PATCH/DELETE), `endpoints.ts` (contratto REST)
- **`features/*/`** — store Valtio + actions per dominio (`auth`, `catalog`, `product`, `wishlist`, `cart`, `checkout`); `account` / `orders` come placeholder di dominio
- **`components/`** — UI riutilizzabile (`Header`, `Container`, `TextInput`, `CartSummary`, …)
- **`pages/`** — schermate collegate alle route
- **`routes/router.tsx`** — definizione route
- **`types/`** — DTO allineati al backend

## Errori API

Il backend restituisce `{ error: { code, message, userMessage, retriable, correlationId } }`. `ApiRequestError` nel client espone `userMessage` per messaggi UI.

## Prossimi passi

- Allineare eventuali nuovi campi DTO quando il backend evolve.
- Aggiungere test E2E / Vitest per flussi carrello e checkout.
- Ottimizzare caricamento immagini e code-splitting per route.
