import { describe, expect, it } from 'vitest'
import { splitHighlightSegments } from './catalog-search-highlight'

describe('splitHighlightSegments', () => {
  it('restituisce il testo intero senza highlight se la query è vuota', () => {
    expect(splitHighlightSegments('GU10 faretto', '')).toEqual([
      { text: 'GU10 faretto', highlight: false },
    ])
  })

  it('evidenzia il match case-insensitive', () => {
    expect(splitHighlightSegments('Lampada OSRAM GU10', 'osram')).toEqual([
      { text: 'Lampada ', highlight: false },
      { text: 'OSRAM', highlight: true },
      { text: ' GU10', highlight: false },
    ])
  })

  it('evidenzia più occorrenze', () => {
    expect(splitHighlightSegments('led led strip', 'led')).toEqual([
      { text: 'led', highlight: true },
      { text: ' ', highlight: false },
      { text: 'led', highlight: true },
      { text: ' strip', highlight: false },
    ])
  })
})
