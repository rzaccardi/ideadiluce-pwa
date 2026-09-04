import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import { ApiRequestError } from '@/types/api'
import type { InvoiceDTO } from '@/types/dto'
import { invoicesStore } from './invoices.store'

const INVOICES_LIST_TTL_MS = 60_000
let invoicesListFetchedAt = 0

function errMessage(e: unknown) {
  return e instanceof ApiRequestError
    ? (e.userMessage ?? e.message)
    : 'Impossibile caricare le fatture.'
}

async function loadInvoicesList() {
  invoicesStore.isListLoading = true
  invoicesStore.listError = null
  try {
    invoicesStore.list = await api.invoices.list()
    invoicesListFetchedAt = Date.now()
  } catch (e) {
    invoicesStore.listError = errMessage(e)
    invoicesStore.list = null
  } finally {
    invoicesStore.isListLoading = false
  }
}

export function fetchInvoicesList(options?: { force?: boolean }) {
  if (
    !options?.force &&
    invoicesStore.list != null &&
    !invoicesStore.listError &&
    Date.now() - invoicesListFetchedAt < INVOICES_LIST_TTL_MS
  ) {
    return Promise.resolve()
  }
  return dedupeAsync('invoices:list', loadInvoicesList)
}

export function resetInvoicesStore() {
  invoicesListFetchedAt = 0
  invoicesStore.list = null
  invoicesStore.isListLoading = false
  invoicesStore.listError = null
}

export function invoicePdfFilename(name: string): string {
  const safe = name.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'fattura'
  return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`
}

export async function downloadInvoicePdf(invoice: InvoiceDTO): Promise<void> {
  const blob = await api.invoices.downloadPdf(invoice.id)
  if (blob.size < 100) {
    throw new ApiRequestError(
      'INVOICE_PDF_UNAVAILABLE',
      'PDF download empty',
      502,
      undefined,
      'Impossibile scaricare il PDF della fattura.',
    )
  }
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
  const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46
  if (!isPdf && blob.type && !blob.type.includes('pdf') && !blob.type.includes('octet-stream')) {
    throw new ApiRequestError(
      'INVOICE_PDF_UNAVAILABLE',
      'PDF download invalid',
      502,
      undefined,
      'Impossibile scaricare il PDF della fattura.',
    )
  }
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = invoicePdfFilename(invoice.name)
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
