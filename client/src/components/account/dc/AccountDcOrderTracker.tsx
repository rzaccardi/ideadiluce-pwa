'use client'

import type { OrderDetailDTO } from '@/types/dto'
import type { MessageKey } from '@/i18n/messages'
import { cn } from '@/utils/cn'

type TrackerStep = {
  id: string
  label: string
  hint: string
  state: 'done' | 'active' | 'upcoming'
}

function trackerSteps(
  order: OrderDetailDTO,
  t: (key: MessageKey) => string,
): TrackerStep[] {
  const failed = order.paymentStatus === 'failed' || order.status === 'payment_failed'
  const pending = order.paymentStatus === 'pending' || order.paymentStatus === 'not_started'
  const paid = order.paymentStatus === 'captured' || order.status === 'paid' || order.status === 'completed'
  const completed = order.status === 'completed'

  if (failed) {
    return [
      { id: '1', label: t('thankYou.tracker.confirmed'), hint: '—', state: 'upcoming' },
      { id: '2', label: t('thankYou.tracker.preparing'), hint: '—', state: 'upcoming' },
      { id: '3', label: t('thankYou.tracker.shipped'), hint: '—', state: 'upcoming' },
      { id: '4', label: t('thankYou.tracker.delivered'), hint: '—', state: 'upcoming' },
    ]
  }

  if (pending) {
    return [
      { id: '1', label: t('thankYou.tracker.confirmed'), hint: t('thankYou.tracker.now'), state: 'active' },
      { id: '2', label: t('thankYou.tracker.preparing'), hint: t('thankYou.tracker.afterPayment'), state: 'upcoming' },
      { id: '3', label: t('thankYou.tracker.shipped'), hint: '24/48h', state: 'upcoming' },
      { id: '4', label: t('thankYou.tracker.delivered'), hint: '—', state: 'upcoming' },
    ]
  }

  if (completed) {
    return [
      { id: '1', label: t('thankYou.tracker.confirmed'), hint: '—', state: 'done' },
      { id: '2', label: t('thankYou.tracker.preparing'), hint: '—', state: 'done' },
      { id: '3', label: t('thankYou.tracker.shipped'), hint: '—', state: 'done' },
      { id: '4', label: t('thankYou.tracker.delivered'), hint: t('thankYou.tracker.now'), state: 'done' },
    ]
  }

  return [
    { id: '1', label: t('thankYou.tracker.confirmed'), hint: t('thankYou.tracker.now'), state: 'done' },
    { id: '2', label: t('thankYou.tracker.preparing'), hint: paid ? t('thankYou.tracker.today') : '—', state: paid ? 'active' : 'upcoming' },
    { id: '3', label: t('thankYou.tracker.shipped'), hint: '24/48h', state: 'upcoming' },
    { id: '4', label: t('thankYou.tracker.delivered'), hint: '—', state: 'upcoming' },
  ]
}

function Tracker({ steps }: { steps: TrackerStep[] }) {
  return (
    <div className="flex items-start">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const dotClass =
          step.state === 'done'
            ? 'bg-[#1f9d57] text-white'
            : step.state === 'active'
              ? 'border-[2.5px] border-[#0c0c0d] bg-idl-tech-panel text-[#0c0c0d]'
              : 'border-2 border-[#cfd5dc] bg-idl-tech-panel text-[#9298a3]'

        return (
          <div key={step.id} className="relative flex-1 text-center">
            <div
              className={cn(
                'relative z-[2] mx-auto flex size-[34px] items-center justify-center rounded-full text-[13px] font-bold',
                dotClass,
              )}
            >
              {step.state === 'done' ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 6 L9 17 l-5-5" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            {!isLast ? (
              <div
                className={cn(
                  'absolute top-[17px] left-1/2 z-[1] h-[2.5px] w-full',
                  step.state === 'done' ? 'bg-[#1f9d57]' : 'bg-[#e2e6eb]',
                )}
                aria-hidden
              />
            ) : null}
            <div className={cn('mt-2.5 text-[13px] font-bold', step.state === 'upcoming' && 'font-semibold text-idl-muted')}>
              {step.label}
            </div>
            <div className="text-[11.5px] text-[#8b919b]">{step.hint}</div>
          </div>
        )
      })}
    </div>
  )
}

type Props = {
  order: OrderDetailDTO
  t: (key: MessageKey) => string
}

export function AccountDcOrderTracker({ order, t }: Props) {
  const failed = order.paymentStatus === 'failed' || order.status === 'payment_failed'
  if (failed) return null

  return (
    <div>
      <h3 className="mb-6 text-[17px] font-extrabold tracking-[-0.01em] text-idl-graphite">
        {t('thankYou.tracker.title')}
      </h3>
      <Tracker steps={trackerSteps(order, t)} />
    </div>
  )
}
