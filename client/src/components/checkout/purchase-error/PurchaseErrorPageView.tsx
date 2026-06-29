'use client'

import type { ThankYouOrderDTO } from '@/types/dto'
import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'
import { formatMoney } from '@/lib/format'
import { SectionContainer, BrandWordmark } from '@/components/site/primitives'
import { SiteImage } from '@/components/site/SiteImage'
import type { MessageKey } from '@/i18n/messages'

type Props = {
  order: ThankYouOrderDTO
}

type CauseStep = {
  titleKey: MessageKey
  bodyKey: MessageKey
}

const CAUSE_STEPS: CauseStep[] = [
  { titleKey: 'purchaseError.causes.card.title', bodyKey: 'purchaseError.causes.card.body' },
  { titleKey: 'purchaseError.causes.secure3ds.title', bodyKey: 'purchaseError.causes.secure3ds.body' },
  { titleKey: 'purchaseError.causes.limit.title', bodyKey: 'purchaseError.causes.limit.body' },
]

function CrossIcon() {
  return (
    <svg viewBox="0 0 52 52" width="40" height="40" fill="none" stroke="#d3382e" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 18 L34 34 M34 18 L18 34" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1f9d57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#1f9d57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 6 L9 17 l-5-5" />
    </svg>
  )
}

function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#14161b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10 h18" />
    </svg>
  )
}

function checkoutRetryHref(
  lp: (path: string) => string,
  orderId: string,
  options?: { step?: 'payment'; method?: 'stripe' | 'bank_transfer' },
) {
  const params = new URLSearchParams({ retryOrder: orderId })
  if (options?.step) params.set('step', options.step)
  if (options?.method) params.set('method', options.method)
  return lp(`/checkout?${params.toString()}`)
}

