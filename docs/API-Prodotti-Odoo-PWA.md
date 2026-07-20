# API Prodotti Odoo → PWA (v2)

Contratto definitivo dell'API headless prodotti esposta da Odoo.
Aggiornato al 2026-07-20 — include le estensioni recenti: **specifiche tecniche, media gallery con tag funzionali, video, documenti PDF, 6 lingue**.

---

## 1. Base e autenticazione

| | |
|---|---|
| **Base URL** | `https://tlbdb.odoo.com` |
| **Auth** | Header `Authorization: Bearer <API_KEY>` su ogni chiamata |
| **Formato** | JSON, UTF-8 |
| **Website PWA** | `website=2` (parametro obbligatorio su ogni chiamata) |

La chiave è una API key nativa Odoo (la stessa già in tuo possesso; se serve una nuova la genero io). Senza header o con chiave errata → `401 {"error": "..."}`.

### Lingue

Parametro `lang` opzionale. Valori ammessi:

`it_IT` (default) · `en_US` · `fr_FR` · `de_DE` · `es_ES` · `ro_RO`

Un valore non ammesso fa fallback silenzioso su `it_IT`. **Tutti i campi testuali** (titolo, slug, descrizioni, SEO, label delle specifiche, valori attributo, alt delle immagini) tornano già tradotti nella lingua richiesta: una chiamata per lingua, zero merge lato frontend.

---

## 2. `GET /api/v2/products` — lista paginata

```
GET /api/v2/products?website=2&lang=it_IT&page=1&per_page=100
Authorization: Bearer <API_KEY>
```

| Param | Tipo | Default | Note |
|---|---|---|---|
| `website` | int | — | obbligatorio, per la PWA = `2` |
| `lang` | string | `it_IT` | vedi lingue sopra |
| `page` | int | `1` | 1-based |
| `per_page` | int | `24` | max `100` |

Risposta:

```json
{
  "website": {"id": 2, "name": "PWA"},
  "lang": "it_IT",
  "page": 1,
  "per_page": 100,
  "total": 684,
  "total_pages": 7,
  "items": [
    {
      "id": 6673,
      "title": "TUBO FLUORESCENTE T8 36 W G13 3350 lm 4000 K",
      "slug": "tubo-fluorescente-t8-36w-g13-4000k",
      "short_description": "Tubo fluorescente lineare T8 da 36 W...",
      "price_from": 4.9,
      "price_to": 4.9,
      "currency": "EUR",
      "image": {"url": "/web/image/product.template/6673/image_512", "alt": ""}
    }
  ]
}
```

Note:
- `items[]` è il payload "card" per liste/categorie: leggero, senza varianti né specs.
- `price_from`/`price_to`: min/max tra le varianti (IVA esclusa, listino pubblico). Se il prodotto è mono-variante `price_from == price_to`.
- Ordinamento stabile per `id` → la paginazione è consistente tra pagine.
- L'identificatore univoco lato frontend è **`id`** (o `slug` per le route). `default_code` NON è più esposto (deprecato).

### Ricerca

Per ricerca, filtri e facet usa gli endpoint dedicati **§6 `/api/v2/products/search`** e **§7 `/api/v2/filters`**. Questo endpoint lista resta per il sync periodico della cache typeahead (come da vostro schema: suggest locale, listing live).

---

## 3. `GET /api/v2/product/<id>` — dettaglio

```
GET /api/v2/product/6673?website=2&lang=it_IT
Authorization: Bearer <API_KEY>
```

Risposta (campi del summary **più** i seguenti):

