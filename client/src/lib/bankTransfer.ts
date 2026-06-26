export type BankTransferInstructions = {
  holder: string
  iban: string
  bankName: string | null
  reference: string
  amount: number
  currencyCode: string
  note: string
}

export function parseBankTransferInstructions(
  raw: Record<string, unknown> | null | undefined,
): BankTransferInstructions | null {
  if (!raw || typeof raw !== 'object') return null
  const holder = typeof raw.holder === 'string' ? raw.holder : null
  const iban = typeof raw.iban === 'string' ? raw.iban : null
  const reference = typeof raw.reference === 'string' ? raw.reference : null
  const amount = typeof raw.amount === 'number' ? raw.amount : null
  const currencyCode = typeof raw.currencyCode === 'string' ? raw.currencyCode : null
  if (!holder || !iban || !reference || amount == null || !currencyCode) return null
  return {
    holder,
    iban,
    bankName: typeof raw.bankName === 'string' ? raw.bankName : null,
    reference,
    amount,
    currencyCode,
    note: typeof raw.note === 'string' ? raw.note : '',
  }
}
