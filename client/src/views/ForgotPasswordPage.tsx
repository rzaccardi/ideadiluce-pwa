'use client'

import { ForgotPasswordPageView } from '@/components/site/auth/ForgotPasswordPageView'
import { FadeIn } from '@/components/motion'

export function ForgotPasswordPage() {
  return (
    <FadeIn>
      <ForgotPasswordPageView />
    </FadeIn>
  )
}