```json
{
  "website": {"id": 2, "name": "PWA"},
  "lang": "it_IT",
  "product": {
    "id": 6673,
    "title": "...", "slug": "...", "short_description": "...",
    "price_from": 4.9, "price_to": 4.9, "currency": "EUR",
    "image": {"url": "/web/image/product.template/6673/image_512", "alt": ""},

    "description": "<p>Descrizione lunga HTML...</p>",

    "seo": {
      "meta_title": "Tubo Fluorescente T8 36W G13 4000K | TLB Italy",
      "meta_description": "...",
      "og_image": {"url": "/web/image/product.template/6673/image_1920", "alt": ""}
    },

    "gallery": [
      {"type": "image", "tag": "foto",    "url": "/web/image/product.template/6673/image_1920", "alt": ""},
      {"type": "image", "tag": "attacco", "url": "/web/image/product.image/512/image_1920", "alt": "Attacco G13"},
      {"type": "image", "tag": "misure",  "url": "/web/image/product.image/513/image_1920", "alt": "Dimensioni"},
      {"type": "video", "tag": "applicazione", "url": "https://www.youtube.com/watch?v=...", "alt": ""}
    ],

    "specs": [
      {
        "key": "wattage", "label": "Potenza", "unit": "W",
        "value_type": "integer", "cardinality": "single",
        "value": 36, "display": "36 W"
      },
      {
        "key": "color_temperature_k", "label": "Temperatura colore", "unit": "K",
        "value_type": "integer", "cardinality": "single",
        "value": 4000, "display": "4000 K"
      }
    ],

    "variants": [
      {
        "id": 9124,
        "ced": "102261",
        "manufacturer_code": "4050300517872",
        "attributes": [
          {"attribute_id": 5, "label": "Colore luce", "value": "Bianco freddo"}
        ],
        "lst_price": 4.9,
        "image": {"url": "/web/image/product.product/9124/image_512", "alt": ""},
        "specs": [ ...stesso formato di specs... ]
      }
    ],

    "documents": [
      {
        "type": "datasheet",
        "name": "DS_L36W840.pdf",
        "mimetype": "application/pdf",
        "url": "/web/content/184223?download=true"
      }
    ]
  }
}
```

### 3.1 `gallery[]` — media con tag funzionali

Ogni elemento:

| Campo | Valori |
|---|---|
| `type` | `image` \| `video` |
| `tag` | `foto` · `attacco` · `misure` · `accesa` · `applicazione` · `ambiente` · `dettaglio` · `certificazione` |
| `url` | relativo per le immagini; **assoluto** (YouTube/Vimeo) per i video |
| `alt` | alt-text tradotto nella `lang` richiesta (può essere `""`) |

- Il **primo elemento è sempre l'immagine principale** (`tag: "foto"`).
- Il `tag` serve per raggruppare i media in tab nella gallery prodotto (Foto / Attacco / Misure / ...). Se un tag non ha elementi, non mostrare la tab.
- L'ordine dell'array è l'ordine editoriale deciso in backoffice: rispettalo.
- Le immagini legate a una **variante specifica** NON compaiono qui: sono in `variants[i].image` (niente duplicati da filtrare).

### 3.2 `specs[]` — specifiche tecniche

- `specs` a livello prodotto = specifiche comuni a tutte le varianti.
- `variants[i].specs` = **merge effettivo** template + override della variante, già calcolato server-side. Quando l'utente seleziona una variante, mostra `variants[i].specs` così com'è: **nessun merge lato frontend**.
- `key` è lo slug tecnico stabile (usalo per logica/matching); `label` e `display` sono tradotti e pronti per la UI. `display` è la stringa già formattata con unità (`"36 W"`, `"20–40 W"`, `"3000 / 4000 / 6500 K"`).
- `value_type`: `integer` · `float` · `char` · `boolean` · `selection`.
- `cardinality` determina la forma di `value`:

| `cardinality` | forma di `value` | esempio |
|---|---|---|
| `single` | scalare | `36`, `"G13"`, `true` |
| `discrete_set` | `{"set": [...]}` | `{"set": [3000, 4000, 6500]}` (es. switch CCT on-body) |
| `continuous_range` | `{"min": x, "max": y}` | `{"min": 20, "max": 40}` (es. driver universale) |

Se ti serve solo la visualizzazione, ignora `value` e usa direttamente `display`.

### 3.3 `variants[]`

- Sempre presente, anche per prodotti mono-variante (array con 1 elemento).
- `ced`: codice univoco TLB a 6 cifre, copertura 100% — è l'identificatore variante di riferimento (per carrello, deep-link documenti, ecc.).
- `manufacturer_code`: MPN/EAN del produttore, può essere `null`.
- `attributes[]`: coppie label/value tradotte (es. Colore luce → Bianco freddo) per costruire i selettori variante.
- `lst_price`: prezzo della variante inclusi gli extra degli attributi.

### 3.4 `documents[]`

| Campo | Valori |
|---|---|
| `type` | `datasheet` · `scheda_ue` (scheda prodotto UE/EPREL) · `ce` (dichiarazione CE) · `istruzioni` |
| `url` | download diretto, relativo al base URL |

