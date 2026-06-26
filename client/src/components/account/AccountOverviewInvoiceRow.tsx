'use client'

import { Link } from '@/lib/navigation'
import { formatMoney } from '@/lib/format'
import { invoiceStateTone } from '@/lib/invoice-display'
import type { InvoiceDTO } from '@/types/dto'
import { AccountDcStatusPill } from '@/components/account/dc/AccountDcStatusPill'
import { useI18n } from '@/hooks/use-i18n'

type Props = {
  invoice: InvoiceDTO
}

export function AccountOverviewInvoiceRow({ invoice }: Props) {
  const { t } = useI18n()

  return (
    <article className="overflow-hidden rounded-xl border border-[#e7eaee]">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f7f8fa] px-[18px] py-3.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono text-[12.5px] font-semibold text-[#14161b]">{invoice.name}</span>
          <span className="text-[12.5px] text-[#6c727c]">
            {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('it-IT') : '—'}
          </span>
          <AccountDcStatusPill label={invoice.state} tone={invoiceStateTone(invoice.state)} />
        </div>
        <div className="flex items-center gap-4">
          {invoice.amountTotalCents != null ? (
            <span className="text-sm font-extrabold text-[#14161b]">
              {formatMoney(invoice.amountTotalCents, invoice.currencyCode ?? 'EUR')}
            </span>
          ) : null}
          {invoice.pdfAvailable ? (
            <Link
              to="/account/invoices"
              className="text-[13px] font-bold text-[#d9831a] no-underline hover:underline"
            >
              {t('account.invoices.download')} →
            </Link>
          ) : invoice.portalUrl ? (
            <a
              href={invoice.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold text-[#d9831a] no-underline hover:underline"
            >
              {t('account.invoices.portalLink')} →
            </a>
          ) : (
            <Link
              to="/account/invoices"
              className="text-[13px] font-bold text-[#9298a3] no-underline hover:underline"
            >
              {t('account.invoices.title')} →
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
