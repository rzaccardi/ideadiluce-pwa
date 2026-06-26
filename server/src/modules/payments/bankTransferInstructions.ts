export type BankTransferInstructionsDTO = {
  holder: string
  iban: string
  bankName: string | null
  reference: string
  amount: number
  currencyCode: string
  note: string
}

export function parseBankTransferInstructionsJson(
  raw: unknown,
): BankTransferInstructionsDTO | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const holder = typeof o.holder === 'string' ? o.holder : null
  const iban = typeof o.iban === 'string' ? o.iban : null
  const reference = typeof o.reference === 'string' ? o.reference : null
  const amount = typeof o.amount === 'number' ? o.amount : null
  const currencyCode = typeof o.currencyCode === 'string' ? o.currencyCode : null
  if (!holder || !iban || !reference || amount == null || !currencyCode) return null
  return {
    holder,
    iban,
    bankName: typeof o.bankName === 'string' ? o.bankName : null,
    reference,
    amount,
    currencyCode,
    note: typeof o.note === 'string' ? o.note : '',
  }
}
