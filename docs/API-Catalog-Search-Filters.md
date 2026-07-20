# API Catalog Search & Filters — contratto Odoo live

Contratto **confermato** dal BE Odoo (2026-07-20).  
Documento master completo: [`API-Prodotti-Odoo-PWA.md`](./API-Prodotti-Odoo-PWA.md) (§6–§7).

---

## Principio architetturale

| Uso | Dove | Cosa |
|-----|------|------|
| **Searchbox** (autocomplete / typeahead) | Cache locale PWA (`suggest=1` su `/catalog/products`) | Solo compilazione rapida → PDP by slug/id |
| **Query catalogo** (listing, filtri, paginazione, facet) | **API Odoo live** via BFF | `GET /api/v2/products/search` + `GET /api/v2/filters` |

```
[ Searchbox digitazione ]
        │
        ▼
  cache PWA (locale) ──► suggest prodotto → PDP by id/slug

[ Negozio / filtri / listing ]
        │
        ▼
  BFF PWA ──► Odoo GET /api/v2/products/search (+ /filters)
```

### Endpoint BFF PWA

| BFF | Upstream Odoo |
|-----|---------------|
| `GET /api/v1/catalog/search` | `GET /api/v2/products/search` |
| `GET /api/v1/catalog/filters` | `GET /api/v2/filters` |
| `GET /api/v1/catalog/products?suggest=1` | indice cache locale (typeahead) |
| `GET /api/v2/products/search` | proxy trasparente |
| `GET /api/v2/filters` | proxy trasparente |

---

## Paradigma tassonomico PWA

**Niente `world` / mondo.** Lo split Tecnici / Arredo è solo via **categoria root**:

| Uso PWA | Filtro Odoo |
|---------|-------------|
| Tecnici | `category=tecnico` |
| Arredo | `category=arredo` |

Dimensioni tassonomiche (search + filters):

| Dimensione | Param | Facet |
|------------|-------|-------|
| Categoria / sottocategoria | `category` / `subcategory` | `categories` |
| Tipologia (arredo) | `tipologia` | `tipologie` |
| Ambiente | `ambiente` | `ambienti` |
| Stile (arredo) | `stile` | `stili` |
| Brand | `brand` | `brands` |
| Attacco | `attacco` | `attacchi` |

Altri filtri (non tassonomie path): `q`, `wattaggio*`, `color_temp`, `tag`, `sort`, `page` / `per_page`.

> Nota: Odoo espone ancora `world` / `worlds` nel contratto v2; la PWA **non** lo usa come dimensione — non va richiesto, popolato né esposto in UI/route.

### Parametri filtro (AND tra dimensioni, OR nel CSV)

| Param | Note |
|-------|------|
| `q` | full-text |
| `category` / `subcategory` | slug (OR nel csv); AND tra i due — root `tecnico` / `arredo` |
| `tipologia` / `ambiente` / `stile` | slug \| csv |
| `brand` | slug \| csv |
| `attacco` | da `socket_type` |
| `wattaggio` / `wattaggio_min` / `wattaggio_max` | W |
| `color_temp` | `3000` o `3000K` |
| `tag` | **AND** tra tag |
| `sort` | `relevance` \| `price_asc` \| `price_desc` \| `name_asc` |
| `page` / `per_page` | solo search, max 100 |

### Alias slug PWA → Odoo

Il BFF normalizza gli slug legacy CMS:

| PWA / CMS | Odoo |
|-----------|------|
| `illuminazione-tecnica` | `category=tecnico` |
| `prodotti-tecnici` | idem |
| `illuminazione-arredo` / `arredo` | `category=arredo` |

Slug reali Odoo: root `tecnico` / `arredo` e figli (`fluorescente`, `led`, `alogene`, …).

### Note Odoo

- `ambiente`: facet ancora vuota (non popolata a catalogo) — **richiesta aperta R1** sotto.
- Label Kelvin: `"3000 K"`; in query accettano `3000K` e `3000`.
- Specs facetabili: `socket_type`, `wattage`, `color_temperature_k`, `source_technology`, `energy_class`, `dimmable`, `bulb_shape`, `ip_rating`, `light_color`.
- Card lista: includono `brand` + `category_slug`.
- Dettaglio: `categories[]`, `tags[]`, `taxonomy` (`tipologia` / `ambiente` / `stile` — senza dipendere da `world`).

---

## Richieste aperte PWA → BE Odoo

Tracking: [`API-PWA-Richiesta-Tassonomie.md`](./API-PWA-Richiesta-Tassonomie.md).

### R1 — `ambiente` · contratto OK, **dati pending**

Wiring PWA: `/ambienti/*` + slider `room-*` → `ambiente=` (+ `category=arredo`).  
Smoke live ancora `total=0` / facet vuota — attendere popolamento catalogo Odoo.

### R2 — `tipologia` / `stile` · **smoke OK** su Arredo

`/tipologia/*` e `/stile/*` con `category=arredo`. Smoke: `tavolo` / `design` restituiscono prodotti.

---

## Esempi

```bash
# Facet tecnici (via category root, non world)
curl -s -H "Authorization: Bearer $API_KEY" \
  'https://tlbdb.odoo.com/api/v2/filters?website=2&lang=it_IT&category=tecnico'

# Search filtrata
curl -s -H "Authorization: Bearer $API_KEY" \
  'https://tlbdb.odoo.com/api/v2/products/search?website=2&lang=it_IT&category=tecnico&attacco=G4&wattaggio=20&page=1&per_page=24'
```
