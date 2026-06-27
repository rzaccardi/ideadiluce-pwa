'use client'

import { Link } from '@/lib/navigation'
import { AUTH_FORM_CONTAINER_CLASS } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'
import { FadeIn } from '@/components/motion'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'

export function ResetPasswordPage() {
  const { t } = useI18n()
  const lp = useLocalePath()

  return (
    <FadeIn>
      <div className={AUTH_FORM_CONTAINER_CLASS}>
        <PageHeader title={t('reset.title')} />
        <p className="text-stone-700">{t('reset.odooDelegated')}</p>
        <p className="mt-4 text-sm">
          <Link to={lp('/forgot-password')} className="text-amber-800 hover:underline">
            {t('reset.requestNewLink')} →
          </Link>
        </p>
        <p className="mt-4 text-sm">
          <Link to={lp('/login')} className="text-amber-800 hover:underline">
            ← {t('login.title')}
          </Link>
        </p>
      </div>
    </FadeIn>
  )
}
