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

/** Invalida richieste in-flight (es. dopo login/logout il carrello server-side cambia). */
export function invalidateDedupe(keys?: string[]) {
  if (!keys) {
    inflight.clear()
    return
  }
  for (const key of keys) {
    inflight.delete(key)
  }
}

export function invalidateDedupePrefix(prefix: string) {
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key)
  }
}
