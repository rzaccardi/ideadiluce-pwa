import { api } from '@/api/endpoints'
import { ApiRequestError } from '@/types/api'
import { professionalRequestStore } from './professional-request.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Operazione non riuscita'
}

export async function fetchMyProfessionalRequest() {
  professionalRequestStore.isLoading = true
  professionalRequestStore.error = null
  try {
    professionalRequestStore.summary = await api.users.professionalRequest()
    professionalRequestStore.loaded = true
    return professionalRequestStore.summary
  } catch (e) {
    professionalRequestStore.error = errMessage(e)
    throw e
  } finally {
    professionalRequestStore.isLoading = false
  }
}

export function isProfessionalRequestPending(status: string | undefined) {
  if (!status) return false
  const normalized = status.toUpperCase()
  return normalized === 'NEW' || normalized === 'IN_REVIEW' || status === 'pending'
}

export function resetProfessionalRequestStore() {
  professionalRequestStore.summary = null
  professionalRequestStore.isLoading = false
  professionalRequestStore.error = null
  professionalRequestStore.loaded = false
}
