'use client'

import { useState } from 'react'
import { formatMoney } from '@/lib/format'
import { bankTransferCopyText } from '@/lib/bankTransferConfig'
import type { BankTransferInstructions } from '@/lib/bankTransfer'
import { StripeFieldGroup } from '@/components/checkout/stripe-ui/StripeFields'
import { useI18n } from '@/hooks/use-i18n'
import type { MessageKey } from '@/i18n/messages'
import { cn } from '@/utils/cn'

type Props = {
  instructions: BankTransferInstructions
  compact?: boolean
  showCopyAll?: boolean
}

function CopyButton({
  value,
  label,
  dark,
}: {
  value: string
  label: string
  dark?: boolean
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={cn(
        'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition',
        copied
          ? 'bg-zinc-900 text-white'
          : dark
            ? 'border border-zinc-300 bg-idl-tech-panel text-zinc-900 hover:bg-zinc-50'
            : 'border border-zinc-200 bg-idl-tech-panel text-zinc-900 hover:bg-zinc-50',
      )}
    >
      {copied ? t('bankTransfer.copied') : label}
    </button>
  )
}

function Row({
  label,
  value,
  mono,
  copyValue,
  highlight,
}: {
  label: string
  value: string
  mono?: boolean
  copyValue?: string
  highlight?: boolean
}) {
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <dt className="text-[13px] font-medium text-zinc-500">{label}</dt>
        <dd
          className={cn(
            'mt-0.5 text-[15px] text-zinc-900',
            mono && 'font-mono text-[13px] break-all tracking-tight',
            highlight && 'text-lg font-semibold tracking-tight',
          )}
        >
          {value}
        </dd>
      </div>
      {copyValue ? <CopyButton value={copyValue} label={t('bankTransfer.copy')} /> : null}
    </div>
  )
}

type TableRow = {
  labelKey: MessageKey
  value: string
  mono?: boolean
  copyValue?: string
  highlight?: boolean
}

function BankTransferTable({ instructions, showCopyAll }: Props) {
  const { t } = useI18n()
  const amountLabel = formatMoney(instructions.amount, instructions.currencyCode)
  const rows: TableRow[] = [
    { labelKey: 'bankTransfer.holder', value: instructions.holder, copyValue: instructions.holder },
    { labelKey: 'bankTransfer.iban', value: instructions.iban, mono: true, copyValue: instructions.iban },
    ...(instructions.bankName
      ? [{ labelKey: 'bankTransfer.bank' as const, value: instructions.bankName }]
      : []),
    { labelKey: 'bankTransfer.amount', value: amountLabel, copyValue: amountLabel, highlight: true },
    {
      labelKey: 'bankTransfer.reference',
      value: instructions.reference,
      mono: true,
      copyValue: instructions.reference,
    },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-zinc-900">{t('bankTransfer.title')}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t('bankTransfer.description')}</p>
        </div>
        {showCopyAll ? (
          <CopyButton value={bankTransferCopyText(instructions)} label={t('bankTransfer.copyAll')} dark />
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
        <table className="w-full border-collapse text-left text-sm">
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.labelKey}
                className={cn(
                  index > 0 && 'border-t border-zinc-200',
                  row.highlight ? 'bg-idl-tech-panel' : 'bg-zinc-50',
                )}
              >
                <th
                  scope="row"
                  className="w-[34%] px-4 py-3.5 align-top text-[13px] font-medium text-zinc-500"
                >
                  {t(row.labelKey)}
                </th>
                <td
                  className={cn(
                    'px-4 py-3.5 align-top text-[15px] text-zinc-900',
                    row.mono && 'font-mono text-[13px] break-all tracking-tight',
                    row.highlight && 'text-lg font-semibold tracking-tight',
                  )}
                >
                  {row.value}
                </td>
                <td className="w-px whitespace-nowrap px-4 py-3.5 align-top">
                  {row.copyValue ? (
                    <CopyButton value={row.copyValue} label={t('bankTransfer.copy')} dark />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {instructions.note ? (
        <p className="mt-4 text-sm leading-relaxed text-zinc-500">{instructions.note}</p>
      ) : null}
    </div>
  )
}

export function BankTransferInstructionsCard({ instructions, compact, showCopyAll }: Props) {
  const { t } = useI18n()
  const amountLabel = formatMoney(instructions.amount, instructions.currencyCode)

  return (
    <div>
      {!compact ? (
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-zinc-900">{t('bankTransfer.title')}</h2>
            <p className="mt-1 text-sm text-zinc-500">{t('bankTransfer.description')}</p>
          </div>
          {showCopyAll ? (
            <CopyButton value={bankTransferCopyText(instructions)} label={t('bankTransfer.copyAll')} />
          ) : null}
        </div>
      ) : null}
      <StripeFieldGroup>
        <Row label={t('bankTransfer.holder')} value={instructions.holder} copyValue={instructions.holder} />
        <Row label={t('bankTransfer.iban')} value={instructions.iban} mono copyValue={instructions.iban} />
        {instructions.bankName ? <Row label={t('bankTransfer.bank')} value={instructions.bankName} /> : null}
        <Row label={t('bankTransfer.amount')} value={amountLabel} copyValue={amountLabel} highlight />
        <Row
          label={t('bankTransfer.reference')}
          value={instructions.reference}
          mono
          copyValue={instructions.reference}
        />
      </StripeFieldGroup>
      {instructions.note ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">{instructions.note}</p>
      ) : null}
    </div>
  )
}

export function BankTransferInstructionsTable({ instructions, showCopyAll }: Props) {
  return <BankTransferTable instructions={instructions} showCopyAll={showCopyAll} />
}

export function BankTransferAwaitingNote() {
  const { t } = useI18n()
  return <p className="text-sm text-zinc-500">{t('bankTransfer.awaitingNote')}</p>
}
