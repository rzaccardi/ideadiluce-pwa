'use client'

import type { CheckoutStep } from '@/features/checkout'
import { CHECKOUT_STEP_ORDER, shouldSkipCheckoutStep } from '@/features/checkout'
import { checkoutFormTitleClass } from '@/components/checkout/stripe-ui/constants'
import { useI18n } from '@/hooks/use-i18n'
import type { MessageKey } from '@/i18n/messages'
import { cn } from '@/utils/cn'

type StepGroup = {
  id: string
  labelKey: MessageKey
  steps: CheckoutStep[]
}

/** Tre macro-step come nel mock HTML: Indirizzi · Spedizione · Pagamento */
const STEP_GROUPS: StepGroup[] = [
  {
    id: 'addresses',
    labelKey: 'checkout.steps.group.addresses',
    steps: ['account', 'customer_type', 'billing', 'shipping'],
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
  if (step === 'details') return 'billing'
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

function currentGroup(currentStep: CheckoutStep) {
  const active = groupIndex(currentStep)
  return STEP_GROUPS.filter((g) => g.steps.some((s) => visibleSteps().includes(s)))[active]
}

type Props = {
  currentStep: CheckoutStep
}

export function CheckoutStepIndicator({ currentStep }: Props) {
  const { t, tParams } = useI18n()
  const activeGroup = groupIndex(currentStep)
  const groups = STEP_GROUPS.filter((g) => g.steps.some((s) => visibleSteps().includes(s)))
  const current = currentGroup(currentStep) ?? groups[0]!

  return (
    <div className="mb-6 sm:mb-8">
      <header className="mb-4 sm:mb-6">
        <h1
          className={cn(
            checkoutFormTitleClass,
            'font-extrabold tracking-[-0.01em] text-[#14161b]',
          )}
        >
          {t('checkout.steps.title')}
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-[#6c727c] sm:text-sm">
          {tParams('checkout.stepProgress', { current: activeGroup + 1, total: groups.length })} ·{' '}
          {t(current.labelKey)}
        </p>
      </header>

      <nav aria-label={t('checkout.steps.navLabel')}>
        <ol className="grid grid-cols-3 gap-2 sm:gap-3.5 md:gap-4">
          {groups.map((group, index) => {
            const done = index < activeGroup
            const isCurrent = index === activeGroup
            return (
              <li key={group.id} className="flex min-w-0 flex-col gap-1.5">
                <div
                  className={cn(
                    'h-1 rounded-full transition-colors',
                    isCurrent
                      ? 'bg-[#f0ad57] shadow-[0_0_12px_rgba(240,173,87,0.45)]'
                      : done
                        ? 'bg-[#14161b]'
                        : 'bg-[#e2e6eb]',
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-bold leading-tight sm:text-xs',
                    isCurrent ? 'text-[#14161b]' : done ? 'text-[#6c727c]' : 'text-[#9298a3]',
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
