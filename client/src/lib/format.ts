export function formatMoney(cents: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(cents / 100)
}
