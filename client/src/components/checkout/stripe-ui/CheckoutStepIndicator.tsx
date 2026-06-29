'use client'

import type { CheckoutStep } from '@/features/checkout'
import { CHECKOUT_STEP_ORDER, checkoutStore, shouldSkipCheckoutStep } from '@/features/checkout'
import { authStore } from '@/features/auth'
import { useSnapshot } from 'valtio/react'
import { checkoutFormTitleClass } from '@/components/checkout/stripe-ui/constants'
import { checkoutStepPageTitleKey } from '@/components/checkout/stripe-ui/checkout-step-page-title'
import { checkoutStepPageSubtitleKey } from '@/components/checkout/stripe-ui/checkout-step-page-subtitle'
import { useI18n } from '@/hooks/use-i18n'
import type { MessageKey } from '@/i18n/messages'
import { cn } from '@/utils/cn'

type StepGroup = {
  id: string
  labelKey: MessageKey
  steps: CheckoutStep[]
}

/** Quattro macro-step: Account · Indirizzi · Spedizione · Pagamento */
const STEP_GROUPS: StepGroup[] = [
  {
    id: 'account',
    labelKey: 'checkout.steps.group.account',
    steps: ['account', 'customer_type'],
  },
  {
    id: 'addresses',
    labelKey: 'checkout.steps.group.indirizzi',
    steps: ['addresses'],
  },
  {
    id: 'shipping',
    labelKey: 'checkout.steps.group.shipping',
    steps: ['delivery_recipient', 'shipping_method'],
  },
  {
    id: 'payment',
    labelKey: 'checkout.steps.group.payment',
    steps: ['payment', 'review'],
  },
]

function visibleSteps(): CheckoutStep[] {
  return CHECKOUT_STEP_ORDER.filter((step) => !shouldSkipCheckoutStep(step))
}

function normalizeStep(step: CheckoutStep): CheckoutStep {
  if (step === 'details' || step === 'billing' || step === 'shipping') return 'addresses'
  if (step === 'payment_method') return 'payment'
  return step
}

function groupIndex(currentStep: CheckoutStep) {
  const visible = visibleSteps()
  const currentIdx = visible.indexOf(normalizeStep(currentStep))
  if (currentIdx < 0) return 0

  let idx = 0
  for (const group of STEP_GROUPS) {
    const groupSteps = group.steps.filter((s) => visible.includes(s))
    if (groupSteps.length === 0) continue
    const lastInGroup = groupSteps[groupSteps.length - 1]!
    const lastIdx = visible.indexOf(lastInGroup)
    if (currentIdx <= lastIdx) return idx
    idx += 1
  }
  return STEP_GROUPS.length - 1
}

type Props = {
  currentStep: CheckoutStep
}

export function CheckoutStepIndicator({ currentStep }: Props) {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const checkout = useSnapshot(checkoutStore)
  const activeGroup = groupIndex(currentStep)
  const groups = STEP_GROUPS.filter((g) => g.steps.some((s) => visibleSteps().includes(s)))
  const accountConfirmed = currentStep === 'account' && auth.isAuthenticated
  const pageTitle = t(
    checkoutStepPageTitleKey(currentStep, { accountConfirmed }),
  )
  const subtitleKey = checkoutStepPageSubtitleKey(currentStep, {
    accountConfirmed,
    billingSameAsShipping: checkout.draft.billingSameAsShipping,
  })
  const pageSubtitle = subtitleKey ? t(subtitleKey) : null

  return (
    <div className="mb-6 sm:mb-8">
      <header className="mb-4 sm:mb-6">
        <h1
          className={cn(
            checkoutFormTitleClass,
            'font-extrabold tracking-[-0.01em] text-idl-graphite',
          )}
        >
          {pageTitle}
        </h1>
        {pageSubtitle ? (
          <p className="mt-1.5 text-sm leading-relaxed text-idl-muted">{pageSubtitle}</p>
        ) : null}
      </header>

      <nav aria-label={t('checkout.steps.navLabel')}>
        <ol className="grid grid-cols-4 gap-2 sm:gap-3.5 md:gap-4">
          {groups.map((group, index) => {
            const done = index < activeGroup
            const isCurrent = index === activeGroup
            return (
              <li key={group.id} className="flex min-w-0 flex-col gap-1.5">
                <div
                  className={cn(
                    'h-1 rounded-full transition-colors',
                    isCurrent
                      ? 'bg-[#c9a24b] shadow-[0_0_12px_rgba(201, 162, 75,0.45)]'
                      : done
                        ? 'bg-[#14161b]'
                        : 'bg-[#e2e6eb]',
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-bold leading-tight sm:text-xs',
                    isCurrent ? 'text-idl-graphite' : done ? 'text-idl-muted' : 'text-[#9298a3]',
                  )}
                >
                  <span className="line-clamp-2 sm:line-clamp-none">{t(group.labelKey)}</span>
                </span>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
