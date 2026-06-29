'use client'

import { RegisterPageView } from '@/components/site/auth/RegisterPageView'
import { FadeIn } from '@/components/motion'

export function RegisterPage() {
  return (
    <FadeIn>
      <RegisterPageView />
    </FadeIn>
  )
}
