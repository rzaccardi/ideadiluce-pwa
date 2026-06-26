const inflight = new Map<string, Promise<unknown>>()

/** Esegue `fn` una sola volta per chiave finché la promise è in corso. */
export function dedupeAsync<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  const promise = fn().finally(() => {
    inflight.delete(key)
  })
  inflight.set(key, promise)
  return promise
}
