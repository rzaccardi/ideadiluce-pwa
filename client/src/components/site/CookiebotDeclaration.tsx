'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from '@/context/locale-context'
import { useI18n } from '@/hooks/use-i18n'
import { getCookiebotDeclarationSrc } from '@/lib/cookiebot'
import { getCookiebotCbid } from '@/lib/env'
import { FIRST_PARTY_LOCAL_STORAGE } from '@/lib/first-party-local-storage'

/** Tabella localStorage di prima parte + dichiarazione Cookiebot (cookie e storage di scan). */
export function CookiebotDeclaration() {
  const { t } = useI18n()
  const { locale } = useLocale()
  const hostRef = useRef<HTMLDivElement>(null)
  const cbid = getCookiebotCbid()

  useEffect(() => {
    const host = hostRef.current
    if (!host || !cbid) return

    host.replaceChildren()
    const script = document.createElement('script')
    script.id = 'CookieDeclaration'
    script.src = getCookiebotDeclarationSrc(cbid)
    script.async = true
    script.setAttribute('data-culture', locale)
    host.appendChild(script)

    return () => {
      host.replaceChildren()
    }
  }, [cbid, locale])

  return (
    <section
      id="cookie-declaration"
      className="max-w-3xl space-y-6 pb-12"
      aria-labelledby="privacy-storage-heading"
    >
      <div className="space-y-4 text-[15px] leading-relaxed text-idl-ink-muted">
        <h2 id="privacy-storage-heading" className="text-lg font-bold text-idl-ink">
          {t('privacy.storage.title')}
        </h2>
        <p>{t('privacy.storage.intro')}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-idl-tech-border">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-idl-tech-border bg-idl-tech-panel">
              <th className="px-4 py-3 font-medium text-idl-ink">{t('privacy.storage.col.name')}</th>
              <th className="px-4 py-3 font-medium text-idl-ink">{t('privacy.storage.col.type')}</th>
              <th className="px-4 py-3 font-medium text-idl-ink">{t('privacy.storage.col.duration')}</th>
              <th className="px-4 py-3 font-medium text-idl-ink">{t('privacy.storage.col.category')}</th>
              <th className="px-4 py-3 font-medium text-idl-ink">{t('privacy.storage.col.purpose')}</th>
            </tr>
          </thead>
          <tbody>
            {FIRST_PARTY_LOCAL_STORAGE.map((entry) => (
              <tr key={entry.name} className="border-b border-idl-tech-border last:border-b-0">
                <td className="px-4 py-3 align-top font-mono text-[12px] break-all text-idl-ink">
                  {entry.name}
                </td>
                <td className="px-4 py-3 align-top text-idl-ink-muted">
                  {t('privacy.storage.type.localStorage')}
                </td>
                <td className="px-4 py-3 align-top text-idl-ink-muted">{t(entry.durationKey)}</td>
                <td className="px-4 py-3 align-top text-idl-ink-muted">{t(entry.categoryKey)}</td>
                <td className="px-4 py-3 align-top text-idl-ink-muted">{t(entry.purposeKey)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cbid ? <div ref={hostRef} className="CookieDeclarationWrapper" /> : null}
    </section>
  )
}
