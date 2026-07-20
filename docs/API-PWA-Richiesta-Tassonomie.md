# Richiesta contratto API — tassonomie search & filters (PWA → Odoo)

Addendum al contratto [`API-Prodotti-Odoo-PWA`](./API-Prodotti-Odoo-PWA.md) (§6–§7).  
Data richiesta: **2026-07-20** · Risposta BE: **2026-07-20** · Smoke PWA: **2026-07-21** · Website: `website=2`

---

## 1. Paradigma PWA

| Uso PWA | Filtro Odoo |
|---|---|
| Tecnici | `category=tecnico` |
| Arredo | `category=arredo` |

`world` non viene più inoltrato dal BFF (convertito in `category` se presente in ingresso).

---

## 2. Stato dimensioni

| Dimensione | Stato contratto | Smoke live 2026-07-21 | Azione PWA |
|---|---|---|---|
| Categoria | OK | OK | root `tecnico` / `arredo` |
| Brand / Attacco | OK | OK | — |
| Ambiente (R1) | modellato + attivo | **facet/search ancora 0** | wiring fatto; attesa popolamento dati |
| Tipologia (R2) | param OK | **OK** (`tavolo` → 1) | `/tipologia/*` + facet |
| Stile (R2) | param OK | **OK** (`design` → 1) | `/stile/*` + facet |

Smoke: `cd server && npx tsx scripts/odoo-taxonomy-smoke.ts`

---

## 3. R1 — `ambiente` · contratto OK, dati pending

Slug: `soggiorno` · `cucina` · `bagno` · `camera` · `studio` · `esterno`  
Facet: `ambienti[{value,label,count}]` · search `ambiente=` · `taxonomy.ambiente[]`

**PWA fatto:**

- `/ambienti/<slug>` → `category=arredo` + `ambiente=<slug>` (niente `world`, niente `q=`)
- Home slider `room-*` → stesso filtro strutturale
- Parser facet `value`/`label`/`count`

**Blocco:** finché Odoo non popola i prodotti, listing/slider room restano vuoti.

---

## 4. R2 — `tipologia` / `stile` · live minimale OK

Con `category=arredo` le facet e la search rispondono (catalogo Arredo ancora scarso).

**PWA fatto:** pagine `/tipologia/*` e `/stile/*` usano `category=arredo` + param dedicato; tile/href senza `world=`.

---

## 5. Criterio di accettazione

| Check | Stato |
|---|---|
| Paradigma senza `world` in uscita BFF | **OK** |
| R1 search/filters popolati | **pending dati Odoo** |
| R2 tipologia/stile su Arredo | **OK smoke** (copertura catalogo limitata) |
