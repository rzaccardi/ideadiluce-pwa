export type PricelistSmokeKey = 'retail' | 'b2b' | 'professional'

export type PricelistSmokeRow = {
  key: PricelistSmokeKey
  label: string
  pricelistId: number | null
  cents: number | null
  error?: string
}

export type PricelistSmokeVerdict = {
  ok: boolean
  distinctCents: number
  warnings: string[]
  errors: string[]
}

/** Esito smoke: listini configurati devono restituire un prezzo; importi uguali = warning, non fail. */
export function evaluatePricelistSmoke(rows: PricelistSmokeRow[]): PricelistSmokeVerdict {
  const errors: string[] = []
  const warnings: string[] = []
  const configured = rows.filter((row) => row.pricelistId != null && row.pricelistId > 0)

  if (configured.length === 0) {
    errors.push('Nessun listino configurato (ODOO_PRICELIST_B2C_ID / B2B / PROFESSIONAL)')
  }

  for (const row of rows) {
    if (row.error) errors.push(row.error)
    if (row.pricelistId != null && row.pricelistId > 0 && row.cents == null) {
      errors.push(`Nessun prezzo per ${row.label} (listino ${row.pricelistId})`)
    }
  }

  const cents = [
    ...new Set(configured.map((row) => row.cents).filter((value): value is number => value != null && value > 0)),
  ]
  if (configured.length >= 2 && cents.length === 1) {
    warnings.push(
      'Stesso importo su tutti i listini: il SKU può non avere regole diverse, oppure i tre ID env puntano allo stesso listino. Riprova con TEMPLATE_ID di un prodotto scontato B2B.',
    )
  }

  return {
    ok: errors.length === 0,
    distinctCents: cents.length,
    warnings,
    errors,
  }
}
