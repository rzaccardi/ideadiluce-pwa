'use client'

import { useCallback, useState } from 'react'
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal'

export function useForgotPasswordModal() {
  const [open, setOpen] = useState(false)
  const [initialEmail, setInitialEmail] = useState('')

  const openForgotPassword = useCallback((email?: string) => {
    setInitialEmail(email?.trim() ?? '')
    setOpen(true)
  }, [])

  const closeForgotPassword = useCallback(() => {
    setOpen(false)
  }, [])

  const forgotPasswordModal = (
    <ForgotPasswordModal open={open} initialEmail={initialEmail} onClose={closeForgotPassword} />
  )

  return { openForgotPassword, forgotPasswordModal }
}
