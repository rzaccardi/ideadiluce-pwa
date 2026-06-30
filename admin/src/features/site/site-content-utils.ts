export function cloneContent<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** Aggiornamento immutabile lungo un path senza clonare l'intero albero. */
export function immutableSetAtPath<T>(root: T, path: string[], value: unknown): T {
  if (path.length === 0) return root
  const [head, ...rest] = path
  if (head == null) return root

  if (rest.length === 0) {
    if (Array.isArray(root)) {
      const index = Number(head)
      const next = [...root]
      next[index] = value
      return next as T
    }
    return { ...(root as Record<string, unknown>), [head]: value } as T
  }

  const current = getAtPath(root, [head])
  const nextChild = immutableSetAtPath(current ?? (Number.isInteger(Number(rest[0])) ? [] : {}), rest, value)

  if (Array.isArray(root)) {
    const index = Number(head)
    const next = [...root]
    next[index] = nextChild
    return next as T
  }

  return { ...(root as Record<string, unknown>), [head]: nextChild } as T
}

export function getAtPath(root: unknown, path: string[]): unknown {
  let cursor = root
  for (const segment of path) {
    if (cursor == null || typeof cursor !== 'object') return undefined
    if (Array.isArray(cursor)) {
      cursor = cursor[Number(segment)]
    } else {
      cursor = (cursor as Record<string, unknown>)[segment]
    }
  }
  return cursor
}

export function setAtPath(root: Record<string, unknown>, path: string[], value: unknown) {
  if (path.length === 0) return
  let cursor: unknown = root
  for (let i = 0; i < path.length - 1; i += 1) {
    const segment = path[i]!
    if (Array.isArray(cursor)) {
      cursor = cursor[Number(segment)]
    } else if (cursor && typeof cursor === 'object') {
      cursor = (cursor as Record<string, unknown>)[segment]
    }
  }
  const last = path[path.length - 1]!
  if (Array.isArray(cursor)) {
    cursor[Number(last)] = value
    return
  }
  if (cursor && typeof cursor === 'object') {
    ;(cursor as Record<string, unknown>)[last] = value
  }
}
