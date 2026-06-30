import type { QuoteLineDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import type { MessageKey } from '@/i18n/messages'

type Props = {
  lines: readonly QuoteLineDTO[]
  currencyCode: string
  tParams: (key: MessageKey, params: Record<string, string | number>) => string
}

export function AccountDcQuoteLines({ lines, currencyCode, tParams }: Props) {
  if (lines.length === 0) return null

  return (
    <ul className="divide-y divide-[#ededea] rounded-xl border border-idl-tech-border bg-white dark:bg-idl-tech-panel">
      {lines.map((line) => (
        <li
          key={`${line.productRef}-${line.variantRef ?? ''}-${line.quantity}`}
          className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-3.5 text-sm"
        >
          <div className="min-w-0">
            <div className="font-mono text-[10px] text-[#8b919b]">{line.productRef}</div>
            <p className="font-semibold text-idl-graphite">{line.productName}</p>
            <p className="text-[12.5px] text-idl-muted">
              {tParams('orders.detail.quantity', { count: line.quantity })}
            </p>
          </div>
          <p className="font-extrabold text-idl-graphite">
            {formatMoney(line.lineTotalCents, currencyCode)}
          </p>
        </li>
      ))}
    </ul>
  )
}
