# Gap analysis — allineamento Prompt 2 / Emil

Data: 2026-06-27

## Legenda stato

| Stato | Significato |
|-------|-------------|
| ✅ | Implementato e allineato |
| 🟡 | Parziale / workaround accettato |
| ⏳ | Fuori scope sprint corrente |

## Sprint 1 — Preventivi Odoo pagabili + checkout congelato

| Requisito | Stato | Note |
|-----------|-------|------|
| Gate `state=sent` + `validity_date` | ✅ | `quote-payability.ts` |
| Errori QUOTE_EXPIRED / CANCELLED / … | ✅ | API + UI account |
| Snapshot importi Odoo reali | ✅ | `amount_untaxed` / `amount_tax` |
| Checkout `frozen_quote` senza ricalcolo | ✅ | `checkout.actions.ts` |
| UI badge Scaduto / Pagabile | ✅ | `QuoteStatusBadges` |
| Hardening auth su checkout frozen | ✅ | skip `initializeCheckoutNavigation` |
| Indirizzi Odoo in dettaglio preventivo | ✅ | `getCustomerProfileByEmail` |

## Sprint 2 — Professional Space

| Requisito | Stato | Note |
|-----------|-------|------|
| Validazione P.IVA VIES server | ✅ | `vatValidationService.checkOnce` |
| Creazione account PWA (guest) | ✅ | password auto + email |
| Partner Odoo + map utente | ✅ | `findOrCreateCustomer` |
| Campi DB richiesta (odooPartnerId, vat…) | ✅ | migration Prisma |
| Form paese | ✅ | select IT/EU |
| BO: VAT, visura, link Odoo | ✅ | admin detail page |
| Email Emil arricchita | ✅ | VIES, partner, userId |

## Sprint 3 — Sync profilo + ritiro

| Requisito | Stato | Note |
|-----------|-------|------|
| `patchMe` → Odoo | ✅ | già presente |
| Log IntegrationLog su fallimento sync | ✅ | `users.service.ts` |
| Indirizzo ritiro unico via env | ✅ | `getStorePickupLocation()` |
| Seed shipping + footer allineati | ✅ | admin seed + `COMPANY_CONTACT` |

## Sprint 4 — Test e documentazione

| Requisito | Stato | Note |
|-----------|-------|------|
| Script matrice IVA | ✅ | `server/scripts/tax-matrix-verify.ts` |
| Gap analysis tabellare | ✅ | questo file |

## Fuori scope / backlog

| Area | Stato | Decisione |
|------|-------|-----------|
| Google Places obbligatorio | ⏳ | Non richiesto |
| PDF fattura nativo | ⏳ | Link portale Odoo OK |
| Richiesta preventivo + account inline | ⏳ | Solo checkout/professional |
| SEO documenti PDP | ⏳ | Audit separato |
| localStorage carrello mirror | 🟡 | Accettato |

## Comandi verifica

```bash
cd server && npx tsx scripts/tax-matrix-verify.ts
cd server && ODOO_ENABLED=true npx tsx scripts/e2e-sprint-validation.ts
cd server && npm run build
cd client && npm run build
```

Vedi anche [E2E-SPRINT-VALIDATION.md](./E2E-SPRINT-VALIDATION.md) — **11/11 test automatici passati** (2026-06-27).
