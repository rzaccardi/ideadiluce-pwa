import { cn } from '@/utils/cn'

type Props = {
  title?: string
  message: string
  className?: string
  action?: React.ReactNode
}

export function ErrorState({
  title = 'Qualcosa è andato storto',
  message,
  className,
  action,
}: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-900',
        className,
      )}
      role="alert"
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-sm opacity-90">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
