import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { ArrowLeftIcon } from 'lucide-react'
import {
  adminSiteInquiriesStore,
  fetchAdminSiteInquiryDetail,
  patchAdminSiteInquiry,
  resetAdminSiteInquiryDetail,
} from '@/features/site-inquiries'
import type { SiteInquiryAdminStatus } from '@/types/site-inquiries'
import {
  SITE_INQUIRY_STATUS_OPTIONS,
  siteInquiryKindLabel,
  siteInquiryStatusLabel,
} from '@/types/site-inquiries'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function SiteInquiryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const store = useSnapshot(adminSiteInquiriesStore)
  const [status, setStatus] = useState<SiteInquiryAdminStatus>('NEW')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    void fetchAdminSiteInquiryDetail(id)
    return () => {
      resetAdminSiteInquiryDetail()
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    const request = store.detail
    if (!request || request.id !== id) return
    setStatus((request.status as SiteInquiryAdminStatus) || 'NEW')
    setAdminNotes(request.adminNotes ?? '')
  }, [store.detail, id])

  if (store.detailLoading || (store.detailId === id && !store.detail && !store.detailError)) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio richiesta contatto" />
        <RouteSkeleton variant="detail" />
      </div>
    )
  }

  if (store.detailError && store.detailId === id && !store.detail) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio richiesta" />
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.detailError}</AlertDescription>
        </Alert>
        <Button variant="outline" render={<Link to="/site-inquiries" />}>
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Torna all&apos;elenco
        </Button>
      </div>
    )
  }

  const request = store.detail
  if (!request || request.id !== id) return null

  async function onSave() {
    if (!id) return
    setSaving(true)
    try {
      await patchAdminSiteInquiry(id, {
        status,
        adminNotes: adminNotes.trim() || null,
      })
      toast.success('Richiesta aggiornata')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Aggiornamento fallito')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SitePageHeader
          title={request.name}
          description={`${siteInquiryKindLabel(request.kind)} · ${siteInquiryStatusLabel(request.status)} · ${new Date(request.createdAt).toLocaleString('it-IT')}`}
        />
        <DetailPageActionBar
          secondary={
            <Button variant="outline" className="w-full lg:w-auto" render={<Link to="/site-inquiries" />}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Elenco richieste
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati richiesta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <DetailField label="Tipo">
            <DetailValue>{siteInquiryKindLabel(request.kind)}</DetailValue>
          </DetailField>
          <DetailField label="Stato attuale">
            <Badge variant="secondary">{siteInquiryStatusLabel(request.status)}</Badge>
          </DetailField>
          <DetailField label="Nome">
            <DetailValue>{request.name}</DetailValue>
          </DetailField>
          <DetailField label="Email">
            <DetailValue>
              <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                {request.email}
              </a>
            </DetailValue>
          </DetailField>
          <DetailField label="Telefono">
            <DetailValue>
              {request.phone ? (
                <a href={`tel:${request.phone}`} className="text-primary hover:underline">
                  {request.phone}
                </a>
              ) : (
                '-'
              )}
            </DetailValue>
          </DetailField>
          <DetailField label="Lingua">
            <DetailValue>{request.locale ?? '-'}</DetailValue>
          </DetailField>
          <DetailField label="Codice / EAN">
            <DetailValue className="font-mono">{request.productCode ?? '-'}</DetailValue>
          </DetailField>
          <DetailField label="Marca">
            <DetailValue>{request.brand ?? '-'}</DetailValue>
          </DetailField>
          <DetailField label="Quantità">
            <DetailValue>{request.quantity ?? '-'}</DetailValue>
          </DetailField>
          <DetailField label="Uso">
            <DetailValue>{request.usage ?? '-'}</DetailValue>
          </DetailField>
          <DetailField label="Urgenza">
            <DetailValue>{request.urgency ?? '-'}</DetailValue>
          </DetailField>
          {request.message ? (
            <DetailField label="Messaggio" className="sm:col-span-2">
              <DetailValue className="whitespace-pre-wrap">{request.message}</DetailValue>
            </DetailField>
          ) : null}
          {request.attachments.length > 0 ? (
            <DetailField label="Allegati" className="sm:col-span-2">
              <DetailValue>
                <ul className="space-y-1">
                  {request.attachments.map((file, index) => (
                    <li key={`${file.filename}-${index}`}>
                      {file.url ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {file.filename}
                        </a>
                      ) : (
                        <span>{file.filename} (solo in email)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </DetailValue>
            </DetailField>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gestione BO</CardTitle>
          <CardDescription>
            Aprire il dettaglio imposta automaticamente lo stato su «In lavorazione».
          </CardDescription>
        </CardHeader>
        <CardContent className="flex max-w-lg flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="site-inquiry-detail-status">Stato richiesta</Label>
            <Select
              value={status}
              onValueChange={(v) => v && setStatus(v as SiteInquiryAdminStatus)}
              disabled={saving || store.statusSaving}
            >
              <SelectTrigger id="site-inquiry-detail-status" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITE_INQUIRY_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="site-inquiry-admin-notes">Note interne BO</Label>
            <Textarea
              id="site-inquiry-admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Note visibili solo in backoffice…"
              disabled={saving || store.statusSaving}
            />
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={saving || store.statusSaving}
            onClick={() => void onSave()}
          >
            {saving || store.statusSaving ? 'Salvataggio…' : 'Salva modifiche'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
