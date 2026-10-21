'use client'

import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  advanceCheckoutStep,
  applyResolvedAddress,
  canAdvanceFromStep,
  canFetchShippingQuotes,
  checkoutStore,
  freeShippingSelectionLocked,
  hasCheckoutContactFromProfile,
  isShippingBlockedByMissingPhone,
  initBillingFromShipping,
  canUseDropship,
  isBusinessCheckout,
  isBusinessAnagraficaComplete,
  isRomePickupEligible,
  refreshShippingQuotesIfNeeded,
  selectCheckoutDropshipAddress,
  selectCheckoutShippingAddress,
  selectShippingMethod,
  setBillingSameAsShipping,
  setDeliveryRecipientMode,
  updateCheckoutAddress,
  updateDeliveryRecipientField,
  updateDropshipAddress,
} from '@/features/checkout'
import { authStore } from '@/features/auth'
import { cartStore } from '@/features/cart/cart.store'
import { isCheckoutAddressValid, mergeResolvedStreetNumber } from '@/lib/checkout-address.validators'
import { resolveCartMaxLeadTimeDays } from '@/lib/product-availability'
import { CheckoutAccountSection } from './CheckoutAccountSection'
import { PhonePrefixField } from '@/components/PhonePrefixField'
import { CheckoutAddressSection } from './CheckoutAddressSection'
import { CourierNotesField } from './CheckoutAddressFields'
import { CheckoutShippingOptions } from './CheckoutShippingOptions'
import { ShippingAddressPicker } from '@/components/account/ShippingAddressPicker'
import { formatShippingAddressSelectOption, OTHER_SHIPPING_SELECTION } from '@/lib/shipping-addresses'
import {
  CheckoutInfoNote,
  CheckoutPanel,
  CheckoutSegmentControl,
  CheckoutToggleCheckbox,
} from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import {
  CheckoutActionRow,
  StripeControlledInput,
  StripeFieldGroup,
  StripeFieldLabel,
  StripePayButton,
  StripeSectionTitle,
  StripeSelect,
} from './StripeFields'
import { CheckoutStepBackButton } from './CheckoutStepBackButton'

type Props = {
  /** Pagina unica: niente back/continua e niente sezione account duplicata. */
  embedded?: boolean
  disabled?: boolean
}

