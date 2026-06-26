import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { toast } from 'sonner'
import { ArrowLeftIcon } from 'lucide-react'
import {
  adminRestockStore,
  fetchAdminRestockDetail,
  patchAdminRestock,
  resetAdminRestockDetail,
} from '@/features/restock'
import type { StockRestockAdminStatus } from '@/types/restock'
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

const ADMIN_STATUS_OPTIONS: { value: StockRestockAdminStatus; label: string }[] = [
  { value: 'NEW', label: 'Nuova' },
  { value: 'IN_PROGRESS', label: 'In lavorazione' },
  { value: 'HANDLED', label: 'Gestita' },
  { value: 'ARCHIVED', label: 'Archiviata' },
]

export function RestockDetailPage() {
  const { id } = useParams<{ id: string }>()
  const store = useSnapshot(adminRestockStore)
  const [adminStatus, setAdminStatus] = useState<StockRestockAdminStatus>('NEW')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    void fetchAdminRestockDetail(id)
    return () => {
      resetAdminRestockDetail()
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    const detail = store.detail
    if (!detail || detail.id !== id) return
    setAdminStatus(detail.adminStatus)
    setAdminNotes(detail.adminNotes ?? '')
  }, [store.detail, id])

  if (store.detailLoading || (store.detailId === id && !store.detail && !store.detailError)) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio richiesta di riassortimento" />
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
        <Button variant="outline" render={<Link to="/restock" />}>
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Torna all&apos;elenco
        </Button>
      </div>
    )
  }

  const request = store.detail
  if (!request || request.id !== id) return null

  const typeLabel =
    request.requestType === 'PRODUCT_REQUEST' ? 'Richiesta prodotto' : 'Avvisami al restock'

  async function onSave() {
    if (!id) return
    setSaving(true)
    try {
      await patchAdminRestock(id, {
        adminStatus,
        adminNotes: adminNotes.trim() || null,
      })
      toast.success('Richiesta aggiornata')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SitePageHeader
          title="Dettaglio richiesta"
          description={`${request.productName ?? request.productRef} · ${typeLabel}`}
        />
        <DetailPageActionBar
          primary={
            <Button variant="success" className="w-full lg:w-auto" disabled={saving} onClick={() => void onSave()}>
              {saving ? 'Salvataggio…' : 'Salva stato e note'}
            </Button>
          }
          secondary={
            <Button variant="outline" className="w-full lg:w-auto" render={<Link to="/restock" />}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Elenco richieste
            </Button>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contatto</CardTitle>
            <CardDescription>Email e utente che ha inviato la richiesta</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Email">
              <DetailValue>{request.email}</DetailValue>
            </DetailField>
            <DetailField label="Utente registrato">
              <DetailValue>{request.userEmail ?? 'Guest'}</DetailValue>
            </DetailField>
            <DetailField label="Lingua">
              <DetailValue>{request.locale}</DetailValue>
            </DetailField>
            <DetailField label="Tipo richiesta">
              <DetailValue>
                <Badge variant="outline">{typeLabel}</Badge>
              </DetailValue>
            </DetailField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prodotto</CardTitle>
            <CardDescription>Articolo richiesto e riferimenti catalogo</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Nome">
              <DetailValue>{request.productName ?? request.productRef}</DetailValue>
            </DetailField>
            <DetailField label="Slug">
              <DetailValue>{request.productSlug ?? '—'}</DetailValue>
            </DetailField>
            <DetailField label="Ref prodotto">
              <DetailValue>{request.productRef}</DetailValue>
            </DetailField>
            <DetailField label="Variante">
              <DetailValue>{request.variantRef ?? '—'}</DetailValue>
            </DetailField>
            <DetailField label="Quantità">
              <DetailValue>{request.quantity}</DetailValue>
            </DetailField>
            <DetailField label="Odoo template">
              <DetailValue>
                {request.odooTemplateId != null ? (
                  <Badge variant="outline">#{request.odooTemplateId}</Badge>
                ) : (
                  '—'
                )}
              </DetailValue>
            </DetailField>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestione operativa</CardTitle>
          <CardDescription>Stato interno e note per il team Emil</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="restock-detail-status">Stato BO</Label>
            <Select
              value={adminStatus}
              onValueChange={(v) => setAdminStatus(v as StockRestockAdminStatus)}
            >
              <SelectTrigger id="restock-detail-status" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="restock-detail-notes">Note admin</Label>
            <Textarea
              id="restock-detail-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Note interne (opzionale)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cronologia</CardTitle>
          <CardDescription>Date di creazione, aggiornamento e notifica cliente</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <DetailField label="Richiesta il">
            <DetailValue>{new Date(request.createdAt).toLocaleString('it-IT')}</DetailValue>
          </DetailField>
          <DetailField label="Ultimo aggiornamento">
            <DetailValue>{new Date(request.updatedAt).toLocaleString('it-IT')}</DetailValue>
          </DetailField>
          <DetailField label="Cliente notificato il">
            <DetailValue>
              {request.notifiedAt
                ? new Date(request.notifiedAt).toLocaleString('it-IT')
                : '—'}
            </DetailValue>
          </DetailField>
        </CardContent>
      </Card>
    </div>
  )
}
