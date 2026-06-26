import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type KpiStatCardProps = {
  label: string
  value: string | number
  className?: string
  valueClassName?: string
}

export function KpiStatCard({ label, value, className, valueClassName }: KpiStatCardProps) {
  return (
    <Card
      className={cn(
        'shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <CardHeader className="pb-0 pt-3 sm:pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      </CardHeader>
      <CardContent className="pt-2 pb-3 sm:pt-3 sm:pb-4">
        <p
          className={cn(
            'text-xl font-bold tracking-tight text-gray-900 tabular-nums sm:text-2xl xl:text-3xl',
            valueClassName,
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
