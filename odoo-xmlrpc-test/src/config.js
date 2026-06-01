/**
 * Carica e valida le variabili d'ambiente per il test Odoo.
 * @throws {Error} se manca una variabile obbligatoria
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const REQUIRED = ['ODOO_URL', 'ODOO_DB', 'ODOO_USERNAME', 'ODOO_PASSWORD']

function loadConfig() {
  const missing = REQUIRED.filter((key) => !process.env[key] || String(process.env[key]).trim() === '')
  if (missing.length > 0) {
    throw new Error(
      `Variabili d'ambiente mancanti o vuote: ${missing.join(', ')}. ` +
        'Copia .env.example in .env e compila tutti i valori.',
    )
  }

  return {
    odooUrl: process.env.ODOO_URL.trim().replace(/\/$/, ''),
    db: process.env.ODOO_DB.trim(),
    username: process.env.ODOO_USERNAME.trim(),
    password: process.env.ODOO_PASSWORD,
    timeoutMs: Number(process.env.ODOO_TIMEOUT_MS) || 30_000,
  }
}

module.exports = { loadConfig }
