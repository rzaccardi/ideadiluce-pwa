'use client'

import { useCallback, useState } from 'react'
import { CheckoutLoginModal } from '@/components/auth/CheckoutLoginModal'

export function useCheckoutLoginModal() {
  const [open, setOpen] = useState(false)
  const [initialEmail, setInitialEmail] = useState('')

  const openCheckoutLogin = useCallback((email?: string) => {
    setInitialEmail(email?.trim() ?? '')
    setOpen(true)
  }, [])

  const closeCheckoutLogin = useCallback(() => {
    setOpen(false)
  }, [])

  const checkoutLoginModal = (
    <CheckoutLoginModal open={open} initialEmail={initialEmail} onClose={closeCheckoutLogin} />
  )

  return { openCheckoutLogin, checkoutLoginModal }
}
