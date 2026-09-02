'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { requestOrderReturn } from '@/features/orders'
import { ApiRequestError } from '@/types/api'
import { useI18n } from '@/hooks/use-i18n'
import { useIsClient } from '@/hooks/use-is-client'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'
import {
  accountDcOutlineBtnClass,
  accountDcPrimaryBtnClass,
} from '@/components/account/dc/account-dc-styles'

type Variant = 'primary' | 'outline' | 'link'

type Props = {
  orderId: string
  alreadyRequested: boolean
  returnEligible?: boolean
  variant?: Variant
}

function triggerClass(variant: Variant): string {
  if (variant === 'primary') return accountDcPrimaryBtnClass
  if (variant === 'link') {
    return 'text-[13px] font-bold text-idl-brass disabled:opacity-50'
  }
  return accountDcOutlineBtnClass
}

export function AccountReturnRequestButton({
  orderId,
  alreadyRequested,
  returnEligible = true,
  variant = 'outline',
}: Props) {
  const { t, locale } = useI18n()
  const isClient = useIsClient()
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(false)
  const [submitted, setSubmitted] = useState(alreadyRequested)
  const ignoreBackdropUntilRef = useRef(0)
  const expired = !returnEligible && !submitted

  useEffect(() => {
    setSubmitted(alreadyRequested)
  }, [alreadyRequested])

  useEffect(() => {
    if (!open) return
    ignoreBackdropUntilRef.current = Date.now() + 400

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, pending])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  async function handleSubmit() {
    setPending(true)
    try {
      const result = await requestOrderReturn(orderId, notes.trim() || undefined, locale)
      setSubmitted(true)
      setOpen(false)
      setNotes('')
      toast.success(
        result.alreadyRequested ? t('orders.return.toastAlready') : t('orders.return.toastSuccess'),
      )
    } catch (e) {
      const message = e instanceof ApiRequestError ? (e.userMessage ?? e.message) : String(e)
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  const label = submitted
    ? t('orders.return.alreadyRequested')
    : expired
      ? t('orders.return.expiredButton')
      : t('orders.return.button')
  const disabled = submitted || expired

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        title={expired ? t('orders.return.expired') : undefined}
        onClick={() => {
          if (!disabled) setOpen(true)
        }}
        className={cn(triggerClass(variant), disabled && 'cursor-not-allowed opacity-70')}
      >
        {label}
      </button>

      {open && isClient
        ? createPortal(
            <div
              className="fixed inset-0 z-[10000] flex h-[100dvh] w-screen items-center justify-center bg-idl-backdrop p-4"
              role="presentation"
              onClick={() => {
                if (Date.now() < ignoreBackdropUntilRef.current) return
                if (!pending) setOpen(false)
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="return-request-title"
                aria-describedby="return-request-description"
                className={cn('w-full max-w-md p-6 shadow-xl shadow-idl-ink/10', ui.cardElevated)}
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id="return-request-title" className="font-serif text-lg font-medium text-idl-ink">
                  {t('orders.return.title')}
                </h2>
                <p
                  id="return-request-description"
                  className="mt-2 text-sm leading-relaxed text-idl-muted"
                >
                  {t('orders.return.description')}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-idl-muted">{t('orders.return.legalNote')}</p>

                <label className="mt-4 block">
                  <span className={ui.labelSm}>{t('orders.return.notesLabel')}</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={2000}
                    rows={4}
                    disabled={pending}
                    placeholder={t('orders.return.notesPlaceholder')}
                    className={cn(ui.input, 'mt-1 resize-y')}
                  />
                </label>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    className={accountDcOutlineBtnClass}
                    disabled={pending}
                    onClick={() => setOpen(false)}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    className={accountDcPrimaryBtnClass}
                    disabled={pending}
                    onClick={() => void handleSubmit()}
                  >
                    {pending ? t('orders.return.submitting') : t('orders.return.submit')}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
