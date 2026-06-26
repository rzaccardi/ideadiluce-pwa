import { adminApi } from '@/lib/api'
import { taxRulesStore, type TaxRuleRow } from './tax-rules.store'

export async function fetchTaxRules() {
  taxRulesStore.isLoading = true
  taxRulesStore.error = null
  try {
    taxRulesStore.rules = await adminApi<TaxRuleRow[]>('/admin/tax-rules')
  } catch (e) {
    taxRulesStore.error = String(e)
  } finally {
    taxRulesStore.isLoading = false
  }
}

export async function saveTaxRule(id: string, patch: Partial<TaxRuleRow>) {
  await adminApi<TaxRuleRow>(`/admin/tax-rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  await fetchTaxRules()
}

export async function createTaxRule(body: Omit<TaxRuleRow, 'id' | 'createdAt' | 'updatedAt'>) {
  await adminApi<TaxRuleRow>('/admin/tax-rules', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  await fetchTaxRules()
}

export async function deleteTaxRule(id: string) {
  await adminApi(`/admin/tax-rules/${id}`, { method: 'DELETE' })
  await fetchTaxRules()
}
