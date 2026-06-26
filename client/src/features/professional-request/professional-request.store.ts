import { proxy } from 'valtio'

export const professionalRequestStore = proxy({
  summary: null as import('@/types/dto').ProfessionalRequestSummaryDTO | null,
  isLoading: false,
  error: null as string | null,
  loaded: false,
})
