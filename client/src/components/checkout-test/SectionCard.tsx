import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Props = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function SectionCard({ title, description, children, className }: Props) {
  return (
    <section
      className={cn(
        'rounded-xl border border-zinc-200 bg-idl-tech-panel p-6 shadow-sm shadow-zinc-950/5',
        className,
      )}
    >
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      <div className={description ? 'mt-5' : 'mt-4'}>{children}</div>
    </section>
  )
}
