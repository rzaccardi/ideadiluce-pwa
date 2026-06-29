'use client'

import type { ProductCardDTO, ThankYouOrderDTO, UserAddressDTO } from '@/types/dto'
import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'
import { formatMoney } from '@/lib/format'
import { paymentMethodLabel } from '@/lib/paymentLabels'
import { SectionContainer } from '@/components/site/primitives'
import { SiteImage } from '@/components/site/SiteImage'
import { BankTransferInstructionsTable } from '@/components/checkout/BankTransferInstructions'
import type { MessageKey } from '@/i18n/messages'
import { cn } from '@/utils/cn'

type Props = {
  order: ThankYouOrderDTO
  recommendations: ProductCardDTO[]
  isAuthenticated: boolean
}

type TrackerStep = {
  id: string
  label: string
  hint: string
  state: 'done' | 'active' | 'upcoming'
}

function formatShippingBlock(address: UserAddressDTO | null): string[] {
  if (!address) return []
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ')
  const locality = [address.postalCode, address.city].filter(Boolean).join(' ')
  const lines = [name, [address.line1, locality].filter(Boolean).join(', ')].filter(Boolean)
  if (address.phone?.trim()) lines.push(address.phone.trim())
  return lines
}

function trackerSteps(order: ThankYouOrderDTO, t: (key: MessageKey) => string): TrackerStep[] {
  const paid = order.paymentStatus === 'captured'
  const pending = order.paymentStatus === 'pending'

  if (pending) {
    return [
      { id: '1', label: t('thankYou.tracker.confirmed'), hint: t('thankYou.tracker.now'), state: 'active' },
      { id: '2', label: t('thankYou.tracker.preparing'), hint: t('thankYou.tracker.afterPayment'), state: 'upcoming' },
      { id: '3', label: t('thankYou.tracker.shipped'), hint: '24/48h', state: 'upcoming' },
      { id: '4', label: t('thankYou.tracker.delivered'), hint: '—', state: 'upcoming' },
    ]
  }

  return [
    { id: '1', label: t('thankYou.tracker.confirmed'), hint: t('thankYou.tracker.now'), state: 'done' },
    { id: '2', label: t('thankYou.tracker.preparing'), hint: paid ? t('thankYou.tracker.today') : '—', state: paid ? 'active' : 'upcoming' },
    { id: '3', label: t('thankYou.tracker.shipped'), hint: '24/48h', state: 'upcoming' },
    { id: '4', label: t('thankYou.tracker.delivered'), hint: '—', state: 'upcoming' },
  ]
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 52 52" width="42" height="42" fill="none" stroke="#1f9d57" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 27 l8 8 l16 -17" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6c727c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="1" y="6" width="15" height="12" rx="1.5" />
      <path d="M16 9 h4 l3 3 v6 h-7" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="19" cy="18" r="2" />
    </svg>
  )
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
              ? 'border-[2.5px] border-idl-amber bg-idl-tech-panel text-idl-amber'
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
            <div className={cn('mt-2.5 text-[13px] font-bold', step.state === 'upcoming' && 'font-semibold text-[#6c727c]')}>
              {step.label}
            </div>
            <div className="text-[11.5px] text-[#8b919b]">{step.hint}</div>
          </div>
        )
      })}
    </div>
  )
}

