'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api/endpoints'
import { invoiceStateTone } from '@/lib/invoice-display'
import type { InvoiceDTO } from '@/types/dto'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { AccountDcStatusPill } from '@/components/account/dc/AccountDcStatusPill'
import { formatMoney } from '@/lib/format'
import { ListSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import { ExternalLink } from '@/lib/link-title'
import { useI18n } from '@/hooks/use-i18n'

export function AccountInvoicesPage() {
  const { t } = useI18n()
  const [list, setList] = useState<InvoiceDTO[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        setList(await api.invoices.list())
      } catch (e) {
        setError(e instanceof Error ? e.message : t('account.invoices.loadError'))
      } finally {
        setLoading(false)
      }
    })()
  }, [t])

  async function handleDownload(inv: InvoiceDTO) {
    if (!inv.pdfAvailable) return
    setDownloadingId(inv.id)
    try {
      const blob = await api.invoices.downloadPdf(inv.id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${inv.name}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t('account.invoices.pdfDownloadError'))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <AccountDcPanel title={t('account.invoices.title')} description={t('account.invoices.description')}>
      {error ? <StripeErrorBanner message={error} /> : null}

      <PageLoadTransition isLoading={loading} skeleton={<ListSkeleton />}>
        {list && list.length === 0 ? (
          <p className="py-8 text-center text-sm text-idl-muted">{t('account.invoices.empty')}</p>
        ) : null}

        {list && list.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {list.map((inv) => (
              <article key={inv.id} className="overflow-hidden rounded-xl border border-idl-tech-border bg-white dark:bg-idl-tech-panel">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-idl-tech-panel px-[18px] py-3.5">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <span className="font-mono text-[12.5px] font-semibold text-idl-graphite">{inv.name}</span>
                    <span className="text-[12.5px] text-idl-muted">
                      {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('it-IT') : '—'}
                    </span>
                    <AccountDcStatusPill label={inv.state} tone={invoiceStateTone(inv.state)} />
                    {inv.paymentState ? (
                      <span className="text-[12px] text-idl-muted">{inv.paymentState}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-[18px]">
                    {inv.amountTotalCents != null ? (
                      <span className="text-sm font-extrabold text-idl-graphite">
                        {formatMoney(inv.amountTotalCents, inv.currencyCode ?? 'EUR')}
                      </span>
                    ) : null}
                    {inv.pdfAvailable ? (
                      <button
                        type="button"
                        disabled={downloadingId === inv.id}
                        onClick={() => void handleDownload(inv)}
                        className="text-[13px] font-bold text-[#d9831a] disabled:opacity-50"
                      >
                        {downloadingId === inv.id
                          ? t('account.profile.saving')
                          : `${t('account.invoices.download')} →`}
                      </button>
                    ) : inv.portalUrl ? (
                      <ExternalLink
                        href={inv.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] font-bold text-[#d9831a] no-underline hover:underline"
                      >
                        {t('account.invoices.portalLink')} →
                      </ExternalLink>
                    ) : (
                      <span className="text-[13px] text-[#9298a3]">{t('account.invoices.pdfPending')}</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </PageLoadTransition>
    </AccountDcPanel>
  )
}
