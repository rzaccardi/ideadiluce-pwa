'use client'

import { LoginPageView } from '@/components/site/login/LoginPageView'
import { FadeIn } from '@/components/motion'

export function LoginPage() {
  return (
    <FadeIn>
      <LoginPageView />
    </FadeIn>
  )
}
