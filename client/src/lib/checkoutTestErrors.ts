import { ApiRequestError } from '@/types/api'

/** Messaggi operativi per la pagina test checkout (codici backend noti). Il correlationId è mostrato sotto a parte. */
export function formatTestCheckoutError(e: unknown): string {
  if (e instanceof ApiRequestError) {
    switch (e.code) {
      case 'NETWORK_ERROR':
        return e.userMessage ?? e.message
      case 'INVALID_RESPONSE':
        return e.userMessage ?? 'Risposta non valida dal server.'
      case 'ODOO_DISABLED':
        return 'Integrazione Odoo disattivata sul server (ODOO_ENABLED=false).'
      case 'ODOO_MISCONFIGURED':
        return 'Configurazione Odoo incompleta sul server (URL o API key mancanti).'
      case 'ODOO_XMLRPC_PATH':
        return e.userMessage ?? 'URL XML-RPC Odoo non corretta: vedi ODOO_XMLRPC_URL sul server.'
      case 'ODOO_UPSTREAM_ERROR':
      case 'ODOO_UNEXPECTED':
        return e.userMessage ?? 'Errore dal gestionale tramite il proxy. Controlla IntegrationLog sul server.'
      case 'VALIDATION_ERROR':
        return `Validazione: ${e.userMessage ?? e.message}`
      case 'CART_NOT_FOUND':
        return 'Carrello non trovato o non associato a questa sessione. Ricarica la pagina e riprova.'
      case 'EMPTY_CART':
        return 'Il carrello è vuoto sul server.'
      case 'FORBIDDEN':
        return 'Accesso negato. Se usi INTEGRATIONS_TOKEN, imposta VITE_INTEGRATIONS_TOKEN uguale nel client.'
      case 'UNAUTHORIZED':
        return 'Sessione non valida. Ricarica la pagina.'
      case 'NO_SESSION':
        return 'Nessuna sessione: abilita i cookie e ricarica.'
      default:
        return e.userMessage ?? e.message
    }
  }
  return 'Errore imprevisto durante il test checkout.'
}
