'use client'

import { RedirectIfAuthenticated } from '@/app/RedirectIfAuthenticated'
import { RegisterPageView } from '@/components/site/auth/RegisterPageView'
import { FadeIn } from '@/components/motion'

export function RegisterPage() {
  return (
    <RedirectIfAuthenticated>
      <FadeIn>
        <RegisterPageView />
      </FadeIn>
    </RedirectIfAuthenticated>
  )
}
