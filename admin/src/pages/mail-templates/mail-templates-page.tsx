import { useEffect, useState } from 'react'
import { RoutePageHeader } from '@/components/route-page-header'
import { RouteSkeleton } from '@/components/shared'
import { adminApi } from '@/lib/api'
import {
  mailTemplateAudienceLabel,
  type MailTemplatePreview,
  type MailTemplatePreviewList,
} from '@/types/mail-templates'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function MailTemplatesPage() {
  const [items, setItems] = useState<MailTemplatePreview[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminApi<MailTemplatePreviewList>('/admin/mail-templates')
      .then((data) => {
        if (cancelled) return
        setItems(data.items)
        setSelectedKey((current) => current ?? data.items[0]?.key ?? null)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Impossibile caricare i template')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selected = items.find((item) => item.key === selectedKey) ?? null

  return (
    <div className="flex flex-col gap-6">
      <RoutePageHeader />

      {loading ? <RouteSkeleton variant="detail" /> : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Elenco</CardTitle>
              <CardDescription>{items.length} template sincronizzati in Odoo</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 p-3 pt-0">
              {items.map((item) => {
                const active = item.key === selected?.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedKey(item.key)}
                    className={cn(
                      'flex min-w-0 flex-col items-start gap-1 rounded-md px-3 py-2 text-left',
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    <span className="w-full truncate text-sm font-medium">{item.label}</span>
                    <Badge variant={item.audience === 'interno' ? 'outline' : 'secondary'}>
                      {mailTemplateAudienceLabel(item.audience)}
                    </Badge>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{selected?.label ?? 'Anteprima'}</CardTitle>
              <CardDescription>
                {selected
                  ? `Oggetto: ${selected.subject}. Dati di esempio, gli script sono disattivati.`
                  : 'Seleziona un template.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selected?.bodyHtml.trim() ? (
                <iframe
                  title={`Anteprima ${selected.label}`}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  srcDoc={selected.bodyHtml}
                  className="min-h-[640px] w-full rounded-md border border-gray-200 bg-white"
                />
              ) : (
                <p className="text-sm italic text-gray-400">Nessun HTML disponibile.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
