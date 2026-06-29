'use client'

import { isRecaptchaEnabled } from '@/lib/recaptcha'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-idl-brass"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3 4 7v6c0 5 3.5 8 8 8s8-3 8-8V7l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

const linkClassName =
  'font-semibold text-idl-brass underline-offset-2 transition hover:text-idl-brass-light hover:underline'

/** Banner compatto reCAPTCHA per form login/registrazione. */
export function AuthRecaptchaBanner({ className }: { className?: string }) {
  const { t } = useI18n()
  if (!isRecaptchaEnabled()) return null

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-idl-promo-border bg-idl-promo-bg px-3 py-2.5 text-[11px] leading-snug text-idl-promo-text',
        className,
      )}
      role="note"
    >
      <ShieldIcon />
      <p className="min-w-0">
        {t('auth.recaptchaBanner')}{' '}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {t('auth.recaptchaPrivacy')}
        </a>
        {' · '}
        <a
          href="https://policies.google.com/terms"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {t('auth.recaptchaTerms')}
        </a>
      </p>
    </div>
  )
}

/** @deprecated Usare AuthRecaptchaBanner nel form. */
export function RecaptchaNotice({ className }: { className?: string }) {
  return <AuthRecaptchaBanner className={className} />
}
