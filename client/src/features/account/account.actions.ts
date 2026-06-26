import { api } from '@/api/endpoints'
import { setAuthUser } from '@/features/auth/auth.store'
import { ApiRequestError } from '@/types/api'
import type { UserAddressDTO, UserDTO, PwaPaymentMethodDTO } from '@/types/dto'
import { accountStore } from './account.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Salvataggio fallito'
}

function applyPatchResult(result: { user: UserDTO; odooSyncFailed: boolean }, successMessage: string) {
  setAuthUser(result.user)
  accountStore.message = successMessage
  if (result.odooSyncFailed) {
    accountStore.odooSyncWarning = true
  }
  return result.user
}

export async function saveProfile(patch: {
  firstName?: string
  lastName?: string
  phone?: string | null
  shippingAddress?: UserAddressDTO | null
  preferredPaymentMethod?: PwaPaymentMethodDTO | null
}): Promise<UserDTO> {
  accountStore.isSaving = true
  accountStore.error = null
  accountStore.message = null
  try {
    const result = await api.users.patchMe(patch)
    return applyPatchResult(result, 'Profilo aggiornato.')
  } catch (e) {
    accountStore.error = errMessage(e)
    throw e
  } finally {
    accountStore.isSaving = false
  }
}

export async function saveBusiness(patch: {
  customerSegment?: 'retail' | 'business'
  companyName?: string
  vatNumber?: string
  fiscalCode?: string
  pec?: string
  sdiCode?: string
}): Promise<UserDTO> {
  accountStore.isSaving = true
  accountStore.error = null
  accountStore.message = null
  try {
    const result = await api.users.patchBusiness(patch)
    return applyPatchResult(result, 'Dati aziendali aggiornati.')
  } catch (e) {
    accountStore.error = errMessage(e)
    throw e
  } finally {
    accountStore.isSaving = false
  }
}

export function clearAccountFeedback() {
  accountStore.error = null
  accountStore.message = null
  accountStore.odooSyncWarning = false
}
