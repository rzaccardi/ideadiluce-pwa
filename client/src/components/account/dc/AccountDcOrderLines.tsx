import type { OrderLineDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { SiteImage } from '@/components/site/SiteImage'
import type { MessageKey } from '@/i18n/messages'

type Props = {
  lines: readonly OrderLineDTO[]
  currencyCode: string | null
  t: (key: MessageKey) => string
  tParams: (key: MessageKey, params: Record<string, string | number>) => string
  quantityKey?: MessageKey
}

export function AccountDcOrderLines({
  lines,
  currencyCode,
  t,
  tParams,
  quantityKey = 'orders.detail.quantity',
}: Props) {
  if (lines.length === 0) return null

  return (
    <ul className="divide-y divide-[#ededea]">
      {lines.map((line, idx) => (
        <li
          key={`${line.productRef}-${line.variantRef ?? ''}-${idx}`}
          className="flex gap-3.5 py-4 first:pt-0 last:pb-0"
        >
          <div className="relative size-[66px] shrink-0 overflow-hidden rounded-[9px] bg-idl-tech-panel">
            {line.imageUrl ? (
              <SiteImage src={line.imageUrl} alt="" fill className="object-cover" sizes="66px" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] text-[#8b919b]">{line.productRef}</div>
            <div className="text-sm font-semibold leading-snug text-idl-graphite">
              {line.productName ?? line.productRef}
            </div>
            <div className="text-[12.5px] text-idl-muted">
              {tParams(quantityKey, { count: line.quantity })}
            </div>
          </div>
          <div className="text-sm font-bold whitespace-nowrap text-idl-graphite">
            {line.lineTotalCents != null && currencyCode
              ? formatMoney(line.lineTotalCents, currencyCode)
              : t('common.notAvailable')}
          </div>
        </li>
      ))}
    </ul>
  )
}
