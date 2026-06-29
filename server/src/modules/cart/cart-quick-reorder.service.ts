import type { Request } from 'express'
import { AppError } from '../../types/errors.js'
import { parseQuickReorderText, type ParsedCodeLine } from '../catalog/catalog-code-parser.js'
import { resolveProductCodes } from '../catalog/catalog-code-resolver.service.js'
import { cartService } from './cart.service.js'
import type { QuickReorderResultDTO } from '../../types/dto.js'

function assertQuickReorderAccess(req: Request) {
  if (!req.sessionRecord?.user) {
    throw new AppError(
      'UNAUTHORIZED',
      'Authentication required',
      'Effettua il login per usare il riordino rapido.',
      401,
      false,
    )
  }
}

function linesFromInput(input: { text?: string; lines?: ParsedCodeLine[] }): ParsedCodeLine[] {
  if (input.lines?.length) return input.lines
  const text = input.text?.trim()
  if (!text) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Empty quick reorder input',
      'Inserisci almeno un codice prodotto.',
      400,
      false,
    )
  }
  const parsed = parseQuickReorderText(text)
  if (parsed.length === 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      'No codes parsed',
      'Nessun codice valido trovato nel testo incollato.',
      400,
      false,
    )
  }
  return parsed
}

export const cartQuickReorderService = {
  async resolveCodes(
    req: Request,
    input: { text?: string; lines?: ParsedCodeLine[]; locale?: string },
  ) {
    assertQuickReorderAccess(req)
    const lines = linesFromInput(input)
    return resolveProductCodes(req, lines, input.locale)
  },

  async quickReorder(
    req: Request,
    input: { text?: string; lines?: ParsedCodeLine[]; locale?: string },
  ): Promise<QuickReorderResultDTO> {
    assertQuickReorderAccess(req)
    const lines = linesFromInput(input)
    const { matched, unmatched } = await resolveProductCodes(req, lines, input.locale)

    if (matched.length === 0) {
      throw new AppError(
        'NO_MATCHES',
        'No product codes matched',
        'Nessun codice riconosciuto. Verifica EAN, SKU o MPN.',
        404,
        false,
        { unmatched },
      )
    }

    const reorder = await cartService.reorderLines(
      req,
      matched.map((line) => ({
        productRef: line.productRef,
        variantRef: line.variantRef,
        quantity: line.quantity,
      })),
    )

    return {
      ...reorder,
      matched,
      unmatched,
    }
  },
}
