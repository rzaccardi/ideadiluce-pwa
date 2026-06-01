import { useState, type ReactNode } from 'react'
import type { CheckoutDebugSummary } from '@/types/integrations'
import { KeyValueList } from '@/components/checkout-test/KeyValueList'

type Props = {
  debug: CheckoutDebugSummary
}

function Collapse({
  title,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string
  defaultOpen?: boolean
  badge?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        <span>
          {title}
          {badge ? (
            <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-normal text-zinc-600">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="text-zinc-400">{open ? '−' : '+'}</span>
      </button>
      {open ? <div className="border-t border-zinc-100 px-3 py-3">{children}</div> : null}
    </div>
  )
}

export function CheckoutDebugPanel({ debug }: Props) {
  const itemPreview =
    debug.cartSnapshot.items.length <= 3
      ? `${debug.cartSnapshot.itemCount} righe`
      : `${debug.cartSnapshot.itemCount} righe (tabella espandibile)`

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-3">
        <KeyValueList
          rows={[
            { label: 'requestMode', value: debug.requestMode },
            {
              label: 'correlationId',
              value: <code className="text-xs break-all">{debug.correlationId}</code>,
            },
            { label: 'checkoutSessionId', value: debug.checkoutSessionId ?? '—' },
          ]}
        />
      </div>

      {debug.notes.length > 0 ? (
        <Collapse title="Note" defaultOpen badge={String(debug.notes.length)}>
          <ul className="list-inside list-disc space-y-1 text-xs text-zinc-700">
            {debug.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Collapse>
      ) : null}

      <Collapse title="Cart snapshot" badge={itemPreview}>
        <KeyValueList
          rows={[
            { label: 'cartId', value: <code className="text-xs break-all">{debug.cartSnapshot.cartId}</code> },
            { label: 'currency', value: debug.cartSnapshot.currencyCode },
            { label: 'status', value: debug.cartSnapshot.status },
          ]}
        />
        <div className="mt-2 max-h-36 overflow-auto rounded border border-zinc-100 bg-zinc-50 text-xs">
          <table className="w-full text-left text-zinc-700">
            <thead className="sticky top-0 bg-zinc-100/95 text-zinc-500">
              <tr>
                <th className="px-2 py-1 font-medium">ref</th>
                <th className="px-2 py-1 font-medium">qty</th>
                <th className="px-2 py-1 font-medium">cents</th>
              </tr>
            </thead>
            <tbody>
              {debug.cartSnapshot.items.map((i) => (
                <tr key={i.id} className="border-t border-zinc-100">
                  <td className="px-2 py-1 font-mono">{i.productRef}</td>
                  <td className="px-2 py-1">{i.quantity}</td>
                  <td className="px-2 py-1 tabular-nums">{i.clientUnitPriceEstimateCents ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Collapse>

      <Collapse title="Riepilogo Odoo (proxy)">
        <KeyValueList
          rows={[
            { label: 'partnerId', value: String(debug.odooSummary.partnerId) },
            { label: 'saleOrderId', value: String(debug.odooSummary.saleOrderId) },
            { label: 'providerRef', value: debug.odooSummary.providerRef ?? '—' },
          ]}
        />
      </Collapse>

      {debug.legacyFields?.paymentDebug ? (
        <Collapse title="Payment debug" badge="JSON">
          <pre className="max-h-32 overflow-auto rounded bg-zinc-950 p-2 text-[11px] leading-relaxed text-zinc-100">
            {JSON.stringify(debug.legacyFields.paymentDebug, null, 2)}
          </pre>
        </Collapse>
      ) : null}
    </div>
  )
}
