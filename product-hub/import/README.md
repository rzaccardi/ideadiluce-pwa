# Import dati WooCommerce / Yoast

Cartella per i dump esportati da phpMyAdmin (prefisso tabelle `wpidl_`).

**Non committare file `.sql` / `.csv`** — sono ignorati da git.

## File attesi

| Nome suggerito | Contenuto |
|----------------|-----------|
| `wpidl_posts.sql` | Prodotti + varianti (ID, slug, SKU, parent) — export ridotto per import catalogo |
| `wpidl_posts_full.sql` | **Consigliato per testi HTML:** tabella `wpidl_posts` completa dallo **stesso database** usato per `wpidl_posts.sql` |
| `cvtg56_*.sql` (dump completo) | Gallery / postmeta (`hub:enrich`). Per `post_content` funziona solo se ID/slug coincidono con il catalogo importato |
| `wpidl_yoast_indexable.sql` | Permalink, meta SEO, focus keyword, OG image |
| `wpidl_yoast_indexable-terms.sql` | Albero categorie `product_cat` |
| `wpidl_yoast_indexable-product-terms.sql` | Legami prodotto ↔ categorie / `pwb-brand` |

Puoi usare i nomi originali (es. `wpidl_posts (1).sql`); il job di import li mapperà.

## Export SQL consigliato per `post_content`

Dal **medesimo** database Woo usato per l’export prodotti, in phpMyAdmin → SQL:

```sql
SELECT ID, post_type, post_status, post_name, post_excerpt, post_content
FROM wpidl_posts
WHERE post_type IN ('product', 'product_variation')
  AND post_status = 'publish'
  AND (post_content <> '' OR post_excerpt <> '');
```

Esporta il risultato come `wpidl_posts_full.sql` (formato INSERT) oppure riesporta l’intera tabella `wpidl_posts` sempre dallo stesso DB.

Poi:

```bash
npm run hub:import-content
```

Se `productsUpdated` resta 0, slug/ID del dump non corrispondono a quelli in Hub (dump di un altro backup).

Dopo l’import contenuti, estrai le **caratteristiche tecniche** dalle tabelle HTML nei campi strutturati del BO:

```bash
npm run hub:extract-specs
```

## URL legacy

I permalink Yoast usano **`/prodotto/{slug}/`** (non `/product/`).

## Comandi Hub

```bash
npm run hub:migrate
npm run hub:import
npm run hub:enrich
npm run hub:import-content
npm run hub:extract-specs
npm run hub:sync-odoo
```

Esegui **un comando per riga** (non mettere commenti `# ...` sulla stessa riga: npm li passa agli script).
