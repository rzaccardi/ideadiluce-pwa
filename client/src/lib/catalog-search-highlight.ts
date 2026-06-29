export type HighlightSegment = {
  text: string
  highlight: boolean
}

/** Suddivide il testo in segmenti evidenziati in base alla query (match case-insensitive). */
export function splitHighlightSegments(text: string, query: string): HighlightSegment[] {
  const trimmed = query.trim()
  if (!trimmed || !text) return [{ text, highlight: false }]

  const lowerText = text.toLowerCase()
  const lowerQuery = trimmed.toLowerCase()
  const segments: HighlightSegment[] = []
  let cursor = 0

  while (cursor < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, cursor)
    if (matchIndex === -1) {
      segments.push({ text: text.slice(cursor), highlight: false })
      break
    }
    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex), highlight: false })
    }
    segments.push({
      text: text.slice(matchIndex, matchIndex + trimmed.length),
      highlight: true,
    })
    cursor = matchIndex + trimmed.length
  }

  return segments.length ? segments : [{ text, highlight: false }]
}
