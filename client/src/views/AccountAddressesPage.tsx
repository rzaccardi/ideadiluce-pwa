'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
import { PhonePrefixField } from '@/components/PhonePrefixField'
import {
  StripeControlledInput,
  StripeFieldGroup,
  StripeFieldLabel,
} from '@/components/checkout/stripe-ui/StripeFields'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  addressInputToDto,
  emptyAddress,
  isAddressComplete,
} from '@/lib/address'
import type { AddressInput } from '@/types/integrations'
import type { UserShippingAddressDTO, UserShippingAddressListDTO } from '@/types/dto'
import { isUsableShippingAddress, savedAddressToInput } from '@/lib/shipping-addresses'
import { useI18n } from '@/hooks/use-i18n'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { accountDcOutlineBtnClass, accountDcPrimaryBtnClass } from '@/components/account/dc/account-dc-styles'
import { FadeIn } from '@/components/motion'

type EditorMode = 'closed' | 'create' | 'edit' | 'create_recipient' | 'edit_recipient'

export function AccountAddressesPage() {
  const { t, tParams } = useI18n()
  const auth = useSnapshot(authStore)
  const account = useSnapshot(accountStore)
  const [list, setList] = useState<UserShippingAddressListDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState<EditorMode>('closed')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<AddressInput>(emptyAddress)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [pendingDelete, setPendingDelete] = useState<UserShippingAddressDTO | null>(null)

  const b2bActive = Boolean(auth.me?.b2bActive)

  // Pulisce toast residui prima del mount di AccountSaveFeedback (altrimenti
  // un messaggio stale tipo "Indirizzo selezionato" scatta al primo paint).
  const feedbackClearedRef = useRef(false)
  if (!feedbackClearedRef.current) {
    feedbackClearedRef.current = true
    clearAccountFeedback()
  }

  const refresh = useCallback(async () => {
    const next = await loadShippingAddresses()
    setList(next)
    return next
  }, [])

  useEffect(() => {
    if (!auth.me) return
    clearAccountFeedback()
    setLoading(true)
    void refresh()
      .then((next) => {
        const usableOwn = (next.addresses ?? []).filter(
          (address) => !address.dropship && isUsableShippingAddress(address),
        )
        // Nuovo utente / stub Odoo: niente card selezionata, form “aggiungi” con anagrafica.
        if (usableOwn.length === 0) {
          setDraft((current) => {
            if (current.line1.trim() || current.city.trim() || current.postalCode.trim()) {
              return current
            }
            return {
              ...emptyAddress(),
              firstName: auth.me?.firstName || '',
              lastName: auth.me?.lastName || '',
              phone: auth.me?.phone || '',
            }
          })
        }
      })
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
    setRecipientEmail('')
    setDraft({
      ...emptyAddress(),
      firstName: auth.me?.firstName || '',
      lastName: auth.me?.lastName || '',
      phone: auth.me?.phone || '',
    })
    setEditor('create')
  }

  function openCreateRecipient() {
    clearAccountFeedback()
    setEditingId(null)
    setRecipientEmail('')
    setDraft({
      ...emptyAddress(),
      firstName: '',
      lastName: '',
      phone: '',
    })
    setEditor('create_recipient')
  }

  function openEdit(address: UserShippingAddressDTO) {
    clearAccountFeedback()
    setEditingId(address.id)
    setDraft(savedAddressToInput(address))
    setRecipientEmail('')
    setEditor(address.dropship ? 'edit_recipient' : 'edit')
  }

  function isRecipientEditor(mode: EditorMode) {
    return mode === 'create_recipient' || mode === 'edit_recipient'
  }

  function recipientComplete(address: AddressInput) {
    const name = address.firstName.trim() || address.lastName.trim()
    return Boolean(
      name &&
        address.line1.trim() &&
        address.city.trim() &&
        address.postalCode.trim() &&
        address.country.trim() &&
        address.phone?.trim(),
    )
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    clearAccountFeedback()
    const recipientMode = isRecipientEditor(editor)
    if (recipientMode) {
      if (!recipientComplete(draft)) {
        accountStore.error = t('account.profile.validationError')
        return
      }
    } else if (!isAddressComplete(draft)) {
      accountStore.error = t('account.profile.validationError')
      return
    }
    const name = draft.firstName.trim() || draft.lastName.trim()
    const payload = addressInputToDto(
      recipientMode
        ? { ...draft, firstName: name, lastName: draft.lastName.trim() || '-' }
        : draft,
    )
    if (!payload) return
    try {
      const next =
        (editor === 'edit' || editor === 'edit_recipient') && editingId
          ? await updateShippingAddress(editingId, { ...payload, id: editingId, label: draft.label || name })
          : await createShippingAddress({
              ...payload,
              label: draft.label || name,
              ...(recipientMode
                ? { recipient: 'third_party' as const, email: recipientEmail.trim() || undefined }
                : { recipient: 'own' as const }),
            })
      setList(next)
      setEditor('closed')
      setEditingId(null)
    } catch {
      /* errore in accountStore.error */
    }
  }

  const addresses = list?.addresses ?? []
  const ownAddresses = addresses.filter(
    (address) => !address.dropship && isUsableShippingAddress(address),
  )
  const recipientAddresses = addresses.filter(
    (address) => address.dropship && isUsableShippingAddress(address),
  )
  const selectedId = ownAddresses.find((address) => address.isDefault)?.id ?? null
  // Prima della risposta l'elenco è vuoto: senza questo gate il form “aggiungi”
  // lampeggia per tutta la fetch e poi sparisce se gli indirizzi ci sono già.
  const showOwnForm =
    editor === 'create' ||
    editor === 'edit' ||
    (!loading && ownAddresses.length === 0 && editor === 'closed')
  const showRecipientForm = editor === 'create_recipient' || editor === 'edit_recipient'

  async function onSelect(id: string) {
    if (id === selectedId) return
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

  function renderAddressActions(items: UserShippingAddressDTO[]) {
    return (
      <ul className="space-y-2">
        {items.map((address) =>
          address.canEdit || address.canDelete ? (
            <li
              key={`actions-${address.id}`}
              className="flex flex-wrap items-center justify-between gap-2 text-[13px]"
            >
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
          ) : (
            <li key={`sede-${address.id}`} className="text-[12.5px] text-idl-muted">
              {tParams('account.addresses.sedeHint', { label: address.label })}
            </li>
          ),
        )}
      </ul>
    )
  }

  return (
    <FadeIn>
      <div className="space-y-[18px]">
        <AccountSaveFeedback />

        <AccountDcPanel
          title={b2bActive ? t('account.addresses.ownTitle') : t('account.nav.addresses')}
          description={t('account.addresses.description')}
          action={
            !loading && (list?.canCreate || ownAddresses.length === 0) ? (
              <button type="button" className={accountDcOutlineBtnClass} onClick={openCreate}>
                {t('account.addresses.add')}
              </button>
            ) : null
          }
        >
          {loading ? (
            <p className="text-[13.5px] text-idl-muted">{t('common.loading')}</p>
          ) : ownAddresses.length > 0 ? (
            <div className="space-y-4">
              <ShippingAddressPicker
                addresses={ownAddresses}
                selectedId={selectedId}
                onSelect={(id) => void onSelect(id)}
                disabled={account.isSaving}
              />
              {renderAddressActions(ownAddresses)}
            </div>
          ) : showOwnForm ? null : (
            <p className="text-[13.5px] text-idl-muted">{t('account.addresses.empty')}</p>
          )}
        </AccountDcPanel>

        {b2bActive ? (
          <AccountDcPanel
            title={t('account.addresses.recipientsTitle')}
            description={t('account.addresses.recipientsDescription')}
            action={
              list?.canCreate ? (
                <button type="button" className={accountDcOutlineBtnClass} onClick={openCreateRecipient}>
                  {t('account.addresses.addRecipient')}
                </button>
              ) : null
            }
          >
            {loading ? (
              <p className="text-[13.5px] text-idl-muted">{t('common.loading')}</p>
            ) : recipientAddresses.length > 0 ? (
              <div className="space-y-4">
                <ShippingAddressPicker
                  addresses={recipientAddresses}
                  selectedId={null}
                  onSelect={(id) => openEdit(recipientAddresses.find((a) => a.id === id)!)}
                  disabled={account.isSaving}
                />
                {renderAddressActions(recipientAddresses)}
              </div>
            ) : (
              <p className="text-[13.5px] text-idl-muted">{t('account.addresses.recipientsEmpty')}</p>
            )}
          </AccountDcPanel>
        ) : null}

        {showOwnForm ? (
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
                {editor !== 'closed' && ownAddresses.length > 0 ? (
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

        {showRecipientForm ? (
          <form onSubmit={(e) => void onSave(e)}>
            <AccountDcPanel
              title={
                editor === 'edit_recipient'
                  ? t('account.addresses.editTitle')
                  : t('account.addresses.addRecipientTitle')
              }
            >
              <div className="space-y-4">
                <div>
                  <StripeFieldLabel htmlFor="recipient-name">
                    {t('account.addresses.recipientName')}
                  </StripeFieldLabel>
                  <StripeFieldGroup>
                    <StripeControlledInput
                      id="recipient-name"
                      name="recipient-name"
                      value={draft.firstName}
                      required
                      onValueChange={(value) => updateDraft('firstName', value)}
                    />
                  </StripeFieldGroup>
                </div>
                <div>
                  <StripeFieldLabel htmlFor="recipient-phone">{t('common.phone')}</StripeFieldLabel>
                  <StripeFieldGroup>
                    <PhonePrefixField
                      id="recipient-phone"
                      name="recipient-phone"
                      value={draft.phone ?? ''}
                      defaultCountry={draft.country}
                      required
                      onValueChange={(value) => updateDraft('phone', value)}
                    />
                  </StripeFieldGroup>
                </div>
                <div>
                  <StripeFieldLabel htmlFor="recipient-email">
                    {t('account.addresses.recipientEmail')}
                  </StripeFieldLabel>
                  <StripeFieldGroup>
                    <StripeControlledInput
                      id="recipient-email"
                      type="email"
                      name="recipient-email"
                      value={recipientEmail}
                      onValueChange={setRecipientEmail}
                    />
                  </StripeFieldGroup>
                </div>
                <CheckoutAddressSection
                  title={t('checkout.deliveryRecipient.addressTitle')}
                  prefix="account-recipient"
                  showTitle={false}
                  hideContactFields
                  address={draft}
                  onChange={updateDraft}
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={account.isSaving}
                  className={`${accountDcPrimaryBtnClass} disabled:opacity-60`}
                >
                  {account.isSaving ? t('account.profile.saving') : t('account.profile.save')}
                </button>
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
