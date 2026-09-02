'use client'

import { useSnapshot } from 'valtio/react'
import { appStore, DEFAULT_LEGACY_SITE_URL } from '@/features/app'
import { ExternalLink } from '@/lib/link-title'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import { SectionContainer } from './primitives'

function useLegacySiteNotice() {
  const app = useSnapshot(appStore)
  if (!app.legacySiteNoticeEnabled) return null
  const url = app.legacySiteUrl.trim() || DEFAULT_LEGACY_SITE_URL
  return { url }
}

export function LegacySiteNoticeBanner() {
  const notice = useLegacySiteNotice()
  const { t } = useI18n()
  if (!notice) return null

  return (
    <div
      role="status"
      className="border-b border-amber-800/40 bg-[#2c2116] text-[#f6ead6]"
    >
      <SectionContainer className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-[13px] leading-snug sm:text-[13.5px]">{t('legacySite.notice.message')}</p>
        <ExternalLink
          href={notice.url}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-idl-glow px-3 py-1.5 text-[12.5px] font-bold text-idl-design transition hover:brightness-110"
        >
          {t('legacySite.notice.cta')}
        </ExternalLink>
      </SectionContainer>
    </div>
  )
}

export function LegacySiteNoticeInline({ className }: { className?: string }) {
  const notice = useLegacySiteNotice()
  const { t } = useI18n()
  if (!notice) return null

  return (
    <div
      role="status"
      className={cn(
        'mb-4 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950',
        className,
      )}
    >
      <p>{t('legacySite.checkout.hint')}</p>
      <ExternalLink
        href={notice.url}
        className="mt-2 inline-flex font-semibold text-amber-950 underline decoration-amber-700/60 underline-offset-2 hover:decoration-amber-950"
      >
        {t('legacySite.notice.cta')}
      </ExternalLink>
    </div>
  )
}

export function LegacySiteFooterLink() {
  const notice = useLegacySiteNotice()
  const { t } = useI18n()
  if (!notice) return null

  return (
    <p className="pt-2">
      <ExternalLink href={notice.url} className="text-idl-glow hover:text-idl-design-fg">
        {t('legacySite.footer.link')}
      </ExternalLink>
    </p>
  )
}
