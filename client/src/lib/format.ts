export function formatMoney(cents: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(cents / 100)
}

export function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium' }).format(date)
}
