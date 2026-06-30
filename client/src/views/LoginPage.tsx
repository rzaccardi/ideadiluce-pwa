'use client'

import { RedirectIfAuthenticated } from '@/app/RedirectIfAuthenticated'
import { LoginPageView } from '@/components/site/login/LoginPageView'
import { FadeIn } from '@/components/motion'

export function LoginPage() {
  return (
    <RedirectIfAuthenticated>
      <FadeIn>
        <LoginPageView />
      </FadeIn>
    </RedirectIfAuthenticated>
  )
}
