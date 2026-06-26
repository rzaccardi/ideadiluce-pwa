# Report Sprint 2 — Emil (2026-06-26, chiusura completa)

Validazione: `server/scripts/micro-sprint-15-validation.ts` con API su `localhost:4000`, `ODOO_ENABLED=true`.

Checklist listini Odoo: `server/scripts/odoo-pricelist-checklist.ts`

---

## Tabella 1 — Task completati

| Task | Stato | File principali | Test | Gap residui |
|------|-------|-----------------|------|-------------|
| **1 Professional Space** | ✅ | `professional-account.*`, admin BO, `ProfessionalAccountForm`, `AccountOverviewPage` | Migration + BO + banner | Listino pro assegnato manualmente in Odoo (by design MVP) |
| **2 Preventivo guest** | ✅ | `InlineAccountAuthStep`, `CheckoutQuotePage` | `guest-quote-flow-test.ts` | — |
| **3 UX preventivi** | ✅ | `quote-payability.ts`, `QuoteStatusBadges`, CTA scaduto/contatti, link ordine | 9 test payability | Stripe frozen checkout: test manuale |
| **4 Sync profilo Odoo** | ✅ | `users-odoo-sync.helper`, `AccountSaveFeedback` | 2 test helper | Fail-open con warning UI |
| **5 Area account overview** | ✅ | Overview fatture/preventivi/professional, `portalUrl` fatture | Client build OK | — |
| **6 Staging listini/varianti** | ✅ | `catalog-pricing.enrich.ts`, `pricelist.service.ts`, script checklist | MS1.5: **PDP=carrello OK** | Listini B2B/pro env da configurare in staging |

---

## Tabella 2 — Flussi MVP

| Flusso | Stato | Può andare live? | Condizione |
|--------|-------|------------------|------------|
| Professional Space | ✅ | Sì (MVP) | Form → BO → approvazione manuale |
| Preventivo guest | ✅ | Sì | Registrazione inline |
| Preventivi account | ✅ | Sì | Badge, scadenza, CTA pagamento/scaduto |
| Profilo/Odoo sync | ✅ | Sì | Warning se sync fallisce |
| Fatture account | ✅ | Sì | PDF + fallback portale Odoo |
| Listini B2B/pro | ⚠️ | Pre-live staging | Configurare `ODOO_PRICELIST_*` (script checklist) |
| Prezzo varianti | ✅ | Sì | Enrich Odoo su PDP allinea al carrello |

---

## Tabella 3 — Bug bloccanti residui

| Rank | Bug | Area | Impatto | Bloccante | Fix |
|------|-----|------|---------|-----------|-----|
| 1 | Listini B2B/pro non configurati in `.env` dev | Pricing | Stesso prezzo tutti i segmenti | **Sì pre-live** | Team Odoo + `odoo-pricelist-checklist.ts` |
| 2 | Prodotti edge assenti in catalogo dev | Restock E2E | CTA storefront non testabile | Medio | Popolare staging Odoo/Arfly |
| 3 | Repricing ridondante GET+POST carrello | Performance | Doppie chiamate | No | Sprint 3 opzionale |

### Task 6 — Prezzo variante (risolto in codice)

| Campo | Prima | Dopo enrich Odoo |
|-------|-------|------------------|
| PDP variante 1622 (Eclisse) | €196,72 (Arfly) | **€172,13** |
| Carrello | €172,13 | €172,13 |
| Esito | ❌ salto visibile | ✅ allineato |

**Implementazione:** `enrichProductDetailWithOdooPricing` in `POST /api/v1/catalog/availability/enrich-detail` e `resolveCatalogProductEnriched`.

---

## Checklist team Odoo — listini staging

```bash
cd server && ODOO_ENABLED=true npx tsx scripts/odoo-pricelist-checklist.ts
cd server && ODOO_ENABLED=true npx tsx scripts/micro-sprint-15-validation.ts
```

- [ ] `ODOO_PRICELIST_B2C_ID`
- [ ] `ODOO_PRICELIST_B2B_ID`
- [ ] `ODOO_PRICELIST_PROFESSIONAL_ID`
- [ ] Partner test con listini diversi
- [ ] Verificare pricing B2B/Pro ≠ anonimo nello script MS1.5

---

## Tabella 4 — Piano Sprint 3 consigliato

| Task | Priorità | Motivo |
|------|----------|--------|
| Config listini staging + smoke B2B/pro | P0 | Unico blocco pre-live rimasto |
| Prodotti edge staging (restock E2E) | P1 | Test storefront completo |
| Riduzione repricing carrello ridondante | P2 | Performance |
| Test E2E browser (Playwright) | P2 | Qualità |
| SEO / contenuti | P3 | Post-MVP |

---

## Note strategiche MVP

| Punto | Stato |
|-------|-------|
| PAID_SYNC email SMTP | Non bloccante |
| Restock/professional/preventivo in BO | ✅ |
| SMTP PWA | Non richiesto MVP |
| Odoo master prezzi | ✅ PDP + carrello |
