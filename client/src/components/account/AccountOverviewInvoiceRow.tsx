'use client'

import { ExternalLink } from '@/lib/link-title'
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
    <article className="overflow-hidden rounded-xl border border-idl-tech-border bg-white dark:bg-idl-tech-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-idl-tech-panel px-[18px] py-3.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono text-[12.5px] font-semibold text-idl-graphite">{invoice.name}</span>
          <span className="text-[12.5px] text-idl-muted">
            {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('it-IT') : '—'}
          </span>
          <AccountDcStatusPill label={invoice.state} tone={invoiceStateTone(invoice.state)} />
        </div>
        <div className="flex items-center gap-4">
          {invoice.amountTotalCents != null ? (
            <span className="text-sm font-extrabold text-idl-graphite">
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
            <ExternalLink
              href={invoice.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold text-[#d9831a] no-underline hover:underline"
            >
              {t('account.invoices.portalLink')} →
            </ExternalLink>
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