export function ThankYouPageView({ order, recommendations, isAuthenticated }: Props) {
  const { locale, t, tParams } = useI18n()
  const lp = useLocalePath()
  const steps = trackerSteps(order, t)
  const shippingLines = formatShippingBlock(order.shippingAddress)
  const currency = order.currencyCode || 'EUR'
  const subtotal =
    order.subtotalCents != null ? formatMoney(order.subtotalCents, currency) : null
  const shipping =
    order.shippingCents == null
      ? null
      : order.shippingCents <= 0
        ? t('thankYou.shippingFree')
        : formatMoney(order.shippingCents, currency)
  const total =
    order.amountTotal != null ? formatMoney(order.amountTotal, currency) : t('common.notAvailable')

  const isPaid = order.paymentStatus === 'captured'
  const isPending = order.paymentStatus === 'pending'

  const heroTitle = isPending
    ? t('thankYou.hero.pendingTitle')
    : order.customerFirstName
      ? tParams('thankYou.hero.confirmedTitle', { name: order.customerFirstName })
      : t('thankYou.hero.confirmedTitleGeneric')

  const heroEyebrow = isPending
    ? t('thankYou.hero.pendingEyebrow')
    : t('thankYou.hero.confirmedEyebrow')

  const registerHref = `${lp('/register')}?email=${encodeURIComponent(order.email)}`
  const ordersHref = lp(`/account/orders/${order.orderId}`)

  return (
    <div className="-mx-4 bg-idl-tech-panel sm:-mx-6 lg:-mx-12">
      <section className="border-b border-[#ededea] bg-idl-tech-panel py-10 text-center sm:py-12">
        <SectionContainer className="max-w-[1100px]">
          <div
            className="mx-auto mb-6 flex size-[78px] items-center justify-center rounded-full bg-[#e8f6ee]"
          >
            <CheckIcon />
          </div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-[#1f9d57]">{heroEyebrow}</div>
          <h1 className="mt-3.5 text-[clamp(1.75rem,4vw,2.125rem)] font-extrabold tracking-[-0.025em] text-idl-graphite">
            {heroTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-[560px] text-base leading-relaxed text-[#5b616b]">
            <>
              {t('thankYou.hero.emailPrefix')}{' '}
              <strong className="text-idl-graphite">{order.email}</strong>
              {isPending ? t('thankYou.hero.pendingBody') : t('thankYou.hero.confirmedBody')}
            </>
          </p>

          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-4 rounded-[10px] border border-[#e7eaee] bg-[#f7f8fa] px-5 py-3.5 sm:gap-[18px] sm:px-[22px]">
              <div className="text-left">
                <div className="text-[11.5px] text-[#8b919b]">{t('thankYou.orderNumber')}</div>
                <div className="font-mono text-[15px] font-semibold text-idl-graphite">
                  {order.displayOrderNumber}
                </div>
              </div>
              {isPaid ? (
                <>
                  <div className="hidden h-8 w-px bg-[#e2e6eb] sm:block" aria-hidden />
                  <div className="text-left">
                    <div className="text-[11.5px] text-[#8b919b]">{t('thankYou.estimatedDelivery')}</div>
                    <div className="text-[15px] font-bold text-idl-graphite">{t('thankYou.deliverySoon')}</div>
                  </div>
                </>
              ) : null}
          </div>
        </SectionContainer>
      </section>

      <SectionContainer className="max-w-[1100px] py-8 sm:py-10">
        <div className="grid items-start gap-7 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-[18px]">
            <div className="rounded-[14px] border border-[#e7eaee] bg-idl-tech-panel p-6 sm:p-[26px]">
                <h2 className="mb-6 text-[17px] font-extrabold tracking-[-0.01em]">
                  {t('thankYou.tracker.title')}
                </h2>
                <Tracker steps={steps} />
                <div className="mt-6 flex items-center gap-2.5 rounded-[9px] border border-[#e7eaee] bg-[#f7f8fa] px-[15px] py-3">
                  <TruckIcon />
                  <p className="flex-1 text-[13px] text-[#5b616b]">
                    {order.isStorePickup
                      ? t('thankYou.tracker.pickupNote')
                      : t('thankYou.tracker.trackingNote')}
                  </p>
                  {isAuthenticated ? (
                    <Link to={ordersHref} className="text-[13px] font-bold text-idl-amber">
                      {t('thankYou.tracker.trackCta')}
                    </Link>
                  ) : (
                    <span className="text-[13px] font-bold text-idl-amber">{t('thankYou.tracker.trackCta')}</span>
                  )}
                </div>
            </div>

            {order.lines.length > 0 ? (
              <div className="rounded-[14px] border border-[#e7eaee] bg-idl-tech-panel p-6 sm:p-[26px]">
                <h2 className="mb-[18px] text-[17px] font-extrabold tracking-[-0.01em]">
                  {t('thankYou.lines.title')}
                </h2>
                <ul className="divide-y divide-[#ededea]">
                  {order.lines.map((line) => (
                    <li key={`${line.productRef}-${line.variantRef ?? ''}`} className="flex gap-3.5 py-4 first:pt-0 last:pb-0">
                      <div className="relative size-[66px] shrink-0 overflow-hidden rounded-[9px] bg-[#f7f8fa]">
                        {line.imageUrl ? (
                          <SiteImage src={line.imageUrl} alt="" fill className="object-cover" sizes="66px" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[10px] text-[#8b919b]">{line.productRef}</div>
                        <div className="text-sm font-semibold leading-snug text-idl-graphite">
                          {line.productName ?? line.productRef}
                        </div>
                        <div className="text-[12.5px] text-[#6c727c]">
                          {tParams('thankYou.lines.quantity', { count: line.quantity })}
                        </div>
                      </div>
                      <div className="text-sm font-bold whitespace-nowrap text-idl-graphite">
                        {line.lineTotalCents != null
                          ? formatMoney(line.lineTotalCents, currency)
                          : '—'}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col items-start justify-between gap-6 rounded-[14px] border border-[#f0e3d0] bg-[#fbf4ea] p-6 sm:flex-row sm:items-center sm:p-[24px_26px]">
              <div>
                <h2 className="text-base font-extrabold text-idl-graphite">{t('thankYou.support.title')}</h2>
                <p className="mt-1.5 max-w-[520px] text-[13.5px] leading-relaxed text-[#7a6a52]">
                  {t('thankYou.support.body')}
                </p>
              </div>
              <Link
                to={lp('/contatti')}
                className="shrink-0 rounded-[7px] bg-idl-amber px-[18px] py-3 text-[13.5px] font-bold text-white transition hover:brightness-95"
              >
                {t('thankYou.support.cta')}
              </Link>
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-[14px] border border-[#e7eaee] bg-idl-tech-panel p-[22px]">
              <h2 className="mb-4 text-base font-extrabold tracking-[-0.01em]">{t('thankYou.summary.title')}</h2>
              {subtotal ? (
                <div className="flex justify-between py-1 text-[13.5px] text-[#5b616b]">
                  <span>{t('thankYou.summary.subtotal')}</span>
                  <span>{subtotal}</span>
                </div>
              ) : null}
              {shipping != null ? (
                <div className="flex justify-between py-1 text-[13.5px] text-[#5b616b]">
                  <span>{t('thankYou.summary.shipping')}</span>
                  <span className={order.shippingCents === 0 ? 'font-bold text-[#1f9d57]' : undefined}>
                    {shipping}
                  </span>
                </div>
              ) : null}
              <div className="mt-2 flex items-baseline justify-between border-t border-[#ededea] pt-3">
                <span className="text-[15px] font-extrabold">{t('thankYou.summary.total')}</span>
                <span className="text-[21px] font-extrabold">{total}</span>
              </div>
              <p className="text-right text-[11.5px] text-[#9298a3]">
                {order.taxLabel ?? t('thankYou.summary.vat')}
              </p>

              {order.disclaimerKey === 'extra_eu_duties' ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs leading-relaxed text-amber-950">
                  Gli ordini verso paesi extra-UE possono essere soggetti a dazi doganali e oneri
                  all&apos;importazione a carico del destinatario, oltre alle tasse applicate dal
                  venditore.
                </p>
              ) : null}

              {shippingLines.length > 0 ? (
                <div className="mt-4 border-t border-[#ededea] pt-4">
                  <div className="font-mono text-[10px] tracking-[0.1em] text-[#8b919b] uppercase">
                    {t('thankYou.summary.shipTo')}
                  </div>
                  <div className="mt-2 text-[13.5px] leading-relaxed text-[#3f4651]">
                    {shippingLines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                </div>
              ) : null}

              {order.paymentMethod ? (
                <div className="mt-4 border-t border-[#ededea] pt-4">
                  <div className="font-mono text-[10px] tracking-[0.1em] text-[#8b919b] uppercase">
                    {t('thankYou.summary.payment')}
                  </div>
                  <div className="mt-2 text-[13.5px] text-[#3f4651]">
                    {paymentMethodLabel(order.paymentMethod, locale)}
                  </div>
                </div>
              ) : null}

              {order.bankTransferInstructions ? (
                <div className="mt-4">
                  <BankTransferInstructionsTable
                    instructions={order.bankTransferInstructions}
                    showCopyAll
                  />
                </div>
              ) : null}
            </div>

            {!isAuthenticated ? (
              <div className="rounded-[14px] bg-[#0c0c0d] p-[22px] text-[#f1e8d8]">
                <div className="font-serif text-lg">{t('thankYou.account.title')}</div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#b0b0b4]">{t('thankYou.account.body')}</p>
                <Link
                  to={registerHref}
                  className="mt-4 block rounded-lg bg-[#c9a24b] py-3 text-center text-[13.5px] font-bold text-[#0c0c0d] transition hover:brightness-105"
                >
                  {t('thankYou.account.cta')}
                </Link>
              </div>
            ) : (
              <Link
                to={ordersHref}
                className="block rounded-[14px] border border-[#e7eaee] bg-idl-tech-panel px-[22px] py-4 text-center text-sm font-bold text-idl-amber transition hover:border-idl-amber/40"
              >
                {t('paymentResult.myOrders')}
              </Link>
            )}
          </aside>
        </div>
      </SectionContainer>

      {recommendations.length > 0 ? (
        <section className="border-t border-[#ededea] bg-idl-tech-panel">
          <SectionContainer className="max-w-[1100px] py-10 sm:py-12">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] tracking-[0.16em] text-idl-amber">
                  {t('thankYou.crossSell.eyebrow')}
                </div>
                <h2 className="mt-2.5 text-2xl font-extrabold tracking-[-0.02em] text-idl-graphite">
                  {t('thankYou.crossSell.title')}
                </h2>
              </div>
              <Link to={lp('/catalogo')} className="text-sm font-bold text-idl-amber">
                {t('thankYou.crossSell.catalog')} →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.slice(0, 4).map((product) => (
                <Link
                  key={product.slug}
                  to={lp(`/prodotto/${product.slug}`)}
                  className="rounded-[10px] border border-[#e7eaee] p-3.5 transition hover:border-[#cfd4db] hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
                >
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-[#f7f8fa]">
                    {product.imageUrl ? (
                      <SiteImage src={product.imageUrl} alt="" fill className="object-cover" sizes="200px" />
                    ) : null}
                  </div>
                  <div className="line-clamp-2 min-h-[34px] text-[13px] font-semibold leading-snug text-idl-graphite">
                    {product.name}
                  </div>
                  <div className="mt-2.5 text-[15px] font-extrabold">
                    {formatMoney(product.priceCents, product.currency)}
                  </div>
                </Link>
              ))}
            </div>
          </SectionContainer>
        </section>
      ) : null}
    </div>
  )
}
