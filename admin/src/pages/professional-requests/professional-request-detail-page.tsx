import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { ArrowLeftIcon } from 'lucide-react'
import {
  adminProfessionalRequestsStore,
  fetchAdminProfessionalRequestDetail,
  patchAdminProfessionalRequest,
  resetAdminProfessionalRequestDetail,
} from '@/features/professional-requests'
import type { ProfessionalRequestAdminStatus } from '@/types/professional-requests'
import {
  PROFESSIONAL_REQUEST_STATUS_OPTIONS,
  professionalRequestStatusLabel,
} from '@/types/professional-requests'
import { OdooPartnerLink } from '@/components/odoo/odoo-partner-link'
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

export function ProfessionalRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const store = useSnapshot(adminProfessionalRequestsStore)
  const [status, setStatus] = useState<ProfessionalRequestAdminStatus>('NEW')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    void fetchAdminProfessionalRequestDetail(id)
    return () => {
      resetAdminProfessionalRequestDetail()
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    const request = store.detail
    if (!request || request.id !== id) return
    setStatus((request.status as ProfessionalRequestAdminStatus) || 'NEW')
    setAdminNotes(request.adminNotes ?? '')
  }, [store.detail, id])

  if (store.detailLoading || (store.detailId === id && !store.detail && !store.detailError)) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio richiesta professionista" />
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
        <Button variant="outline" render={<Link to="/professional-requests" />}>
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
      await patchAdminProfessionalRequest(id, {
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
          title={request.companyName}
          description={`${professionalRequestStatusLabel(request.status)} · ${new Date(request.createdAt).toLocaleString('it-IT')}`}
        />
        <DetailPageActionBar
          secondary={
            <Button variant="outline" className="w-full lg:w-auto" render={<Link to="/professional-requests" />}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Elenco richieste
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati attività</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <DetailField label="Ragione sociale">
            <DetailValue>{request.companyName}</DetailValue>
          </DetailField>
          <DetailField label="Partita IVA">
            <DetailValue className="font-mono">
              {request.vatNumber}
              {request.vatValidated ? (
                <Badge variant="outline" className="ml-2 text-xs">
                  VIES OK
                </Badge>
              ) : null}
              {request.vatForceAccepted ? (
                <Badge variant="outline" className="ml-2 text-xs">
                  VIES non disponibile
                </Badge>
              ) : null}
            </DetailValue>
          </DetailField>
          <DetailField label="Paese">
            <DetailValue>{request.country}</DetailValue>
          </DetailField>
          <DetailField label="Settore">
            <DetailValue>
              {request.sector}
              {request.sectorOther ? ` — ${request.sectorOther}` : ''}
            </DetailValue>
          </DetailField>
          <DetailField label="Referente">
            <DetailValue>{request.contactName}</DetailValue>
          </DetailField>
          <DetailField label="Email">
            <DetailValue>
              <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                {request.email}
              </a>
            </DetailValue>
          </DetailField>
          <DetailField label="Telefono">
            <DetailValue>{request.phone}</DetailValue>
          </DetailField>
          <DetailField label="PEC">
            <DetailValue>{request.pec ?? '-'}</DetailValue>
          </DetailField>
          <DetailField label="Codice SDI">
            <DetailValue className="font-mono">{request.sdiCode ?? '-'}</DetailValue>
          </DetailField>
          <DetailField label="Visura camerale">
            <DetailValue>
              {request.visuraUrl ? (
                <a href={request.visuraUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Apri documento
                </a>
              ) : (
                '-'
              )}
            </DetailValue>
          </DetailField>
          <DetailField label="Partner Odoo">
            <DetailValue>
              {request.odooPartnerId ? (
                <OdooPartnerLink partnerId={request.odooPartnerId} />
              ) : (
                '-'
              )}
            </DetailValue>
          </DetailField>
          {request.odooSyncError ? (
            <DetailField label="Errore sync Odoo" className="sm:col-span-2">
              <DetailValue className="text-destructive">{request.odooSyncError}</DetailValue>
            </DetailField>
          ) : null}
          <DetailField label="Lingua">
            <DetailValue>{request.locale}</DetailValue>
          </DetailField>
          <DetailField label="Utente collegato">
            <DetailValue>{request.userId ?? '-'}</DetailValue>
          </DetailField>
          <DetailField label="Stato attuale" className="sm:col-span-2">
            <Badge variant="secondary">
              {professionalRequestStatusLabel(request.status)}
            </Badge>
          </DetailField>
          {request.message ? (
            <DetailField label="Messaggio cliente" className="sm:col-span-2">
              <DetailValue className="whitespace-pre-wrap">{request.message}</DetailValue>
            </DetailField>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gestione BO</CardTitle>
          <CardDescription>
            Aprire il dettaglio imposta automaticamente lo stato su «In valutazione». Approvando si attivano le condizioni professional sull&apos;account collegato.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex max-w-lg flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="professional-detail-status">Stato richiesta</Label>
            <Select
              value={status}
              onValueChange={(v) => v && setStatus(v as ProfessionalRequestAdminStatus)}
              disabled={saving || store.statusSaving}
            >
              <SelectTrigger id="professional-detail-status" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFESSIONAL_REQUEST_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="professional-admin-notes">Note interne BO</Label>
            <Textarea
              id="professional-admin-notes"
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
