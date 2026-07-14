'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { getCookiebot, isCookiebotEnabled, renewCookieConsent } from '@/lib/cookiebot'

const linkClassName = 'hover:text-idl-design-fg'

export function CookiebotConsentLink() {
  const { t } = useI18n()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isCookiebotEnabled() || ready) return

    const markReady = () => setReady(true)
    if (getCookiebot()) {
      markReady()
      return
    }

    window.addEventListener('CookiebotOnConsentReady', markReady)
    window.addEventListener('CookiebotOnLoad', markReady)
    return () => {
      window.removeEventListener('CookiebotOnConsentReady', markReady)
      window.removeEventListener('CookiebotOnLoad', markReady)
    }
  }, [ready])

  if (!isCookiebotEnabled() || !ready) return null

  return (
    <>
      <li aria-hidden className="text-idl-design-subtle/60">
        ·
      </li>
      <li>
        <button
          type="button"
          className={`${linkClassName} cursor-pointer border-0 bg-transparent p-0 text-inherit`}
          onClick={() => renewCookieConsent()}
        >
          {t('footer.legal.cookies')}
        </button>
      </li>
    </>
  )
}
