# Test XML-RPC Odoo 18

Progetto minimale in Node.js per verificare che un’istanza **Odoo 18** esponga correttamente l’**External API** via **XML-RPC** e che **database + credenziali** siano validi.

## Installazione

```bash
cd odoo-xmlrpc-test
npm install
```

## Setup `.env`

```bash
cp .env.example .env
```

Compila:

| Variabile | Descrizione |
|-----------|-------------|
| `ODOO_URL` | URL base pubblico (come nel browser), **senza** slash finale, **con** eventuale path (es. `https://www.esempio.it/odoo`) |
| `ODOO_DB` | Nome del database (schermata di login Odoo) |
| `ODOO_USERNAME` | Login utente |
| `ODOO_PASSWORD` | Password |

Opzionale: `ODOO_TIMEOUT_MS` (default 30000).

## Comando di avvio

```bash
npm run test:odoo
```

Equivale a:

```bash
node src/testConnection.js
```

## Cosa fa lo script

1. Legge e valida le variabili d’ambiente (`src/config.js`).
2. Si autentica su `${ODOO_URL}/xmlrpc/2/common` → ottiene `uid`.
3. Esegue `search_read` su `res.partner` (campi `name`, `email`, max 5 record).
4. Esegue `search_read` su `product.template` (campi `name`, `list_price`, max 5).
5. Stampa i risultati in console; in caso di errore esce con codice `1`.

## Output atteso (esempio)

```
Connected to Odoo, uid: 2

--- res.partner (name, email) (5 record) ---
{
  "id": 3,
  "name": "Administrator",
  "email": "admin@example.com"
}
…

--- product.template (name, list_price) (5 record) ---
{
  "id": 1,
  "name": "Prodotto esempio",
  "list_price": 10
}
…

Test completato con successo.
```

## Troubleshooting

### `Invalid XML-RPC message`

Di solito la risposta **non è XML-RPC valido** (body vuoto, HTML, errore intermedio) oppure **gzip** senza decodifica. Il client ora invia **`Accept-Encoding: identity`**, controlla **HTTP 200** e, in errore, allega un’**anteprima del body** nel messaggio: usala per capire se arriva HTML, JSON o una pagina del proxy.

### `Autenticazione fallita` (nessun `uid` valido)

Di solito il problema è **nome database**, **username** o **password** errati, oppure l’utente non esiste / non è attivo su quel database.

### Errori di connessione, timeout, `Unknown XML-RPC tag 'TITLE'`

- Verifica **ODOO_URL** (host, porta, path `/odoo` se usato in produzione).
- **Reverse proxy**: deve inoltrare `POST` su `/xmlrpc/2/common` e `/xmlrpc/2/object` senza restituire una pagina HTML.
- **SSL**: certificato valido, catena CA riconosciuta da Node.
- **Rete**: firewall, VPN, istanza spenta o non raggiungibile dalla macchina dove esegui il test.

### Fault Odoo tipo “access denied” / permessi

Le credenziali sono ok ma l’utente **non ha diritti** di lettura sul modello (`res.partner` / `product.template`). Usa un utente con permessi adeguati o regola i gruppi in Odoo.

### Debug stack trace

```bash
DEBUG=1 npm run test:odoo
```
