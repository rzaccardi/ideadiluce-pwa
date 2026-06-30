import { describe, expect, it } from 'vitest'
import { decodeDeepLHtmlEntities, decodeDeepLHtmlEntitiesInTree } from './deepl-html.js'

describe('decodeDeepLHtmlEntities', () => {
  it('decodifica gli apostrofi restituiti da DeepL con tag_handling=html', () => {
    expect(decodeDeepLHtmlEntities("Demander de l&#x27;aide →")).toBe("Demander de l'aide →")
    expect(decodeDeepLHtmlEntities("on s&#x27;en occupe")).toBe("on s'en occupe")
    expect(decodeDeepLHtmlEntities("L&#x27;éclairage idéal")).toBe("L'éclairage idéal")
  })

  it('lascia invariato il testo senza entità', () => {
    expect(decodeDeepLHtmlEntities('Tu ne sais pas quoi chercher ?')).toBe(
      'Tu ne sais pas quoi chercher ?',
    )
  })
})

describe('decodeDeepLHtmlEntitiesInTree', () => {
  it('decodifica le stringhe annidate nel contenuto sito', () => {
    const decoded = decodeDeepLHtmlEntitiesInTree({
      rooms: {
        subtitle: "L&#x27;éclairage idéal pour chaque pièce, du salon à l&#x27;extérieur.",
      },
      paths: {
        cards: [
          {
            title: 'Tu ne sais pas quoi chercher ?',
            description: 'Envoie-nous une photo ou le code, on s&#x27;en occupe',
            ctaLabel: 'Demander de l&#x27;aide →',
          },
        ],
      },
    })

    expect(decoded.rooms.subtitle).toBe(
      "L'éclairage idéal pour chaque pièce, du salon à l'extérieur.",
    )
    expect(decoded.paths.cards[0]?.description).toBe(
      'Envoie-nous une photo ou le code, on s\'en occupe',
    )
    expect(decoded.paths.cards[0]?.ctaLabel).toBe("Demander de l'aide →")
  })
})
