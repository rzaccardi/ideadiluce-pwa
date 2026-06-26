'use client'

import { cn } from '@/utils/cn'
import { useI18n } from '@/hooks/use-i18n'

type Props = { className?: string; message?: string }

export function LoadingState({ className, message }: Props) {
  const { t } = useI18n()
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-idl-muted', className)}
      role="status"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-idl-border border-t-idl-brass" />
      <p className="text-sm">{message ?? t('common.loading')}</p>
    </div>
  )
}
