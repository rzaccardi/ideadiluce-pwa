import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DialogActionButtonsProps = {
  onCancel?: () => void
  onConfirm?: () => void
  cancelLabel?: string
  confirmLabel?: string
  confirmPending?: boolean
  confirmVariant?: 'success' | 'default' | 'destructive'
  className?: string
}

/** Footer dialog: annulla (cancel) + conferma (success/default/destructive). */
export function DialogActionButtons({
  onCancel,
  onConfirm,
  cancelLabel = 'Annulla',
  confirmLabel = 'Conferma',
  confirmPending,
  confirmVariant = 'success',
  className,
}: DialogActionButtonsProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
    >
      {onCancel ? (
        <Button type="button" variant="cancel" onClick={onCancel}>
          {cancelLabel}
        </Button>
      ) : null}
      {onConfirm ? (
        <Button
          type="button"
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={confirmPending}
        >
          {confirmPending ? 'Attendere…' : confirmLabel}
        </Button>
      ) : null}
    </div>
  )
}
