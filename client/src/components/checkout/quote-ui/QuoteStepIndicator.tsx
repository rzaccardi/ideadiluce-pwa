'use client'

import { checkoutFormTitleClass } from '@/components/checkout/stripe-ui/constants'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

export type QuoteStep = 'account' | 'details' | 'success'

type StepGroup = {
  id: QuoteStep
  labelKey: 'cart.quote.steps.group.account' | 'cart.quote.steps.group.details'
}

const STEP_GROUPS: StepGroup[] = [
  { id: 'account', labelKey: 'cart.quote.steps.group.account' },
  { id: 'details', labelKey: 'cart.quote.steps.group.details' },
]

function groupIndex(currentStep: QuoteStep) {
  if (currentStep === 'success') return STEP_GROUPS.length
  const idx = STEP_GROUPS.findIndex((group) => group.id === currentStep)
  return idx >= 0 ? idx : 0
}

type Props = {
  currentStep: QuoteStep
  accountConfirmed?: boolean
}

export function QuoteStepIndicator({ currentStep, accountConfirmed = false }: Props) {
  const { t } = useI18n()
  const activeGroup = groupIndex(currentStep)
  const pageTitle =
    currentStep === 'account'
      ? accountConfirmed
        ? t('cart.quote.steps.pageTitle.accountConfirm')
        : t('cart.quote.steps.pageTitle.account')
      : currentStep === 'details'
        ? t('cart.quote.steps.pageTitle.details')
        : t('cart.quote.success')
  const pageSubtitle =
    currentStep === 'account'
      ? t('cart.quote.steps.pageSubtitle.account')
      : currentStep === 'details'
        ? t('cart.quote.steps.pageSubtitle.details')
        : t('cart.quote.successPending')

  if (currentStep === 'success') {
    return (
      <header className="mb-6 sm:mb-8">
        <h1
          className={cn(
            checkoutFormTitleClass,
            'font-extrabold tracking-[-0.01em] text-[#14161b]',
          )}
        >
          {pageTitle}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[#6c727c]">{pageSubtitle}</p>
      </header>
    )
  }

  return (
    <div className="mb-6 sm:mb-8">
      <header className="mb-4 sm:mb-6">
        <h1
          className={cn(
            checkoutFormTitleClass,
            'font-extrabold tracking-[-0.01em] text-[#14161b]',
          )}
        >
          {pageTitle}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[#6c727c]">{pageSubtitle}</p>
      </header>

      <nav aria-label={t('cart.quote.steps.navLabel')}>
        <ol className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4">
          {STEP_GROUPS.map((group, index) => {
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
                  {t(group.labelKey)}
                </span>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
