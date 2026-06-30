'use client'

import { PasswordVisibilityToggle, usePasswordVisibility } from '@/components/PasswordVisibilityToggle'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function TextInput({ id, label, error, className, type, ...props }: Props) {
  const fieldId = id ?? props.name
  const password = usePasswordVisibility()
  const isPassword = type === 'password'
  const resolvedType = isPassword ? password.inputType : type

  const input = (
    <input
      id={fieldId}
      type={resolvedType}
      className={cn(
        ui.input,
        error && 'border-red-400 focus:border-red-400 focus:ring-red-200',
        isPassword && 'pr-11',
        className,
      )}
      {...props}
    />
  )

  return (
    <label className="block text-left text-sm">
      <span className={cn('mb-1 block', ui.labelSm)}>{label}</span>
      {isPassword ? (
        <div className="relative">
          {input}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <PasswordVisibilityToggle
              show={password.show}
              onToggle={password.toggle}
              className="text-zinc-500 hover:text-zinc-800"
            />
          </div>
        </div>
      ) : (
        input
      )}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
