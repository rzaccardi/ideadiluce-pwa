'use client'

import { useSnapshot } from 'valtio/react'
import { CheckoutAccountSection } from '@/components/checkout/stripe-ui/CheckoutAccountSection'
import { CheckoutAddressSection } from '@/components/checkout/stripe-ui/CheckoutAddressSection'
import { CheckoutInfoNote } from '@/components/checkout/stripe-ui/CheckoutStepPrimitives'
import {
  CheckoutActionRow,
  StripeBackButton,
  StripeFieldLabel,
  StripePayButton,
} from '@/components/checkout/stripe-ui/StripeFields'
import { authStore } from '@/features/auth'
import type { AddressInput } from '@/types/integrations'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  billingAddress: AddressInput
  notes: string
  onNotesChange: (value: string) => void
  onBillingChange: <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => void
  onBack: () => void
  onSubmit: () => void | Promise<void>
  submitting?: boolean
  submitDisabled?: boolean
  hasBlockedLines?: boolean
  noPurchasableLines?: boolean
}

export function QuoteDetailsStep({
  billingAddress,
  notes,
  onNotesChange,
  onBillingChange,
  onBack,
  onSubmit,
  submitting = false,
  submitDisabled = false,
  hasBlockedLines = false,
  noPurchasableLines = false,
}: Props) {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)

  return (
    <section className="space-y-5">
      {hasBlockedLines ? (
        <CheckoutInfoNote>{t('cart.unpurchasable.blockedCheckout')}</CheckoutInfoNote>
      ) : null}
      {noPurchasableLines ? (
        <CheckoutInfoNote>{t('cart.unpurchasable.noPurchasableLines')}</CheckoutInfoNote>
      ) : null}

      <CheckoutInfoNote>{t('cart.quote.estimateNotice')}</CheckoutInfoNote>

      {auth.me ? <CheckoutAccountSection /> : null}

      <CheckoutAddressSection
        title={t('checkout.billingAddress')}
        prefix="quote-billing"
        showTitle={false}
        address={billingAddress}
        onChange={onBillingChange}
      />

      <div>
        <StripeFieldLabel htmlFor="quote-notes">{t('cart.quote.notesLabel')}</StripeFieldLabel>
        <textarea
          id="quote-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          placeholder={t('cart.quote.notesPlaceholder')}
          className={cn(
            'idl-field block w-full rounded-[11px] border border-[#e2e6eb] bg-idl-tech-panel px-[15px] py-3.5',
            'text-[15px] outline-none shadow-[0_1px_1px_rgba(0,0,0,0.02)]',
            'focus:ring-2 focus:ring-[#c9a24b]/35 focus:ring-inset',
          )}
        />
      </div>

      <CheckoutActionRow>
        <StripeBackButton onClick={onBack} disabled={submitting} />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={submitDisabled || submitting}
          loading={submitting}
          onClick={() => void onSubmit()}
        >
          {submitting ? t('checkout.processing') : t('cart.quote.submit')}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
