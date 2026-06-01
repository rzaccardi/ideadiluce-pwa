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
        'rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-zinc-600',
        className,
      )}
    >
      <p className="font-medium text-zinc-800">{title}</p>
      {description ? <p className="mt-2 text-sm">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
