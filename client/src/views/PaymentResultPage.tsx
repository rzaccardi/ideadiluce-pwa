'use client'

/**
 * Esito pagamento / thank you: ordine confermato, bonifico pending o pagamento fallito.
 * In caso di errore, il retry riporta a `/checkout?retryOrder=…` preservando carrello e PwaOrder.
 */
export { ThankYouPage as PaymentResultPage } from '@/views/ThankYouPage'
