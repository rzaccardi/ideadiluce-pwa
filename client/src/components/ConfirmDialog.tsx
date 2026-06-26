'use client'

import { useEffect } from 'react'
import { cn } from '@/utils/cn'
import { Button } from './Button'
import { useI18n } from '@/hooks/use-i18n'
import { ui } from '@/lib/ui-classes'

type Props = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmPending?: boolean
  onConfirm: () => void
  onCancel: () => void
  className?: string
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmPending,
  onConfirm,
  onCancel,
  className,
}: Props) {
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !confirmPending) onCancel()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, confirmPending, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-idl-backdrop p-4"
      role="presentation"
      onClick={() => {
        if (!confirmPending) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-description' : undefined}
        className={cn('w-full max-w-md p-6 shadow-xl shadow-idl-ink/10', ui.cardElevated, className)}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="font-serif text-lg font-medium text-idl-ink">
          {title}
        </h2>
        {description ? (
          <p id="confirm-dialog-description" className="mt-2 text-sm leading-relaxed text-idl-muted">
            {description}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={confirmPending}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirmPending}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {confirmPending ? t('common.pleaseWait') : (confirmLabel ?? t('common.confirm'))}
          </Button>
        </div>
      </div>
    </div>
  )
}
