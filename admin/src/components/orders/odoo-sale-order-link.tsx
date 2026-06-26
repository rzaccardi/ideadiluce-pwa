import { useSnapshot } from 'valtio/react'
import { ExternalLinkIcon } from 'lucide-react'
import { adminAuthStore } from '@/features/auth'
import { buildOdooSaleOrderUrl } from '@/lib/odoo-url'
import { cn } from '@/lib/utils'

type OdooSaleOrderLinkProps = {
  saleOrderId: number | null | undefined
  className?: string
}

export function OdooSaleOrderLink({ saleOrderId, className }: OdooSaleOrderLinkProps) {
  const auth = useSnapshot(adminAuthStore)
  const odooWebBaseUrl = auth.workspace?.odooWebBaseUrl ?? null

  if (saleOrderId == null || !Number.isInteger(saleOrderId) || saleOrderId <= 0) {
    return null
  }

  const label = `SO #${saleOrderId}`

  if (odooWebBaseUrl == null) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)} aria-label={label}>
        {label}
      </span>
    )
  }

  const href = buildOdooSaleOrderUrl(odooWebBaseUrl, saleOrderId)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline',
        className,
      )}
      aria-label={`Apri in Odoo ${label}`}
    >
      <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </a>
  )
}
