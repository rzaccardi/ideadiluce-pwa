# E2E Sprint Validation — 2026-06-27

Script: `server/scripts/e2e-sprint-validation.ts`

```bash
cd server && ODOO_ENABLED=true npx tsx scripts/e2e-sprint-validation.ts
```

## Risultato: 11/11 ✅

| Check | Esito | Dettaglio |
|-------|-------|-----------|
| Payability sent valido | ✅ | `state=sent` + validity futura |
| Payability sent scaduto | ✅ | `reason=expired` |
| Payability cancelled | ✅ | `reason=cancelled` |
| Store pickup config | ✅ | Via Appia Pignatelli 450, 00178 Roma |
| API health | ✅ | `GET /health` |
| Contatti indirizzo | ✅ | Pagina chi-siamo allineata |
| VIES P.IVA | ✅ | IT17245551001 valida |
| Odoo XML-RPC auth | ✅ | Credenziali `.env` |
| Odoo quotations (sent) | ✅ | 5 preventivi trovati |
| Odoo quote payability | ✅ | SO8956 → payable |
| Shipping pickup label | ✅ | Ritiro gratuito — Via Appia Pignatelli 450, Roma |

## Configurazione usata

- `ODOO_ENABLED=true` (riavviato server API su porta 4000)
- Odoo: `tlbdb.odoo.com` — preventivi `sent` presenti in produzione/staging Odoo

## Non coperto dallo script (test manuale UI)

- Login utente → lista preventivi account → CTA checkout frozen
- Pagamento Stripe su ordine frozen
- Invio form professionisti completo (crea record + email)
- BO admin dettaglio richiesta professionisti

## Ripetere

```bash
# Assicurarsi che API sia in esecuzione con Odoo attivo
cd server && ODOO_ENABLED=true npx tsx src/server.ts

# In altro terminale
cd server && ODOO_ENABLED=true npx tsx scripts/e2e-sprint-validation.ts
```
