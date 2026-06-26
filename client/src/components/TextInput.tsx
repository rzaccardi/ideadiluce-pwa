import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function TextInput({ id, label, error, className, ...props }: Props) {
  const fieldId = id ?? props.name
  return (
    <label className="block text-left text-sm">
      <span className={cn('mb-1 block', ui.labelSm)}>{label}</span>
      <input
        id={fieldId}
        className={cn(ui.input, error && 'border-red-400 focus:border-red-400 focus:ring-red-200', className)}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
