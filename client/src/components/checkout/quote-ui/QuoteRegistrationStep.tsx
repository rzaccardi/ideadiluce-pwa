'use client'

import { InlineAccountAuthStep } from '@/components/auth/InlineAccountAuthStep'
import { useI18n } from '@/hooks/use-i18n'

type Props = {
  email: string
  onEmailChange: (email: string) => void
  onAuthSuccess: (info: {
    mode: 'register' | 'login'
    email: string
    firstName?: string
    lastName?: string
    phone?: string
  }) => void | Promise<void>
  onContinue: () => void | Promise<void>
  continueLoading?: boolean
}

export function QuoteRegistrationStep({
  email,
  onEmailChange,
  onAuthSuccess,
  onContinue,
  continueLoading = false,
}: Props) {
  const { t } = useI18n()

  return (
    <InlineAccountAuthStep
      email={email}
      onEmailChange={onEmailChange}
      registerContinueLabel={t('checkout.account.createAndContinue')}
      loginContinueLabel={t('cart.quote.accountContinue')}
      onAuthSuccess={onAuthSuccess}
      showAuthenticatedContinue
      authenticatedContinueLabel={t('checkout.continue')}
      authenticatedContinueLoading={continueLoading}
      onAuthenticatedContinue={() => void onContinue()}
      logoutScope="checkout"
    />
  )
}
