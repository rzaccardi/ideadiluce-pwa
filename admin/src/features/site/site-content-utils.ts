export function cloneContent<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
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
