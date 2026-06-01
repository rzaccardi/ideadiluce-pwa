import { cn } from '@/utils/cn'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function TextInput({ id, label, error, className, ...props }: Props) {
  const fieldId = id ?? props.name
  return (
    <label className="block text-left text-sm">
      <span className="mb-1 block font-medium text-zinc-700">{label}</span>
      <input
        id={fieldId}
        className={cn(
          'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400',
          error && 'border-red-400',
          className,
        )}
        {...props}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
