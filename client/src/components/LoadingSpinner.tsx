import { cn } from '@/utils/cn'

type Props = {
  className?: string
}

export function LoadingSpinner({ className }: Props) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent',
        className ?? 'h-4 w-4',
      )}
    />
  )
}
