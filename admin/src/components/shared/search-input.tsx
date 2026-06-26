import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchInputProps = React.ComponentProps<typeof Input> & {
  wrapperClassName?: string
}

export function SearchInput({ className, wrapperClassName, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input className={cn('pl-10', className)} {...props} />
    </div>
  )
}
