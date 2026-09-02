import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react'
import {
  adminMailLogStore,
  fetchAdminMailLogDetail,
  resetAdminMailLogDetail,
} from '@/features/mail-log'
import { mailLogStateLabel } from '@/types/mail-log'
import {
  DetailField,
  DetailPageActionBar,
  DetailValue,
  RouteSkeleton,
  SitePageHeader,
} from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'

function stateBadgeVariant(state: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (state === 'sent') return 'default'
  if (state === 'exception' || state === 'bounce') return 'destructive'
  if (state === 'cancel') return 'outline'
  return 'secondary'
}

export function MailLogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const store = useSnapshot(adminMailLogStore)

  useEffect(() => {
    if (!id) return
    void fetchAdminMailLogDetail(id)
    return () => {
      resetAdminMailLogDetail()
    }
  }, [id])

  if (store.detailLoading || (store.detailId === id && !store.detail && !store.detailError)) {
    return (
      <div className="flex flex-col gap-6">
        <SitePageHeader title="Dettaglio email" />
        <RouteSkeleton variant="detail" />
      </div>
    )
  }

  if (store.detailError && store.detailId === id && !store.detail) {
    return (
      <div className="flex flex-col gap-6">
        <SitePageHeader title="Dettaglio email" />
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.detailError}</AlertDescription>
        </Alert>
        <Button variant="outline" render={<Link to="/mail-log" />}>
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Torna allo storico
        </Button>
      </div>
    )
  }

  const mail = store.detail
  if (!mail || String(mail.id) !== id) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SitePageHeader
          title={mail.subject}
          description={`${mail.templateLabel} · ${mail.emailTo}`}
        />
        <DetailPageActionBar
          secondary={
            <Button variant="outline" className="w-full lg:w-auto" render={<Link to="/mail-log" />}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Storico email
            </Button>
          }
          primary={
            mail.odooUrl ? (
              <Button
                variant="outline"
                className="w-full lg:w-auto"
                render={<a href={mail.odooUrl} target="_blank" rel="noopener noreferrer" />}
              >
                Apri in Odoo
                <ExternalLinkIcon className="h-4 w-4" aria-hidden />
              </Button>
            ) : undefined
          }
        />
      </div>

      <Alert
        variant={
          mail.deliveryState === 'exception' || mail.deliveryState === 'bounce' ? 'destructive' : undefined
        }
      >
        <AlertTitle>
          {mailLogStateLabel(mail.deliveryState || mail.state, mail.deliveryLabel)}
        </AlertTitle>
        <AlertDescription>
          {mail.deliveryNote ||
            (mail.deliveryState === 'sent'
              ? 'Odoo conferma che il server di posta ha accettato il messaggio.'
              : 'Stato registrato da Odoo.')}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Metadati</CardTitle>
          <CardDescription>Email #{mail.id} conservata in Odoo</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Esito Odoo">
            <Badge variant={stateBadgeVariant(mail.deliveryState || mail.state)}>
              {mailLogStateLabel(mail.deliveryState || mail.state, mail.deliveryLabel)}
            </Badge>
          </DetailField>
          <DetailField label="Inviata il">
            <DetailValue>{formatDateTime(mail.sentAt)}</DetailValue>
          </DetailField>
          <DetailField label="Destinatario">
            <DetailValue>{mail.emailTo}</DetailValue>
          </DetailField>
          <DetailField label="Mittente">
            <DetailValue empty={!mail.emailFrom}>{mail.emailFrom}</DetailValue>
          </DetailField>
          <DetailField label="Reply-To">
            <DetailValue empty={!mail.replyTo}>{mail.replyTo}</DetailValue>
          </DetailField>
          <DetailField label="Tipo">
            <DetailValue>{mail.templateLabel}</DetailValue>
          </DetailField>
          {mail.failureReason ? (
            <DetailField label="Errore Odoo" className="sm:col-span-2">
              <DetailValue>{mail.failureReason}</DetailValue>
            </DetailField>
          ) : null}
          {mail.attachments.length > 0 ? (
            <DetailField label="Allegati" className="sm:col-span-2">
              <DetailValue>{mail.attachments.map((a) => a.name).join(', ')}</DetailValue>
            </DetailField>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Anteprima</CardTitle>
          <CardDescription>Contenuto HTML così come salvato da Odoo. Gli script sono disattivati.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {mail.bodyHtml.trim() ? (
            <iframe
              title="Anteprima email"
              sandbox=""
              referrerPolicy="no-referrer"
              srcDoc={mail.bodyHtml}
              className="min-h-[420px] w-full rounded-md border border-gray-200 bg-white"
            />
          ) : (
            <p className="text-sm italic text-gray-400">Nessun HTML disponibile.</p>
          )}
          {mail.bodyText ? (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              {mail.bodyText}
            </pre>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
