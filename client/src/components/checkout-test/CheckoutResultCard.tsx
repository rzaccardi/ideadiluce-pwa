import { Button } from '@/components/Button'
import { KeyValueList } from '@/components/checkout-test/KeyValueList'
import { safeHttpUrlForRedirect } from '@/lib/safeRedirectUrl'
import type { TestCheckoutResponse } from '@/types/integrations'

type Props = {
  result: TestCheckoutResponse
  lastSubmittedAt: number | null
}

export function CheckoutResultCard({ result, lastSubmittedAt }: Props) {
  const safeRedirect = safeHttpUrlForRedirect(result.redirectUrl)
  const hasUnsafeRedirect = Boolean(result.redirectUrl && !safeRedirect)
  const ts =
    lastSubmittedAt != null
      ? new Date(lastSubmittedAt).toLocaleString('it-IT', {
          dateStyle: 'medium',
          timeStyle: 'medium',
        })
      : '—'

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            result.success
              ? 'bg-emerald-100 text-emerald-900'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {result.success ? 'Success' : 'Failure'}
        </span>
        <span className="text-xs text-zinc-500">Ultimo test: {ts}</span>
      </div>

      <div className="mt-4">
        <KeyValueList
          rows={[
            { label: 'checkoutState', value: result.checkoutState },
            { label: 'odooPartnerId', value: result.odooPartnerId ?? '—' },
            { label: 'odooSaleOrderId', value: result.odooSaleOrderId ?? '—' },
            {
              label: 'redirectUrl',
              value: result.redirectUrl ? (
                <span className="break-all font-mono text-xs">{result.redirectUrl}</span>
              ) : (
                <span className="text-zinc-500">null</span>
              ),
            },
          ]}
        />
      </div>

      {hasUnsafeRedirect ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          URL di redirect non sicuro o schema non http(s): non è possibile aprirlo da qui.
        </p>
      ) : null}

      {safeRedirect ? (
        <div className="mt-4">
          <Button
            type="button"
            onClick={() => window.location.assign(safeRedirect)}
          >
            Paga ora su Odoo
          </Button>
        </div>
      ) : null}
    </div>
  )
}
