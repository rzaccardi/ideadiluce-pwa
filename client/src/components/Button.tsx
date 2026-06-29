import { LoadingSpinner } from '@/components/LoadingSpinner'
import { siteButtons } from '@/styles/site-ui'
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
  const variantClass = {
    primary: siteButtons.primary,
    secondary: siteButtons.secondary,
    ghost: siteButtons.ghost,
    accent: siteButtons.accent,
    technical: siteButtons.technical,
  }[variant]

  const sizeClass = {
    sm: siteButtons.sm,
    md: siteButtons.md,
    lg: siteButtons.lg,
  }[size]

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(siteButtons.base, variantClass, sizeClass, className)}
      {...props}
    >
      {loading ? <LoadingSpinner className="opacity-80" /> : null}
      {children}
    </button>
  )
}
