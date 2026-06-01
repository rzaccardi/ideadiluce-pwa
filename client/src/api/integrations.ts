import { apiClient } from '@/api/client'
import type { OdooCustomerPrefill, TestCheckoutInput, TestCheckoutResponse } from '@/types/integrations'

export function getOdooCustomerPrefill(email: string) {
  const q = new URLSearchParams({ email }).toString()
  return apiClient.get<OdooCustomerPrefill>(`/api/v1/integrations/odoo/customer-prefill?${q}`)
}

export function postOdooTestCheckout(body: TestCheckoutInput) {
  return apiClient.post<TestCheckoutResponse>('/api/v1/integrations/odoo/test-checkout', body)
}
