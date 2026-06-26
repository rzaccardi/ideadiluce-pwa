import { formatMoney } from '@/lib/format'
import type { BankTransferInstructions } from '@/lib/bankTransfer'

export function bankTransferCopyText(instructions: BankTransferInstructions): string {
  const amountLabel = formatMoney(instructions.amount, instructions.currencyCode)
  const lines = [
    `Intestatario: ${instructions.holder}`,
    `IBAN: ${instructions.iban}`,
    ...(instructions.bankName ? [`Banca: ${instructions.bankName}`] : []),
    `Importo: ${amountLabel}`,
    `Causale: ${instructions.reference}`,
  ]
  return lines.join('\n')
}
