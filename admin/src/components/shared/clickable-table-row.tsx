import { useNavigate } from 'react-router-dom'
import { TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type ClickableTableRowProps = React.ComponentProps<typeof TableRow> & {
  to: string
}

export function ClickableTableRow({ to, className, children, ...props }: ClickableTableRowProps) {
  const navigate = useNavigate()

  return (
    <TableRow
      className={cn('cursor-pointer hover:bg-muted/50', className)}
      onClick={() => navigate(to)}
      {...props}
    >
      {children}
    </TableRow>
  )
}
