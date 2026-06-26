import { useSnapshot } from 'valtio/react'
import { ExternalLinkIcon } from 'lucide-react'
import { adminAuthStore } from '@/features/auth'
import { buildOdooProductUrl, DEFAULT_ODOO_PRODUCT_ACTION_ID } from '@/lib/odoo-url'
import { cn } from '@/lib/utils'

type OdooHubProductLinkProps = {
  odooProductId: number | null | undefined
  productRef?: string
  className?: string
}

function resolveOdooProductId(
  odooProductId: number | null | undefined,
  productRef?: string,
): number | null {
  if (odooProductId != null && Number.isInteger(odooProductId) && odooProductId > 0) {
    return odooProductId
  }

  const ref = productRef?.trim()
  if (!ref) return null

  const odooPrefix = /^odoo:(\d+)$/i.exec(ref)
  if (odooPrefix) {
    const id = Number(odooPrefix[1])
    return Number.isInteger(id) && id > 0 ? id : null
  }

  if (/^\d+$/.test(ref)) {
    const id = Number(ref)
    return Number.isInteger(id) && id > 0 ? id : null
  }

  return null
}

export function OdooHubProductLink({
  odooProductId,
  productRef,
  className,
}: OdooHubProductLinkProps) {
  const auth = useSnapshot(adminAuthStore)
  const productId = resolveOdooProductId(odooProductId, productRef)
  const odooWebBaseUrl = auth.workspace?.odooWebBaseUrl ?? null
  const odooProductActionId =
    auth.workspace?.odooProductActionId ?? DEFAULT_ODOO_PRODUCT_ACTION_ID

  if (productId == null) return null

  const label = 'Apri in Odoo'
  if (odooWebBaseUrl == null) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)} aria-label={`Odoo #${productId}`}>
        Odoo #{productId}
      </span>
    )
  }

  const href = buildOdooProductUrl(odooWebBaseUrl, productId, odooProductActionId)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline',
        className,
      )}
      aria-label={`${label} #${productId}`}
    >
      <ExternalLinkIcon className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </a>
  )
}
