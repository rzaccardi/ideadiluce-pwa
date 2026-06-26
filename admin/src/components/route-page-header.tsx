import { useLocation } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { getPageMeta } from '@/lib/nav-config'

type RoutePageHeaderProps = {
  /** Sostituisce il titolo da nav-config (es. dettaglio con nome entità). */
  title?: string
  /** Sostituisce la descrizione statica; utile per conteggi dinamici. */
  description?: string
  actions?: React.ReactNode
  className?: string
}

/** Header lista/modulo: titolo, icona e stile da `getPageMeta`, descrizione opzionale per pagina. */
export function RoutePageHeader({ title, description, actions, className }: RoutePageHeaderProps) {
  const { pathname, search } = useLocation()
  const meta = getPageMeta(pathname, search)

  return (
    <PageHeader
      className={className}
      icon={meta.icon}
      iconBoxClassName={meta.iconBgClassName}
      iconClassName={meta.iconClassName}
      title={title ?? meta.title}
      description={description ?? meta.description}
      actions={actions}
    />
  )
}
