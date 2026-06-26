import { cn } from '@/utils/cn'

type Props = {
  title: string
  description?: string
  className?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, className, action }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-idl-border bg-idl-paper px-6 py-12 text-center text-idl-muted',
        className,
      )}
    >
      <p className="font-medium text-idl-graphite">{title}</p>
      {description ? <p className="mt-2 text-sm">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
