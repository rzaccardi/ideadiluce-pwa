import { cn } from '@/utils/cn'

type Props = { className?: string; message?: string }

export function LoadingState({ className, message = 'Caricamento…' }: Props) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-zinc-500', className)}
      role="status"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
