export function readWithMigration(
  storage: Storage,
  canonicalKey: string,
  legacyKeys: readonly string[],
): string | null {
  const current = storage.getItem(canonicalKey)
  if (current != null) return current

  for (const legacyKey of legacyKeys) {
    const legacy = storage.getItem(legacyKey)
    if (legacy == null) continue
    storage.setItem(canonicalKey, legacy)
    storage.removeItem(legacyKey)
    return legacy
  }

  return null
}

export function removeLegacyKeys(storage: Storage, legacyKeys: readonly string[]): void {
  for (const legacyKey of legacyKeys) {
    storage.removeItem(legacyKey)
  }
}
