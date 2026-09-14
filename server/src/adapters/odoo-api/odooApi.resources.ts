import { asApiItems, odooApiV2Request, odooApiWebsiteQuery } from './odooApiClient.js'
import type {
  OdooApiAddress,
  OdooApiAddressWrite,
  OdooApiCustomer,
  OdooApiCustomerValidate,
  OdooApiCustomerWrite,
  OdooApiInvoice,
  OdooApiOrder,
  OdooApiOrderWrite,
  OdooApiPaymentResult,
  OdooApiPaymentWrite,
  OdooApiShipment,
  OdooApiStockItem,
} from './odooApi.types.js'

export async function odooApiValidateCustomer(
  body: OdooApiCustomerWrite,
  correlationId?: string,
): Promise<OdooApiCustomerValidate> {
  const { data } = await odooApiV2Request<OdooApiCustomerValidate>('/api/v2/customers/validate', {
    method: 'POST',
    body,
    correlationId,
  })
  return data
}

export async function odooApiUpsertCustomer(
  body: OdooApiCustomerWrite,
  correlationId?: string,
): Promise<OdooApiCustomer> {
  const { data } = await odooApiV2Request<OdooApiCustomer>('/api/v2/customers', {
    method: 'POST',
    body,
    correlationId,
  })
  return data
}

export async function odooApiGetCustomer(
  customerId: number,
  correlationId?: string,
): Promise<OdooApiCustomer> {
  const { data } = await odooApiV2Request<OdooApiCustomer>(`/api/v2/customers/${customerId}`, {
    correlationId,
  })
  return data
}

export async function odooApiCreateCustomerAddress(
  customerId: number,
  body: OdooApiAddressWrite,
  correlationId?: string,
): Promise<OdooApiAddress> {
  const { data } = await odooApiV2Request<OdooApiAddress>(`/api/v2/customers/${customerId}/addresses`, {
    method: 'POST',
    body,
    correlationId,
  })
  return data
}

export async function odooApiCreateOrder(
  body: OdooApiOrderWrite,
  correlationId?: string,
): Promise<OdooApiOrder> {
  const { data } = await odooApiV2Request<OdooApiOrder>('/api/v2/orders', {
    method: 'POST',
    body,
    correlationId,
  })
  return data
}

export async function odooApiGetOrder(orderId: number, correlationId?: string): Promise<OdooApiOrder> {
  const { data } = await odooApiV2Request<OdooApiOrder>(`/api/v2/orders/${orderId}`, { correlationId })
  return data
}

export async function odooApiListOrders(
  customerId: number,
  page = 1,
  correlationId?: string,
): Promise<OdooApiOrder[]> {
  const { data } = await odooApiV2Request<unknown>('/api/v2/orders', {
    query: { ...odooApiWebsiteQuery(), customer_id: customerId, page },
    correlationId,
  })
  return asApiItems<OdooApiOrder>(data)
}

export async function odooApiListOrderShipments(
  orderId: number,
  correlationId?: string,
): Promise<OdooApiShipment[]> {
  const { data } = await odooApiV2Request<unknown>(`/api/v2/orders/${orderId}/shipments`, {
    correlationId,
  })
  return asApiItems<OdooApiShipment>(data, ['shipments', 'items'])
}

export async function odooApiRegisterPayment(
  orderId: number,
  body: OdooApiPaymentWrite,
  correlationId?: string,
): Promise<{ status: number; data: OdooApiPaymentResult }> {
  return odooApiV2Request<OdooApiPaymentResult>(`/api/v2/orders/${orderId}/payments`, {
    method: 'POST',
    body,
    correlationId,
  })
}

export async function odooApiGetStock(
  variantIds: number[],
  correlationId?: string,
): Promise<OdooApiStockItem[]> {
  if (variantIds.length === 0) return []
  const { data } = await odooApiV2Request<unknown>('/api/v2/stock', {
    query: { ...odooApiWebsiteQuery(), ids: variantIds.join(',') },
    correlationId,
  })
  if (Array.isArray(data)) return data as OdooApiStockItem[]
  if (data && typeof data === 'object') {
    const rec = data as Record<string, unknown>
    if (Array.isArray(rec.items)) return rec.items as OdooApiStockItem[]
    return Object.entries(rec)
      .map(([id, value]) => {
        if (!value || typeof value !== 'object') return null
        const row = value as OdooApiStockItem
        return { ...row, id: row.id ?? Number(id) }
      })
      .filter((row): row is OdooApiStockItem => row != null && Number.isFinite(row.id))
  }
  return []
}

export async function odooApiListInvoices(
  customerId: number,
  correlationId?: string,
): Promise<OdooApiInvoice[]> {
  const { data } = await odooApiV2Request<unknown>('/api/v2/invoices', {
    query: { ...odooApiWebsiteQuery(), customer_id: customerId },
    correlationId,
  })
  return asApiItems<OdooApiInvoice>(data, ['invoices', 'items'])
}

export async function odooApiGetInvoicePdf(
  invoiceId: number,
  customerId: number,
  correlationId?: string,
): Promise<Buffer> {
  const { data } = await odooApiV2Request<Buffer>(`/api/v2/invoices/${invoiceId}/pdf`, {
    accept: 'bytes',
    query: { ...odooApiWebsiteQuery(), customer_id: customerId },
    correlationId,
  })
  return data
}
