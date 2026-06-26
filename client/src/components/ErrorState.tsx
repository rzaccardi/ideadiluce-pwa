'use client'

import { cn } from '@/utils/cn'
import { useI18n } from '@/hooks/use-i18n'

type Props = {
  title?: string
  message: string
  className?: string
  action?: React.ReactNode
}

export function ErrorState({ title, message, className, action }: Props) {
  const { t } = useI18n()
  return (
    <div
      className={cn(
        'rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-900',
        className,
      )}
      role="alert"
    >
      <p className="text-sm font-medium">{title ?? t('error.genericTitle')}</p>
      <p className="mt-2 text-sm opacity-90">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
