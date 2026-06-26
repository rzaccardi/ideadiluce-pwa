import { useSnapshot } from 'valtio/react'
import { ExternalLinkIcon } from 'lucide-react'
import { adminAuthStore } from '@/features/auth'
import { buildOdooPartnerUrl } from '@/lib/odoo-url'
import { cn } from '@/lib/utils'

type OdooPartnerLinkProps = {
  partnerId: number | null | undefined
  label?: string | null
  className?: string
}

export function OdooPartnerLink({ partnerId, label, className }: OdooPartnerLinkProps) {
  const auth = useSnapshot(adminAuthStore)
  const odooWebBaseUrl = auth.workspace?.odooWebBaseUrl ?? null

  if (partnerId == null || !Number.isInteger(partnerId) || partnerId <= 0) {
    return null
  }

  const display = label?.trim() || `Partner #${partnerId}`

  if (odooWebBaseUrl == null) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)} aria-label={display}>
        {display}
      </span>
    )
  }

  const href = buildOdooPartnerUrl(odooWebBaseUrl, partnerId)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline',
        className,
      )}
      aria-label={`Apri in Odoo ${display}`}
    >
      <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {display}
    </a>
  )
}
