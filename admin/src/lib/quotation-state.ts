export const QUOTATION_STATE_LABEL: Record<string, string> = {
  draft: 'Bozza',
  sent: 'Inviato',
}

export function quotationStateLabel(state: string): string {
  return QUOTATION_STATE_LABEL[state] ?? state
}
