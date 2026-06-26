import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { accountDcPanelClass } from './account-dc-styles'

type Props = {
  title?: ReactNode
  action?: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}

export function AccountDcPanel({ title, action, description, children, className }: Props) {
  return (
    <section className={cn(accountDcPanelClass, className)}>
      {title || action ? (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3',
            description ? 'mb-2' : 'mb-5',
          )}
        >
          {title ? (
            <h2 className="text-lg font-extrabold tracking-[-0.01em] text-[#14161b]">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {description ? (
        <p className="mb-5 text-[13.5px] leading-relaxed text-[#6c727c]">{description}</p>
      ) : null}
      {children}
    </section>
  )
}
