'use client'

import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { AdminPageLoadTransition, RouteSkeleton } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  createTaxRule,
  deleteTaxRule,
  fetchTaxRules,
  saveTaxRule,
  taxRulesStore,
} from '@/features/tax-rules'

export function TaxRulesPage() {
  const tax = useSnapshot(taxRulesStore)
  const [draft, setDraft] = useState({
    priority: '50',
    shippingCountry: 'IT',
    taxRatePct: '22',
    taxLabel: 'IVA 22%',
  })

  useEffect(() => {
    void fetchTaxRules()
  }, [])

  return (
    <AdminPageLoadTransition
      isLoading={tax.isLoading}
      skeleton={<RouteSkeleton variant="form" />}
      loadingHeader={<RoutePageHeader />}
    >
    <div className="space-y-6">
      <RoutePageHeader description={`${tax.rules.length} regole fiscali configurate`} />

      {tax.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{tax.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Nuova regola</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label>Priorità</Label>
              <Input
                value={draft.priority}
                onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Paese spedizione</Label>
              <Input
                value={draft.shippingCountry}
                onChange={(e) => setDraft((d) => ({ ...d, shippingCountry: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Aliquota %</Label>
              <Input
                value={draft.taxRatePct}
                onChange={(e) => setDraft((d) => ({ ...d, taxRatePct: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Etichetta</Label>
              <Input
                value={draft.taxLabel}
                onChange={(e) => setDraft((d) => ({ ...d, taxLabel: e.target.value }))}
              />
            </div>
          </div>
          <Button
            variant="success"
            onClick={() =>
              void createTaxRule({
                priority: Number(draft.priority),
                shippingCountry: draft.shippingCountry,
                taxRatePct: Number(draft.taxRatePct),
                taxLabel: draft.taxLabel,
                customerSegment: null,
                isProfessional: null,
                billingCountry: null,
                vatValid: null,
                disclaimerKey: null,
                odooFiscalPositionId: null,
                enabled: true,
              })
            }
          >
            Aggiungi regola
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priorità</TableHead>
                <TableHead>Spedizione</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>VAT</TableHead>
                <TableHead>Aliquota</TableHead>
                <TableHead>Etichetta</TableHead>
                <TableHead>Attiva</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tax.rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell className="font-mono text-xs">{rule.shippingCountry}</TableCell>
                  <TableCell>{rule.customerSegment ?? '—'}</TableCell>
                  <TableCell>
                    {rule.vatValid == null ? '—' : rule.vatValid ? 'valido' : 'non valido'}
                  </TableCell>
                  <TableCell>{rule.taxRatePct}%</TableCell>
                  <TableCell>{rule.taxLabel}</TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => void saveTaxRule(rule.id, { enabled })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => void deleteTaxRule(rule.id)}>
                      Elimina
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </AdminPageLoadTransition>
  )
}
