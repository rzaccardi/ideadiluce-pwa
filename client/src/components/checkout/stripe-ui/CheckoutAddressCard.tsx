'use client'

import type { AddressInput } from '@/types/integrations'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import { CheckoutAddressFields } from './CheckoutAddressFields'
import { formatCheckoutAddressSummary } from './checkout-address-format'
import { CheckoutEyebrowLabel, CheckoutPanel } from './CheckoutStepPrimitives'

type Props = {
  prefix: string
  address: AddressInput
  detailsUnlocked: boolean
  showCourierNotes?: boolean
  focusStreetNumber?: boolean
  onChange: <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => void
  onToggleDetails: () => void
  onChangeAddress: () => void
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 1.5a5.25 5.25 0 0 0-5.25 5.25c0 3.938 5.25 9.75 5.25 9.75s5.25-5.812 5.25-9.75A5.25 5.25 0 0 0 9 1.5Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="6.75" r="1.75" fill="currentColor" />
    </svg>
  )
}

export function CheckoutAddressCard({
  prefix,
  address,
  detailsUnlocked,
  showCourierNotes,
  focusStreetNumber,
  onChange,
  onToggleDetails,
  onChangeAddress,
}: Props) {
  const { t } = useI18n()
  const summary = formatCheckoutAddressSummary(address)
  const line2 = address.line2?.trim()

  return (
    <CheckoutPanel className="overflow-hidden border-idl-tech-border bg-idl-tech-panel p-0 shadow-[0_1px_2px_rgba(20,22,27,0.04)]">
      <div className="flex gap-3 border-b border-[#ededea] bg-idl-tech-panel px-4 py-3.5 sm:px-5">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-idl-tech-panel text-[#9a7b33] shadow-sm ring-1 ring-[#e2e6eb]">
          <PinIcon />
        </span>
        <div className="min-w-0 flex-1">
          <CheckoutEyebrowLabel>{t('checkout.address.selectedTitle')}</CheckoutEyebrowLabel>
          <p className="text-[15px] font-semibold leading-snug text-idl-graphite">
            {summary.street || t('checkout.address.label')}
          </p>
          {summary.locality ? (
            <p className="mt-0.5 text-sm text-idl-muted">{summary.locality}</p>
          ) : null}
          {line2 ? <p className="mt-1 text-xs text-[#9298a3]">{line2}</p> : null}
        </div>
      </div>

      {detailsUnlocked ? (
        <div className="border-b border-[#ededea] px-4 py-4 sm:px-5">
          <p className="mb-3 text-[13px] font-semibold text-idl-graphite">{t('checkout.address.detailsTitle')}</p>
          <CheckoutAddressFields
            layout="card"
            prefix={prefix}
            address={address}
            locked={false}
            showCourierNotes={showCourierNotes}
            focusStreetNumber={focusStreetNumber}
            onChange={onChange}
          />
        </div>
      ) : null}

      <div
        className={cn(
          'flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5',
          detailsUnlocked ? 'bg-[#fafbfc]' : 'bg-idl-tech-panel',
        )}
      >
        <button
          type="button"
          onClick={onToggleDetails}
          className="text-sm font-semibold text-idl-graphite underline decoration-[#d0d5dc] underline-offset-2 hover:decoration-[#14161b]"
        >
          {detailsUnlocked ? t('checkout.address.lockEdits') : t('checkout.address.unlockEdits')}
        </button>
        <button
          type="button"
          onClick={onChangeAddress}
          className="text-sm font-semibold text-[#9a7b33] underline decoration-[#cdbfa5] underline-offset-2 hover:decoration-[#9a7b33]"
        >
          {t('checkout.address.changeAddress')}
        </button>
      </div>
    </CheckoutPanel>
  )
}