export function PurchaseErrorPageView({ order }: Props) {
  const { t } = useI18n()
  const lp = useLocalePath()
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
  const retryHref = checkoutRetryHref(lp, order.orderId)
  const changeMethodHref = checkoutRetryHref(lp, order.orderId, { step: 'payment' })
  const errorDetail = order.lastPaymentError?.trim()

  return (
    <div className="-mx-4 bg-idl-tech-panel sm:-mx-6 lg:-mx-12">
      <div className="border-b border-[#e4e3de] bg-[#ffffff]">
        <SectionContainer className="flex max-w-[1100px] flex-wrap items-center justify-between gap-3 py-[18px]">
          <Link to={lp('/')} className="text-idl-ink no-underline">
            <BrandWordmark className="text-2xl" />
          </Link>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1f7a48]">
            <LockIcon />
            {t('purchaseError.securePayment')}
          </div>
          <a href="tel:+39067167111" className="text-[13px] text-[#3a3a3d] no-underline">
            {t('purchaseError.supportPhone')}
          </a>
        </SectionContainer>
      </div>

      <section className="border-b border-[#ededea] bg-idl-tech-panel py-10 text-center sm:py-12">
        <SectionContainer className="max-w-[1100px]">
          <div className="mx-auto mb-6 flex size-[78px] items-center justify-center rounded-full bg-[#fdeceb]">
            <CrossIcon />
          </div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-[#d3382e]">
            {t('thankYou.hero.failedEyebrow')}
          </div>
          <h1 className="mt-3.5 text-[clamp(1.75rem,4vw,2.125rem)] font-extrabold tracking-[-0.025em] text-idl-graphite">
            {t('purchaseError.hero.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-[580px] text-base leading-relaxed text-[#5b616b]">
            {errorDetail ? (
              errorDetail
            ) : (
              <>
                {t('purchaseError.hero.bodyPrefix')}{' '}
                <strong className="text-idl-graphite">{t('purchaseError.hero.bodyStrong')}</strong>
                {t('purchaseError.hero.bodySuffix')}
              </>
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={retryHref}
              className="inline-flex items-center gap-2 rounded-[10px] bg-idl-amber px-[26px] py-[15px] text-[15px] font-extrabold text-white transition hover:brightness-95"
            >
              {t('purchaseError.hero.retryPayment')}
            </Link>
            <Link
              to={changeMethodHref}
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#cfd5dc] bg-idl-tech-panel px-[26px] py-3.5 text-[15px] font-bold text-idl-graphite transition hover:border-idl-graphite"
            >
              {t('purchaseError.hero.changeMethod')}
            </Link>
          </div>
          <p className="mt-4 text-[12.5px] text-[#9298a3]">
            {t('purchaseError.attemptRef')}{' '}
            <span className="font-mono">{order.displayOrderNumber}</span>
          </p>
        </SectionContainer>
      </section>

      <SectionContainer className="max-w-[1100px] py-8 sm:py-10">
        <div className="grid items-start gap-7 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-[18px]">
            <div className="rounded-[14px] border border-[#e7eaee] bg-idl-tech-panel p-6 sm:p-[26px]">
              <h2 className="text-[17px] font-extrabold tracking-[-0.01em]">
                {t('purchaseError.causes.title')}
              </h2>
              <p className="mt-1.5 mb-5 text-[13.5px] text-[#6c727c]">{t('purchaseError.causes.intro')}</p>
              <div className="flex flex-col gap-3.5">
                {CAUSE_STEPS.map((step, index) => (
                  <div key={step.titleKey} className="flex items-start gap-3">
                    <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#fdf3e0] text-[13px] font-extrabold text-[#c98a00]">
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-[14.5px] font-bold text-idl-graphite">{t(step.titleKey)}</div>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-[#6c727c]">{t(step.bodyKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[14px] border border-[#e7eaee] bg-idl-tech-panel p-6 sm:p-[26px]">
              <h2 className="mb-4 text-[17px] font-extrabold tracking-[-0.01em]">
                {t('purchaseError.methods.title')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  to={checkoutRetryHref(lp, order.orderId, { step: 'payment', method: 'stripe' })}
                  className="flex flex-col items-center gap-2 rounded-[10px] border border-[#e7eaee] px-3.5 py-[18px] no-underline transition hover:border-idl-amber hover:bg-[#fdf6ed]"
                >
                  <div className="flex gap-1">
                    <span className="rounded bg-[#f0f2f5] px-1.5 py-1 font-mono text-[10px] font-bold text-[#1a1f71]">VISA</span>
                    <span className="rounded bg-[#f0f2f5] px-1.5 py-1 font-mono text-[10px] font-bold text-[#eb001b]">MC</span>
                  </div>
                  <span className="text-[13px] font-bold text-idl-graphite">{t('purchaseError.methods.card')}</span>
                </Link>
                <Link
                  to={checkoutRetryHref(lp, order.orderId, { step: 'payment', method: 'stripe' })}
                  className="flex flex-col items-center gap-2 rounded-[10px] border border-[#e7eaee] px-3.5 py-[18px] no-underline transition hover:border-idl-amber hover:bg-[#fdf6ed]"
                >
                  <span className="rounded bg-[#f0f2f5] px-2 py-1 font-mono text-[11px] font-bold text-[#003087]">PayPal</span>
                  <span className="text-[13px] font-bold text-idl-graphite">{t('purchaseError.methods.paypal')}</span>
                </Link>
                <Link
                  to={checkoutRetryHref(lp, order.orderId, { step: 'payment', method: 'bank_transfer' })}
                  className="flex flex-col items-center gap-2 rounded-[10px] border border-[#e7eaee] px-3.5 py-[18px] no-underline transition hover:border-idl-amber hover:bg-[#fdf6ed]"
                >
                  <BankIcon />
                  <span className="text-[13px] font-bold text-idl-graphite">{t('purchaseError.methods.bankTransfer')}</span>
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-start justify-between gap-6 rounded-[14px] border border-[#f0e3d0] bg-[#fbf4ea] p-6 sm:flex-row sm:items-center sm:p-[24px_26px]">
              <div>
                <h2 className="text-base font-extrabold text-idl-graphite">{t('purchaseError.support.title')}</h2>
                <p className="mt-1.5 max-w-[520px] text-[13.5px] leading-relaxed text-[#7a6a52]">
                  {t('purchaseError.support.body')}
                </p>
              </div>
              <Link
                to={lp('/contatti')}
                className="shrink-0 rounded-[7px] bg-idl-amber px-[18px] py-3 text-[13.5px] font-bold text-white transition hover:brightness-95"
              >
                {t('purchaseError.support.cta')}
              </Link>
            </div>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <div className="rounded-[14px] border border-[#e7eaee] bg-idl-tech-panel p-[22px]">
              <div className="mb-4 flex items-center gap-2">
                <CheckIcon />
                <h2 className="text-base font-extrabold tracking-[-0.01em]">{t('purchaseError.cart.title')}</h2>
              </div>

              {order.lines.length > 0 ? (
                <ul className="divide-y divide-[#ededea]">
                  {order.lines.map((line) => (
                    <li
                      key={`${line.productRef}-${line.variantRef ?? ''}`}
                      className="flex gap-3 py-3.5 first:pt-0 last:pb-4"
                    >
                      <div className="relative size-[54px] shrink-0 overflow-hidden rounded-lg bg-[#f7f8fa]">
                        {line.imageUrl ? (
                          <SiteImage src={line.imageUrl} alt="" fill className="object-cover" sizes="54px" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[9.5px] text-[#8b919b]">{line.productRef}</div>
                        <div className="text-[12.5px] font-semibold leading-snug text-idl-graphite">
                          {line.productName ?? line.productRef}
                          {line.quantity > 1 ? ` · ×${line.quantity}` : ''}
                        </div>
                      </div>
                      <div className="text-[13px] font-bold whitespace-nowrap text-idl-graphite">
                        {line.lineTotalCents != null
                          ? formatMoney(line.lineTotalCents, currency)
                          : '—'}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

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
                {order.taxLabel ?? t('purchaseError.taxIncluded')}
              </p>

              <Link
                to={retryHref}
                className="mt-4 block rounded-[10px] bg-idl-amber py-[15px] text-center text-[15px] font-extrabold text-white transition hover:brightness-95"
              >
                {t('purchaseError.hero.retryPayment')}
              </Link>
              <Link
                to={lp('/catalogo')}
                className="mt-3 block text-center text-[13px] font-bold text-[#6c727c] no-underline hover:text-idl-graphite"
              >
                {t('purchaseError.cart.backToShop')}
              </Link>
            </div>

            <div className="rounded-[14px] border border-[#e7eaee] bg-[#f7f8fa] p-[18px]">
              {[t('purchaseError.cart.noCharge'), t('purchaseError.cart.reserved'), t('purchaseError.cart.ssl')].map(
                (label) => (
                  <div key={label} className="flex items-center gap-2.5 py-1.5 text-[13px] text-[#3f4651]">
                    <CheckIcon />
                    {label}
                  </div>
                ),
              )}
            </div>
          </aside>
        </div>
      </SectionContainer>

      <div className="bg-[#0c0c0d] text-[#b0b0b4]">
        <SectionContainer className="flex max-w-[1100px] flex-wrap items-center justify-between gap-3 py-6">
          <div className="text-[12.5px]">{t('purchaseError.footer.company')}</div>
          <div className="text-[12.5px]">
            {t('purchaseError.footer.help')}{' '}
            <a href="mailto:info@ideadiluce.com" className="font-bold text-[#c9a24b] no-underline">
              info@ideadiluce.com
            </a>
          </div>
        </SectionContainer>
      </div>
    </div>
  )
}
