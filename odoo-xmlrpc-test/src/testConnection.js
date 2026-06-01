const { loadConfig } = require('./config.js')
const { createOdooClient } = require('./odooClient.js')

function printRecords(label, rows) {
  console.log(`\n--- ${label} (${rows.length} record) ---`)
  if (rows.length === 0) {
    console.log('(nessun record)')
    return
  }
  for (const row of rows) {
    console.log(JSON.stringify(row, null, 2))
  }
}

function friendlyErrorMessage(err) {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  if (msg === 'Autenticazione fallita') {
    return [
      msg,
      '',
      'Di solito indica database, username o password errati, oppure utente non abilitato sul DB scelto.',
    ].join('\n')
  }

  if (
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('socket') ||
    lower.includes('network') ||
    lower.includes('timeout xml-rpc')
  ) {
    return [
      msg,
      '',
      'Problema di rete o host irraggiungibile. Verifica:',
      '  • ODOO_URL (host, porta, path tipo /odoo)',
      '  • reverse proxy / firewall',
      '  • SSL (certificato scaduto o CA non fidata)',
      '  • che l’istanza sia in esecuzione e accessibile dalla macchina dove lanci il test',
    ].join('\n')
  }

  if (lower.includes('unknown xml-rpc tag')) {
    return [
      msg,
      '',
      'La risposta non è XML-RPC ma probabilmente HTML (pagina errore, login, SPA).',
      'Controlla ODOO_URL: deve puntare alla radice Odoo così che /xmlrpc/2/common sia raggiungibile.',
    ].join('\n')
  }

  if (lower.includes('invalid xml-rpc message')) {
    return [
      msg,
      '',
      'Spesso significa: risposta non XML (HTML/errore proxy), body vuoto, o HTTP != 200 non gestito prima.',
      'Ora il client richiede `Accept-Encoding: identity` e mostra l’inizio del body nell’errore: leggi l’anteprima sopra.',
    ].join('\n')
  }

  if (lower.includes('access denied') || lower.includes('security') || lower.includes('operation not allowed')) {
    return [
      msg,
      '',
      'Credenziali valide ma permessi insufficienti sul modello o record richiesti.',
    ].join('\n')
  }

  return msg
}

async function main() {
  let config
  try {
    config = loadConfig()
  } catch (e) {
    console.error('[config]', e instanceof Error ? e.message : e)
    process.exit(1)
  }

  const client = createOdooClient(config)

  try {
    const uid = await client.authenticate()
    console.log(`Connected to Odoo, uid: ${uid}`)

    const partners = await client.searchRead('res.partner', [], ['name', 'email'], 5)
    printRecords('res.partner (name, email)', partners)

    const products = await client.searchRead('product.template', [], ['name', 'list_price'], 5)
    printRecords('product.template (name, list_price)', products)

    console.log('\nTest completato con successo.')
  } catch (err) {
    console.error('\n[errore]', friendlyErrorMessage(err))
    if (err instanceof Error && err.stack && process.env.DEBUG) {
      console.error('\nStack:', err.stack)
    }
    process.exit(1)
  }
}

main()
