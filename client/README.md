# Client — frontend eCommerce headless (Next.js)

React 19, Next.js 15 App Router, TypeScript, Tailwind 4, Valtio. Tutte le chiamate passano da **`api/browser.ts`** verso il backend interno (`NEXT_PUBLIC_API_URL` + path `/api/v1/...`). In dev, Next.js fa rewrite di `/api` verso `API_URL` (default `http://localhost:4000`).

## Configurazione

```bash
cp ../.env.example ../.env   # dalla root del monorepo
```

- **`API_URL`**: origine API per fetch SSR server-side (es. `http://localhost:4000`)
- **`NEXT_PUBLIC_API_URL`**: origine API per fetch browser in produzione
- Il client invia sempre `credentials: 'include'` per i cookie di sessione (`sid`)

## Script

| Comando | Descrizione |
|--------|-------------|
| `npm run dev` | Next.js dev server (porta 5173) |
| `npm run build` | build produzione |
| `npm run start` | server Node produzione (porta 3000) |

Dalla **root** del monorepo (consigliato — avvia anche l’API):

```bash
npm run dev:shop    # shop + API → http://localhost:5173
npm run dev:client  # solo shop (API deve essere già in esecuzione)
```

### Service worker legacy (ex Vite PWA)

Se in console vedi errori Workbox / `/@vite/client` / `/src/main.tsx` 404, il browser sta usando un **service worker vecchio** ancora registrato su `localhost:5173`. Il client Next.js include cleanup automatico (`public/sw.js`); di solito basta **ricaricare la pagina** (o chiudere e riaprire la tab).

Se resti bloccato: Chrome DevTools → **Application** → **Service Workers** → **Unregister**, poi **Clear site data** e ricarica.

## Struttura (`src/`)

- **`app/`** — App Router (route groups `(storefront)` / `(fullscreen)`), middleware locale, layout
- **`views/`** — componenti pagina client-side (ex `pages/`)
- **`api/`** — `request.ts`, `browser.ts`, `server.ts`, `endpoints.ts`
- **`features/*/`** — store Valtio + actions per dominio
- **`components/`** — UI riutilizzabile
- **`lib/`** — locale, SEO, server-catalog, navigation (compat React Router)
- **`providers.tsx`** — bootstrap sessione + LocaleProvider

## SEO

Le pagine pubbliche (home, catalogo, prodotto) usano `generateMetadata` server-side. JSON-LD prodotto via `components/JsonLd.tsx`.

## Errori API

Il backend restituisce `{ error: { code, message, userMessage, retriable, correlationId } }`. `ApiRequestError` espone `userMessage` per messaggi UI.
