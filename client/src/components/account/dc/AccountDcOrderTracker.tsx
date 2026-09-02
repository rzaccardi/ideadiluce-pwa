'use client'

import type { OrderDetailDTO } from '@/types/dto'
import type { MessageKey } from '@/i18n/messages'
import type { PwaLocale } from '@/lib/locale'
import { cn } from '@/utils/cn'
import { ExternalLink } from '@/lib/link-title'

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
  const ship = order.shipment?.status

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

  const delivered = ship === 'delivered'
  const outForDelivery = ship === 'out_for_delivery'
  const inTransit = ship === 'in_transit' || ship === 'shipped' || ship === 'exception'
  const preparing = !inTransit && !outForDelivery && !delivered

  return [
    {
      id: '1',
      label: t('thankYou.tracker.confirmed'),
      hint: '—',
      state: 'done',
    },
    {
      id: '2',
      label: t('thankYou.tracker.preparing'),
      hint: preparing ? t('thankYou.tracker.now') : '—',
      state: preparing ? 'active' : 'done',
    },
    {
      id: '3',
      label: t('thankYou.tracker.shipped'),
      hint: inTransit && !delivered && !outForDelivery ? t('thankYou.tracker.now') : '—',
      state: delivered || outForDelivery ? 'done' : inTransit ? 'active' : 'upcoming',
    },
    {
      id: '4',
      label: t('thankYou.tracker.delivered'),
      hint: delivered
        ? t('thankYou.tracker.now')
        : outForDelivery
          ? t('orderStatus.out_for_delivery')
          : '—',
      state: delivered ? 'done' : outForDelivery ? 'active' : 'upcoming',
    },
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
              ? 'border-[2.5px] border-idl-ink bg-idl-tech-panel text-idl-ink'
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

function formatStamp(value: string, locale: PwaLocale) {
  const tag =
    locale === 'EN' ? 'en-GB' : locale === 'ES' ? 'es-ES' : locale === 'FR' ? 'fr-FR' : locale === 'DE' ? 'de-DE' : locale === 'RO' ? 'ro-RO' : 'it-IT'
  return new Date(value).toLocaleString(tag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AccountDcShipmentPanel({
  order,
  t,
  locale,
}: {
  order: OrderDetailDTO
  t: (key: MessageKey) => string
  locale: PwaLocale
}) {
  const shipment = order.shipment
  if (!shipment || (!shipment.trackingNumber && shipment.status === 'preparing' && shipment.events.length === 0)) {
    return (
      <p className="text-sm text-idl-muted">{t('thankYou.tracker.trackingNote')}</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[11.5px] text-[#8b919b]">{t('orders.shipment.carrier')}</dt>
          <dd className="font-semibold text-idl-graphite">
            {shipment.carrierLabel ?? (shipment.carrier === 'fedex' ? 'FedEx' : shipment.carrier === 'dhl' ? 'DHL' : t('common.notAvailable'))}
          </dd>
        </div>
        <div>
          <dt className="text-[11.5px] text-[#8b919b]">{t('orders.shipment.tracking')}</dt>
          <dd className="font-mono text-[13px] font-semibold text-idl-graphite">
            {shipment.trackingUrl && shipment.trackingNumber ? (
              <ExternalLink
                href={shipment.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-idl-brass no-underline hover:underline"
              >
                {shipment.trackingNumber}
              </ExternalLink>
            ) : (
              shipment.trackingNumber ?? t('common.notAvailable')
            )}
          </dd>
        </div>
        {shipment.lastLocation ? (
          <div>
            <dt className="text-[11.5px] text-[#8b919b]">{t('orders.shipment.location')}</dt>
            <dd className="font-semibold text-idl-graphite">{shipment.lastLocation}</dd>
          </div>
        ) : null}
        {shipment.estimatedDeliveryAt && shipment.status !== 'delivered' ? (
          <div>
            <dt className="text-[11.5px] text-[#8b919b]">{t('orders.shipment.eta')}</dt>
            <dd className="font-semibold text-idl-graphite">{formatStamp(shipment.estimatedDeliveryAt, locale)}</dd>
          </div>
        ) : null}
        {shipment.deliveredAt ? (
          <div>
            <dt className="text-[11.5px] text-[#8b919b]">{t('orders.shipment.deliveredAt')}</dt>
            <dd className="font-semibold text-idl-graphite">{formatStamp(shipment.deliveredAt, locale)}</dd>
          </div>
        ) : null}
      </dl>
      {shipment.events.length > 0 ? (
        <ol className="mt-2 space-y-2 border-t border-idl-tech-border pt-3">
          {shipment.events.slice(0, 6).map((event) => (
            <li key={`${event.at}-${event.label}`} className="text-sm">
              <div className="font-semibold text-idl-graphite">{event.label}</div>
              <div className="text-[12px] text-idl-muted">
                {formatStamp(event.at, locale)}
                {event.location ? ` · ${event.location}` : ''}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