export function CheckoutAddressesStep({ embedded = false, disabled = false }: Props) {
  const { t, tParams } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const auth = useSnapshot(authStore)
  const cart = useSnapshot(cartStore)
  const deliveryEstimateDays =
    resolveCartMaxLeadTimeDays(cart.cart?.items ?? []) ?? checkout.deliveryEstimateDays
  const business = isBusinessCheckout()
  const dropshipEnabled = canUseDropship()
  const stepBusy =
    disabled ||
    checkout.isLoading ||
    checkout.initLoadingPhase != null ||
    checkout.addressPrefillLoading
  const recipient = checkout.deliveryRecipient
  const deliveryMode = recipient.mode ?? 'self'
  const savedAddresses = checkout.savedShippingAddresses.filter((address) => !address.dropship)
  const dropshipRecipients = checkout.savedShippingAddresses.filter((address) => address.dropship)
  const hasSavedShippingAddresses = savedAddresses.length > 0
  const hasMultipleSavedShippingAddresses = savedAddresses.length > 1
  const selectedSavedId = checkout.selectedShippingAddressId
  const billingSameAsShipping = checkout.draft.billingSameAsShipping
  // Loggato + consegna a sé: toggle forzato checked (billing = shipping verso Odoo).
  const forceBillingSameAsShipping = auth.isAuthenticated && deliveryMode === 'self'
  const showPrimaryShippingForm =
    deliveryMode === 'self' &&
    (selectedSavedId === OTHER_SHIPPING_SELECTION || !hasSavedShippingAddresses)
  const showSavedShippingOnly =
    deliveryMode === 'self' &&
    hasSavedShippingAddresses &&
    selectedSavedId !== OTHER_SHIPPING_SELECTION
  const showNewDropshipForm =
    deliveryMode === 'other' && selectedSavedId === OTHER_SHIPPING_SELECTION
  const shippingComplete =
    isCheckoutAddressValid(checkout.draft.shipping) &&
    (!business || isBusinessAnagraficaComplete())
  const addressReady = canFetchShippingQuotes()
  // Accesso esplicito per reattività valtio.
  void checkout.draft.billing.phone
  void checkout.draft.shipping.phone
  void checkout.deliveryRecipient.phone
  const phoneBlockingShipping = isShippingBlockedByMissingPhone()
  /** Destinazione incompleta (non solo telefono): pulse sul campo via. */
  const highlightIncompleteShippingAddress =
    !addressReady && !phoneBlockingShipping && !stepBusy
  // Nome/cognome/telefono restano in anagrafica contatto; qui solo indirizzo.
  // Telefono in Addresses solo se loggato e ancora mancante (fallback).
  const hideShippingPerson = true
  const hasPhone =
    Boolean(checkout.draft.shipping.phone?.trim()) || Boolean(checkout.draft.billing.phone?.trim())
  const hideShippingPhone =
    !auth.isAuthenticated ||
    (!phoneBlockingShipping && hasPhone && hasCheckoutContactFromProfile())
  // Non includere shippingSelectingRef: la selezione è ottimistica; Continua resta
  // disabilitato da canAdvance (shippingSelectionPersisted) senza bloccare la pagina.
  const continueBusy = stepBusy || checkout.shippingQuotesLoading

  useEffect(() => {
    if (checkoutStore.deliveryRecipient.mode == null) {
      setDeliveryRecipientMode('self')
    }
    if (!checkoutStore.selectedShippingAddressId && checkoutStore.savedShippingAddresses.length === 0) {
      initBillingFromShipping()
    }
  }, [])

  // Loggato + self: ripristina always-on same-as-shipping se lo store era rimasto a false.
  useEffect(() => {
    if (!forceBillingSameAsShipping) return
    if (checkoutStore.draft.billingSameAsShipping) return
    setBillingSameAsShipping(true)
  }, [forceBillingSameAsShipping])

  // Spedizione-first: se stesso indirizzo, allinea fatturazione ← spedizione.
  useEffect(() => {
    if (!forceBillingSameAsShipping && !checkout.draft.billingSameAsShipping) return
    if ((checkout.deliveryRecipient.mode ?? 'self') !== 'self') return
    if (!shippingComplete) return
    if (phoneBlockingShipping) return
    const bill = checkoutStore.draft.billing
    const ship = checkoutStore.draft.shipping
    const drifted =
      bill.line1 !== ship.line1 ||
      bill.streetNumber !== ship.streetNumber ||
      bill.isSnc !== ship.isSnc ||
      bill.city !== ship.city ||
      bill.postalCode !== ship.postalCode ||
      bill.province !== ship.province ||
      bill.country !== ship.country ||
      (bill.phone ?? '') !== (ship.phone ?? '')
    if (!drifted) return
    initBillingFromShipping()
  }, [
    shippingComplete,
    forceBillingSameAsShipping,
    checkout.draft.billingSameAsShipping,
    checkout.deliveryRecipient.mode,
    checkout.draft.billing,
    checkout.draft.shipping,
    phoneBlockingShipping,
  ])

  // Quando l’indirizzo (spedizione-first / saved) diventa valido → refresh quote.
  // Include selectedShippingAddressId + billing.phone: da loggato il telefono può
  // arrivare dal profilo/billing senza cambiare i campi via/CAP dello shipping.
  useEffect(() => {
    if (phoneBlockingShipping) return
    if (checkout.initLoadingPhase != null || checkout.addressPrefillLoading) return
    if (!canFetchShippingQuotes()) return
    void refreshShippingQuotesIfNeeded().catch(() => {})
  }, [
    addressReady,
    phoneBlockingShipping,
    checkout.initLoadingPhase,
    checkout.addressPrefillLoading,
    checkout.selectedShippingAddressId,
    checkout.draft.shipping.line1,
    checkout.draft.shipping.streetNumber,
    checkout.draft.shipping.isSnc,
    checkout.draft.shipping.city,
    checkout.draft.shipping.postalCode,
    checkout.draft.shipping.province,
    checkout.draft.shipping.country,
    checkout.draft.shipping.phone,
    checkout.draft.billing.phone,
  ])

  return (
    <section className={cn(embedded ? 'space-y-4' : 'space-y-5', disabled && 'pointer-events-none opacity-60')}>
      {!embedded && auth.me ? <CheckoutAccountSection /> : null}

      {auth.me?.isProfessional ? (
        <CheckoutInfoNote>{t('checkout.billing.professionalActive')}</CheckoutInfoNote>
      ) : null}

      {/* Indirizzo di spedizione (primario) */}
      <div className="space-y-4">
        <StripeSectionTitle>{t('checkout.shippingAddress')}</StripeSectionTitle>

        {dropshipEnabled ? (
          <CheckoutSegmentControl<'self' | 'other'>
            value={deliveryMode}
            options={(['self', 'other'] as const).map((m) => ({
              value: m,
              label: t(`checkout.deliveryRecipient.${m}.title`),
            }))}
            onChange={(m) => setDeliveryRecipientMode(m)}
          />
        ) : null}

        {deliveryMode === 'self' && hasMultipleSavedShippingAddresses ? (
          <>
            <p className="text-sm text-idl-muted">{t('checkout.shipping.savedAddressesHint')}</p>
            <StripeFieldGroup>
              <StripeSelect
                id="checkout-saved-shipping"
                name="checkout-saved-shipping"
                aria-label={t('checkout.shippingAddress')}
                value={selectedSavedId ?? ''}
                disabled={stepBusy}
                onChange={(event) => selectCheckoutShippingAddress(event.target.value)}
              >
                {savedAddresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {formatShippingAddressSelectOption(address)}
                    {address.isDefault ? ` (${t('account.addresses.default')})` : ''}
                  </option>
                ))}
                <option value={OTHER_SHIPPING_SELECTION}>{t('checkout.shipping.useOtherAddress')}</option>
              </StripeSelect>
            </StripeFieldGroup>
          </>
        ) : deliveryMode === 'self' && hasSavedShippingAddresses ? (
          <>
            <p className="text-sm text-idl-muted">{t('checkout.shipping.savedAddressesHint')}</p>
            <ShippingAddressPicker
              addresses={savedAddresses}
              selectedId={selectedSavedId}
              disabled={stepBusy}
              onSelect={(id) => selectCheckoutShippingAddress(id)}
              extraOption={{
                id: OTHER_SHIPPING_SELECTION,
                title: t('checkout.shipping.useOtherAddress'),
              }}
            />
          </>
        ) : null}

        {showPrimaryShippingForm ? (
          <>
            <CheckoutAddressSection
              title={t('checkout.shippingAddress')}
              prefix="ship"
              showTitle={false}
              hideContactFields={hideShippingPerson}
              highlightPhoneError={phoneBlockingShipping && !hideShippingPhone}
              highlightIncompleteAddress={highlightIncompleteShippingAddress}
              disabled={stepBusy}
              address={checkout.draft.shipping}
              showCourierNotes
              onChange={(key, value) => updateCheckoutAddress('shipping', key, value)}
              onAddressResolved={(resolved) =>
                void applyResolvedAddress('shipping', resolved).catch(() => {})
              }
            />
            {hideShippingPerson && !hideShippingPhone ? (
              <div>
                <StripeFieldLabel htmlFor="ship-phone">{t('common.phone')}</StripeFieldLabel>
                <StripeFieldGroup
                  className={
                    phoneBlockingShipping
                      ? 'border-red-500 shadow-none ring-2 ring-red-200'
                      : undefined
                  }
                >
                  <PhonePrefixField
                    id="ship-phone"
                    name="ship-phone"
                    value={checkout.draft.shipping.phone ?? ''}
                    defaultCountry={checkout.draft.shipping.country}
                    required
                    invalid={phoneBlockingShipping}
                    disabled={stepBusy}
                    onValueChange={(value) => updateCheckoutAddress('shipping', 'phone', value)}
                  />
                </StripeFieldGroup>
                {phoneBlockingShipping ? (
                  <p
                    className="mt-2 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                    role="alert"
                  >
                    {t('checkout.shipping.phoneRequired')}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        {showSavedShippingOnly ? (
          <div>
            <StripeFieldLabel htmlFor="ship-courier-notes">{t('checkout.address.courierNotes')}</StripeFieldLabel>
            <StripeFieldGroup>
              <CourierNotesField
                id="ship-courier-notes"
                name="ship-courier-notes"
                placeholder={t('checkout.address.courierNotes')}
                value={checkout.draft.shipping.courierNotes ?? ''}
                onValueChange={(value) => updateCheckoutAddress('shipping', 'courierNotes', value)}
              />
            </StripeFieldGroup>
          </div>
        ) : null}

        {deliveryMode === 'self' ? (
          <CheckoutToggleCheckbox
            checked={forceBillingSameAsShipping || billingSameAsShipping}
            disabled={stepBusy || forceBillingSameAsShipping}
            onChange={(checked) => {
              if (forceBillingSameAsShipping) return
              setBillingSameAsShipping(checked)
            }}
            label={t('checkout.billingSameAsShipping')}
          />
        ) : null}

        {deliveryMode === 'self' && !forceBillingSameAsShipping && !billingSameAsShipping ? (
          <CheckoutPanel className="space-y-4 bg-idl-tech-panel">
            <StripeSectionTitle>{t('checkout.billingAddress')}</StripeSectionTitle>
            <CheckoutAddressSection
              title={t('checkout.billingAddress')}
              prefix="bill"
              showTitle={false}
              hideContactFields={hideShippingPerson}
              disabled={stepBusy}
              address={checkout.draft.billing}
              onChange={(key, value) => updateCheckoutAddress('billing', key, value)}
              onAddressResolved={(resolved) =>
                void applyResolvedAddress('billing', resolved).catch(() => {})
              }
            />
          </CheckoutPanel>
        ) : null}

        {dropshipEnabled && deliveryMode === 'other' ? (
          <CheckoutPanel className="space-y-4 bg-idl-tech-panel">
            <p className="text-sm text-idl-muted">{t('checkout.deliveryRecipient.savedHint')}</p>
            {dropshipRecipients.length > 0 ? (
              <ShippingAddressPicker
                addresses={dropshipRecipients}
                selectedId={selectedSavedId}
                disabled={stepBusy}
                onSelect={(id) => selectCheckoutDropshipAddress(id)}
                extraOption={{
                  id: OTHER_SHIPPING_SELECTION,
                  title: t('checkout.deliveryRecipient.newRecipient'),
                }}
              />
            ) : (
              <p className="text-sm text-idl-muted">{t('checkout.deliveryRecipient.emptyRecipients')}</p>
            )}
            {showNewDropshipForm || dropshipRecipients.length === 0 ? (
              <>
                <StripeFieldGroup>
                  <StripeControlledInput
                    name="recipient-company"
                    placeholder={t('checkout.deliveryRecipient.name')}
                    value={recipient.company || [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')}
                    onValueChange={(value) => {
                      updateDeliveryRecipientField('company', value)
                      updateDeliveryRecipientField('firstName', value)
                      updateDeliveryRecipientField('lastName', '')
                    }}
                  />
                </StripeFieldGroup>
                <div>
                  <StripeFieldGroup
                    className={
                      phoneBlockingShipping
                        ? 'border-red-500 ring-2 ring-red-200'
                        : undefined
                    }
                  >
                    <PhonePrefixField
                      name="recipient-phone"
                      value={recipient.phone}
                      defaultCountry={checkout.dropshipAddress.country}
                      required
                      invalid={phoneBlockingShipping}
                      onValueChange={(value) => updateDeliveryRecipientField('phone', value)}
                    />
                  </StripeFieldGroup>
                  {phoneBlockingShipping ? (
                    <p className="mt-1.5 text-sm font-medium text-red-600">
                      {t('checkout.shipping.phoneRequired')}
                    </p>
                  ) : null}
                </div>
                <CheckoutAddressSection
                  title={t('checkout.deliveryRecipient.addressTitle')}
                  prefix="dropship"
                  showTitle={false}
                  hideContactFields
                  highlightIncompleteAddress={
                    highlightIncompleteShippingAddress &&
                    (showNewDropshipForm || dropshipRecipients.length === 0)
                  }
                  disabled={stepBusy}
                  address={checkout.dropshipAddress}
                  onChange={(key, value) => updateDropshipAddress(key, value)}
                  onAddressResolved={(resolved) => {
                    const merged = mergeResolvedStreetNumber(checkoutStore.dropshipAddress, resolved)
                    updateDropshipAddress('line1', merged.line1)
                    updateDropshipAddress('streetNumber', merged.streetNumber)
                    updateDropshipAddress('isSnc', merged.isSnc)
                    updateDropshipAddress('line2', resolved.line2 ?? '')
                    updateDropshipAddress('city', resolved.city)
                    updateDropshipAddress('postalCode', resolved.postalCode)
                    updateDropshipAddress('province', resolved.province ?? '')
                    updateDropshipAddress('country', resolved.country)
                  }}
                />
                <p className="text-xs text-idl-muted">{t('checkout.deliveryRecipient.notSavedHint')}</p>
              </>
            ) : null}
          </CheckoutPanel>
        ) : null}
      </div>

      {/* Metodi di spedizione: sempre visibili; refresh quote quando indirizzo valido */}
      <div className="space-y-4 border-t border-idl-tech-border pt-5">
        <StripeSectionTitle>{t('checkout.shipping.title')}</StripeSectionTitle>

        <CheckoutShippingOptions
          quotes={checkout.shippingQuotes}
          selectedRef={checkout.selectedShippingMethodRef}
          selectingRef={checkout.shippingSelectingRef}
          loading={
            addressReady && !phoneBlockingShipping && checkout.shippingQuotesLoading
          }
          blocked={!addressReady || phoneBlockingShipping}
          blockedReason={phoneBlockingShipping ? t('checkout.shipping.phoneRequired') : undefined}
          selectionLocked={freeShippingSelectionLocked()}
          onSelect={(ref) => {
            void selectShippingMethod(ref).catch(() => {})
          }}
        />

        {addressReady ? (
          <>
            {freeShippingSelectionLocked() ? (
              <CheckoutInfoNote tone="success">
                {t('checkout.shipping.freeShippingLockedHint')}
              </CheckoutInfoNote>
            ) : null}

            {deliveryEstimateDays != null ? (
              <CheckoutInfoNote>
                {tParams('checkout.shipping.deliveryEstimate', { days: deliveryEstimateDays })}
              </CheckoutInfoNote>
            ) : null}

            {!isRomePickupEligible(checkout.draft.shipping) &&
            checkout.draft.shipping.country.toUpperCase() === 'IT' &&
            checkout.shippingQuotes.length > 0 ? (
              <p className="text-sm text-idl-muted">{t('checkout.shipping.pickupRomeOnly')}</p>
            ) : null}
          </>
        ) : null}
      </div>

      {!embedded ? (
        <CheckoutActionRow>
          <CheckoutStepBackButton disabled={continueBusy} />
          <StripePayButton
            className="min-w-0 flex-1"
            disabled={!canAdvanceFromStep('addresses') || continueBusy}
            loading={continueBusy}
            onClick={() => void advanceCheckoutStep()}
          >
            {continueBusy ? t('checkout.processing') : t('checkout.continueToPayment')}
          </StripePayButton>
        </CheckoutActionRow>
      ) : null}
    </section>
  )
}