In più esiste un **URL pubblico stabile per tipo** (senza auth, ottimo per link SEO/statici — fa 302 sull'ultima versione del documento):

```
GET /product-docs/<ced>/<tipo>/current
es. https://tlbdb.odoo.com/product-docs/102261/datasheet/current
```

Se il documento non esiste → `404`.

---

## 4. Immagini — dimensioni

Gli URL immagine sono relativi: prefissa il base URL. Il campo finale dell'URL è la size; puoi sostituirlo liberamente con:

`image_128` · `image_256` · `image_512` · `image_1024` · `image_1920`

Odoo ridimensiona server-side (proporzioni preservate, no crop). Per le card usa `image_512`, per zoom/dettaglio `image_1920`. Consiglio `loading="lazy"` + cache CDN lato tuo: le immagini cambiano raramente.

---

## 5. Errori

| HTTP | Caso |
|---|---|
| `400` | `website` mancante/non intero, o sito non headless |
| `401` | header Authorization mancante/malformato o chiave invalida |
| `404` | website inesistente; prodotto inesistente o **non pubblicato su quel sito** |

Formato: `{"error": "<messaggio>"}`.

Nota: un prodotto de-pubblicato dal backoffice sparisce sia dalla lista sia dal dettaglio (404) → gestisci il 404 sul dettaglio come "prodotto non più disponibile".

---

## 6. `GET /api/v2/products/search` — listing filtrato ★ NUOVO

Stessa auth e parametri base (`website`, `lang`) del resto della v2.

```
GET /api/v2/products/search?website=2&lang=it_IT&category=tecnico&attacco=G4&wattaggio=20&page=1&per_page=24&sort=relevance
```

### Parametri filtro

| Param | Tipo | Note |
|---|---|---|
| `q` | string | full-text su titolo, slug, descrizioni, CED/MPN/EAN, brand, categorie, tag, specs |
| `world` | `design` \| `technical` | equivalente a `category=arredo`/`tecnico` — mantenuto per compatibilità, la PWA può ignorarlo |
| `category` | slug \| csv | matcha **qualsiasi nodo** del percorso categoria del prodotto (es. `fluorescente`, `led`, `tecnico`) — OR |
| `subcategory` | slug \| csv | come `category`; i due param sono in AND: `category=ballast&subcategory=fluorescente` |
| `tipologia` | slug \| csv | 1° livello Arredo (`sospensione`, `parete`, `tavolo`…) — OR |
| `ambiente` | slug \| csv | slug stanze (vedi note §7 R1) — OR; multiplo per prodotto |
| `stile` | slug \| csv | da spec `style` (Arredo) — OR |
| `brand` | slug \| csv | es. `osram,tlb` — OR |
| `attacco` | string \| csv | da spec `socket_type`, case-insensitive (`G4`, `e27`, `GU5.3`) — OR |
| `wattaggio` | number \| csv | match esatto W (copre anche i set discreti e i range dei driver) — OR |
| `wattaggio_min` / `wattaggio_max` | number | range W (overlap con i range dei driver universali) |
| `color_temp` | string \| csv | `3000K` o `3000` — OR |
| `tag` | slug \| csv | **AND** tra tag (`t5,dimmerabile` = entrambi presenti) |
| `sort` | enum | `relevance` (default) \| `price_asc` \| `price_desc` \| `name_asc` |
| `page` / `per_page` | int | come §2, max 100 |

Semantica: **AND tra dimensioni diverse, OR dentro il csv della stessa dimensione** (eccezione: `tag` = AND, come da vostro contratto). Solo prodotti pubblicati sul website richiesto.

Risposta: stesso shape di §2 (card leggere) più `sort` e `applied_filters` (echo dei filtri normalizzati). Le card di **tutte** le liste (anche §2) ora includono:

```json
"brand": {"slug": "osram", "name": "OSRAM"},
"category_slug": "fluorescente"
```

---

## 7. `GET /api/v2/filters` — facet aggregate ★ NUOVO

Accetta **gli stessi filtri della search** (senza `page`/`per_page`/`sort`). I conteggi sono calcolati **sul set già filtrato**: con `attacco=G4`, i `wattaggi`/`brands`/… contano solo prodotti G4. `total_matching` coincide sempre con `total` della search a parità di filtri: le due chiamate condividono la stessa pipeline server-side, la coerenza è strutturale.

```
GET /api/v2/filters?website=2&lang=it_IT&category=tecnico&attacco=G4
```

Risposta:

```json
{
  "website": {"id": 2, "name": "PWA"},
  "lang": "it_IT",
  "total_matching": 13,
  "applied_filters": {"category": ["tecnico"], "attacco": ["G4"]},
  "worlds": [
    {"value": "design", "label": "Arredo", "count": 0},
    {"value": "technical", "label": "Tecnici", "count": 13}
  ],
  "categories": [
    {"slug": "tecnico", "name": "Tecnico", "parent_slug": null, "count": 13,
     "children": [
       {"slug": "alogene", "name": "Alogene", "parent_slug": "tecnico", "count": 13, "children": []}
     ]}
  ],
  "brands": [{"slug": "osram", "name": "OSRAM", "count": 8}],
  "tipologie": [], "ambienti": [], "stili": [],
  "attacchi": [{"value": "g4", "label": "G4", "count": 13}],
  "wattaggi": [{"value": "20", "label": "20 W", "count": 4}],
  "color_temps": [{"value": "3000", "label": "3000 K", "count": 4}],
  "tags": [{"value": "dimmerabile", "label": "Dimmerabile", "count": 9}],
  "specs": [
    {"key": "socket_type", "label": "Attacco", "unit": "",
     "values": [{"value": "g4", "label": "G4", "count": 13}]}
  ]
}
```

### Note di mapping (differenze consapevoli vs la vostra bozza)

- **Slug categorie reali**: albero con root `tecnico` / `arredo` e figli tipo `fluorescente`, `led`, `alogene`, `ballast`, `driver`, `scarica`… (non `illuminazione-tecnica`/`lampadine`). Gli slug sono stabili (derivati dal nome IT), le `name` tornano tradotte nella `lang` richiesta.
- **Specs facetabili** (9 chiavi): `socket_type`, `wattage`, `color_temperature_k`, `source_technology`, `energy_class`, `dimmable`, `bulb_shape`, `ip_rating`, `light_color`. `attacchi`/`wattaggi`/`color_temps` sono scorciatoie delle prime tre.
- **`ambiente`** ★ R1: dimensione modellata con slug stabili `soggiorno` · `cucina` · `bagno` · `camera` · `studio` · `esterno`, assegnazione multipla per prodotto, `name` tradotta nella `lang` richiesta. Facet `ambienti[{value,label,count}]`, filtro `ambiente=<slug|csv>` (OR) e `taxonomy.ambiente[]` sul dettaglio sono attivi. Il popolamento parte dal catalogo Arredo: sui tecnici attuali la copertura sarà limitata — le facet mostrano solo ambienti con `count > 0`, quindi la UI può renderizzare direttamente ciò che arriva.
- **Label kelvin**: `"3000 K"` (con spazio); in query accettiamo sia `3000K` che `3000`.
- **Freshness**: l'indice di ricerca server-side si aggiorna da solo a ogni modifica del catalogo. La cache locale PWA resta solo per il typeahead, come da vostro §4.

Il **dettaglio prodotto** (§3) ora espone anche i campi per aggregare lato PWA:

```json
"categories": [
  {"id": 71, "slug": "tecnico", "name": "Tecnico", "parent_slug": null},
  {"id": 79, "slug": "fluorescente", "name": "Fluorescente", "parent_slug": "tecnico"}
],
"tags": ["fluorescente", "t5", "4000k"],
"taxonomy": {"world": "technical", "tipologia": [], "ambiente": ["soggiorno", "camera"], "stile": []}
```

---

## 8. Riepilogo operativo

- **Catalogo attuale sulla PWA**: ~684 prodotti pubblicati, 6 lingue complete.
- **Split Tecnici/Arredo**: usa `category=tecnico` / `category=arredo` (il param `world` resta solo per compatibilità).
- **Sync consigliato**: pull paginato di `/api/v2/products` (100/pagina) + dettaglio on-demand o in build (ISR); **negozio/filtri/facet sempre live** su `/api/v2/products/search` + `/api/v2/filters`.
- **Identificatori**: prodotto = `id`/`slug` · variante = `ced`.
- Il campo `default_code` non esiste più nel contratto: se lo stai ancora leggendo da vecchie chiamate, migra su `ced`.
- Le vecchie API generiche Odoo (XML-RPC / `/shop`) non vanno usate per il frontend: questa v2 è l'unica interfaccia supportata per la PWA.

Per qualsiasi campo aggiuntivo che ti serve (nuove facet, stock, ambiente) scrivimi: il controller è nostro, si estende in giornata.
