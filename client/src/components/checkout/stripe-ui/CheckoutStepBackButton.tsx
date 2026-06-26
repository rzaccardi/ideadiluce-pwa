'use client'

import type { ComponentProps } from 'react'
import { canGoBackCheckoutStep, goBackCheckoutStep } from '@/features/checkout'
import { StripeBackButton } from './StripeFields'

export function CheckoutStepBackButton({
  onClick = goBackCheckoutStep,
  ...props
}: Omit<ComponentProps<typeof StripeBackButton>, 'onClick'> & {
  onClick?: () => void
}) {
  if (!canGoBackCheckoutStep()) return null
  return <StripeBackButton onClick={onClick} {...props} />
}
