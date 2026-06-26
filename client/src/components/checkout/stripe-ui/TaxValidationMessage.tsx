type Props = {
  valid: boolean | null
  validLabel: string
  invalidLabel: string
  errorMessage?: string | null
}

/** Messaggio validazione inline sotto P.IVA / codice fiscale. */
export function TaxValidationMessage({
  valid,
  validLabel,
  invalidLabel,
  errorMessage,
}: Props) {
  if (valid === true) {
    return <p className="px-1 text-xs text-emerald-700">{validLabel}</p>
  }

  const invalidText = errorMessage ?? invalidLabel
  if (valid === false || errorMessage) {
    return <p className="px-1 text-xs text-red-700">{invalidText}</p>
  }

  return null
}
