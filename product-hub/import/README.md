# Import dati WooCommerce / Yoast

Cartella per i dump esportati da phpMyAdmin (prefisso tabelle `wpidl_`).

**Non committare file `.sql` / `.csv`** — sono ignorati da git.

## File attesi

| Nome suggerito | Contenuto |
|----------------|-----------|
| `wpidl_posts.sql` | Prodotti + varianti (ID, slug, SKU, parent) |
| `wpidl_posts-seo.sql` | Opzionale: SEO da postmeta (se separato) |
| `wpidl_yoast_indexable.sql` | Permalink, meta SEO, focus keyword, OG image |
| `wpidl_yoast_indexable-terms.sql` | Albero categorie `product_cat` |
| `wpidl_yoast_indexable-product-terms.sql` | Legami prodotto ↔ categorie / `pwb-brand` |

Puoi usare i nomi originali (es. `wpidl_posts (1).sql`); il job di import li mapperà.

## URL legacy

I permalink Yoast usano **`/prodotto/{slug}/`** (non `/product/`).

## Dopo il caricamento

Avvisare il team dev quando i file sono pronti per avviare il job `WooSeoImportBatch` (vedi piano Product Hub).
