export type OdooSearchHintCandidate = {
  query: string
  productTemplateId: number
  productName: string
  defaultCode: string | null
  totalQuantity: number
}

export type SearchHintsOdooPreview = {
  odooConfigured: boolean
  autoSyncEnabled: boolean
  staleHours: number
  lookbackDays: number
  limit: number
  currentHints: string[]
  lastOdooSyncedAt: string | null
  isStale: boolean
  suggestions: OdooSearchHintCandidate[]
}

export type SearchHintsOdooApplyResult = {
  lookbackDays: number
  limit: number
  hints: string[]
  suggestions: OdooSearchHintCandidate[]
  updatedLocales: string[]
  updatedAt: string
}
