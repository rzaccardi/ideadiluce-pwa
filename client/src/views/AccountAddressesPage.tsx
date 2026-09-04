'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  accountStore,
  clearAccountFeedback,
  createShippingAddress,
  deleteShippingAddress,
  loadShippingAddresses,
  selectShippingAddress,
  updateShippingAddress,
} from '@/features/account'
import { authStore } from '@/features/auth'
import { AccountSaveFeedback } from '@/components/account/AccountSaveFeedback'
import { ShippingAddressPicker } from '@/components/account/ShippingAddressPicker'
import { CheckoutAddressSection } from '@/components/checkout/stripe-ui/CheckoutAddressSection'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  addressInputToDto,
  emptyAddress,
  isAddressComplete,
} from '@/lib/address'
import type { AddressInput } from '@/types/integrations'
import type { UserShippingAddressDTO, UserShippingAddressListDTO } from '@/types/dto'
import { savedAddressToInput } from '@/lib/shipping-addresses'
import { useI18n } from '@/hooks/use-i18n'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { accountDcOutlineBtnClass, accountDcPrimaryBtnClass } from '@/components/account/dc/account-dc-styles'
import { FadeIn } from '@/components/motion'

type EditorMode = 'closed' | 'create' | 'edit'

export function AccountAddressesPage() {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const account = useSnapshot(accountStore)
  const [list, setList] = useState<UserShippingAddressListDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState<EditorMode>('closed')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<AddressInput>(emptyAddress)
  const [pendingDelete, setPendingDelete] = useState<UserShippingAddressDTO | null>(null)

  const refresh = useCallback(async () => {
    const next = await loadShippingAddresses()
    setList(next)
    return next
  }, [])

  useEffect(() => {
    if (!auth.me) return
    setLoading(true)
    void refresh()
      .catch(() => {
        accountStore.error = t('account.addresses.loadError')
      })
      .finally(() => setLoading(false))
  }, [auth.me, refresh, t])

  if (!auth.me) return null

  function updateDraft<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    clearAccountFeedback()
    setEditingId(null)
    setDraft({
      ...emptyAddress(),
      firstName: auth.me?.firstName || '',
      lastName: auth.me?.lastName || '',
      phone: auth.me?.phone || '',
    })
    setEditor('create')
  }

  function openEdit(address: UserShippingAddressDTO) {
    clearAccountFeedback()
    setEditingId(address.id)
    setDraft(savedAddressToInput(address))
    setEditor('edit')
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    clearAccountFeedback()
    if (!isAddressComplete(draft)) {
      accountStore.error = t('account.profile.validationError')
      return
    }
    const payload = addressInputToDto(draft)
    if (!payload) return
    try {
      const next =
        editor === 'edit' && editingId
          ? await updateShippingAddress(editingId, { ...payload, id: editingId, label: draft.label })
          : await createShippingAddress(payload)
      setList(next)
      setEditor('closed')
      setEditingId(null)
    } catch {
      /* errore in accountStore.error */
    }
  }

  async function onSelect(id: string) {
    clearAccountFeedback()
    try {
      setList(await selectShippingAddress(id))
    } catch {
      /* errore in accountStore.error */
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      setList(await deleteShippingAddress(pendingDelete.id))
      if (editingId === pendingDelete.id) {
        setEditor('closed')
        setEditingId(null)
      }
    } catch {
      /* errore in accountStore.error */
    } finally {
      setPendingDelete(null)
    }
  }

  const addresses = list?.addresses ?? []
  const selectedId = addresses.find((address) => address.isDefault)?.id ?? null
  const showForm = editor !== 'closed' || addresses.length === 0

  return (
    <FadeIn>
      <div className="space-y-[18px]">
        <AccountSaveFeedback />

        <AccountDcPanel
          title={t('account.nav.addresses')}
          description={t('account.addresses.description')}
          action={
            list?.canCreate || addresses.length === 0 ? (
              <button type="button" className={accountDcOutlineBtnClass} onClick={openCreate}>
                {t('account.addresses.add')}
              </button>
            ) : null
          }
        >
          {loading ? (
            <p className="text-[13.5px] text-idl-muted">{t('common.loading')}</p>
          ) : addresses.length > 0 ? (
            <div className="space-y-4">
              <ShippingAddressPicker
                addresses={addresses}
                selectedId={selectedId}
                onSelect={(id) => void onSelect(id)}
                disabled={account.isSaving}
              />
              <ul className="space-y-2">
                {addresses.map((address) =>
                  address.canEdit || address.canDelete ? (
                    <li key={`actions-${address.id}`} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                      <span className="font-semibold text-idl-graphite">{address.label}</span>
                      <span className="flex gap-3">
                        {address.canEdit ? (
                          <button
                            type="button"
                            className="font-semibold text-idl-amber underline-offset-2 hover:underline"
                            onClick={() => openEdit(address)}
                          >
                            {t('account.addresses.edit')}
                          </button>
                        ) : null}
                        {address.canDelete ? (
                          <button
                            type="button"
                            className="font-semibold text-red-700 underline-offset-2 hover:underline"
                            onClick={() => setPendingDelete(address)}
                          >
                            {t('account.addresses.delete')}
                          </button>
                        ) : null}
                      </span>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          ) : (
            <p className="text-[13.5px] text-idl-muted">{t('account.addresses.empty')}</p>
          )}
        </AccountDcPanel>

        {showForm ? (
          <form onSubmit={(e) => void onSave(e)}>
            <AccountDcPanel
              title={
                editor === 'edit' ? t('account.addresses.editTitle') : t('account.addresses.addTitle')
              }
            >
              <CheckoutAddressSection
                title={t('account.profile.shippingAddress')}
                prefix="account-shipping"
                address={draft}
                onChange={updateDraft}
              />
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={account.isSaving}
                  className={`${accountDcPrimaryBtnClass} disabled:opacity-60`}
                >
                  {account.isSaving ? t('account.profile.saving') : t('account.profile.save')}
                </button>
                {editor !== 'closed' && addresses.length > 0 ? (
                  <button
                    type="button"
                    className={accountDcOutlineBtnClass}
                    onClick={() => {
                      setEditor('closed')
                      setEditingId(null)
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                ) : null}
              </div>
            </AccountDcPanel>
          </form>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('account.addresses.deleteConfirmTitle')}
        description={t('account.addresses.deleteConfirmDescription')}
        confirmLabel={t('account.addresses.delete')}
        confirmPending={account.isSaving}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </FadeIn>
  )
}
