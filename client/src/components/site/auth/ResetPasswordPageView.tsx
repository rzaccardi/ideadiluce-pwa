'use client'

import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import {
  AuthBodyText,
  AuthBrassLink,
  AuthCard,
  AuthCardHeader,
  AuthFooterMuted,
  AuthFooterText,
  AuthPageShell,
} from '@/components/site/auth/auth-ui'

export function ResetPasswordPageView() {
  const { t } = useI18n()
  const lp = useLocalePath()

  return (
    <AuthPageShell
      footer={
        <>
          <AuthFooterText>
            <AuthBrassLink to={lp('/forgot-password')}>
              {t('reset.requestNewLink')} →
            </AuthBrassLink>
          </AuthFooterText>
          <AuthFooterMuted>
            <AuthBrassLink to={lp('/login')}>← {t('login.title')}</AuthBrassLink>
          </AuthFooterMuted>
        </>
      }
    >
      <AuthCard>
        <AuthCardHeader title={t('reset.title')} />
        <AuthBodyText>{t('reset.odooDelegated')}</AuthBodyText>
      </AuthCard>
    </AuthPageShell>
  )
}
