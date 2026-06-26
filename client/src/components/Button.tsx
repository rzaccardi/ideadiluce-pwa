import { LoadingSpinner } from '@/components/LoadingSpinner'
import { cn } from '@/utils/cn'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'technical'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled,
  children,
  ...props
}: Props) {
  const styles = {
    primary: 'bg-idl-ink text-white hover:bg-[#2a2d35]',
    secondary:
      'border border-idl-border-strong bg-white text-idl-graphite hover:border-idl-brass/40 hover:bg-idl-cream',
    ghost: 'text-idl-ink-soft hover:bg-idl-cream hover:text-idl-graphite',
    accent: 'bg-idl-glow font-bold text-idl-design hover:bg-[#f7bd6f]',
    technical: 'bg-idl-amber font-bold text-white hover:bg-[#c2730f]',
  }[variant]
  const sizes = {
    sm: 'rounded-md px-3 py-1.5 text-xs',
    md: 'rounded-md px-4 py-2 text-sm',
    lg: 'rounded-md px-5 py-2.5 text-[15px]',
  }[size]

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        styles,
        sizes,
        className,
      )}
      {...props}
    >
      {loading ? <LoadingSpinner className="opacity-80" /> : null}
      {children}
    </button>
  )
}
