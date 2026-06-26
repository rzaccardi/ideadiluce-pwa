import { cn } from '@/lib/utils'

type DetailFieldProps = {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}

export function DetailField({ label, error, className, children }: DetailFieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="mb-1.5 text-sm text-gray-500">{label}</p>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

type DetailValueProps = {
  children?: React.ReactNode
  empty?: boolean
  className?: string
}

export function DetailValue({ children, empty, className }: DetailValueProps) {
  if (empty || children == null || children === '') {
    return <p className={cn('font-normal italic text-gray-400', className)}>-</p>
  }
  return <div className={cn('font-medium text-gray-900', className)}>{children}</div>
}
