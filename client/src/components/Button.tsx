import { cn } from '@/utils/cn'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className, variant = 'primary', size = 'md', type = 'button', ...props }: Props) {
  const styles = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
    secondary: 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50',
    ghost: 'text-zinc-700 hover:bg-zinc-100',
  }[variant]
  const sizes = {
    sm: 'rounded-lg px-3 py-1.5 text-xs',
    md: 'rounded-lg px-4 py-2 text-sm',
    lg: 'rounded-lg px-5 py-2.5 text-sm',
  }[size]

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        styles,
        sizes,
        className,
      )}
      {...props}
    />
  )
}
