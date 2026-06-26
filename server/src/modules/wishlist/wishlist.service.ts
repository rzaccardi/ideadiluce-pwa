import { AppError } from '../../types/errors.js'
import type { ProductDetailDTO, WishlistItemDTO } from '../../types/dto.js'
import type { Request } from 'express'
import { resolveCatalogProduct } from '../catalog/catalogResolver.service.js'
import { formatOdooTemplateRef } from '../catalog/odooRef.js'
import { wishlistRepository } from './wishlist.repository.js'

function storedProductRef(product: ProductDetailDTO): string {
  if (product.odooTemplateId != null) {
    return formatOdooTemplateRef(product.odooTemplateId)
  }
  return product.slug
}

function assertSession(req: Request) {
  const s = req.sessionRecord
  if (!s) {
    throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)
  }
  return s
}

function resolveVariantRef(product: ProductDetailDTO, variantRef: string | null | undefined) {
  if (product.variants.length === 0) return variantRef ?? null
  const selectedRef = variantRef ?? product.variants[0]?.ref ?? null
  if (selectedRef && !product.variants.some((variant) => variant.ref === selectedRef)) {
    throw new AppError(
      'VARIANT_NOT_FOUND',
      'Unknown product variant',
      'Variante prodotto non disponibile.',
      400,
      false,
    )
  }
  return selectedRef
}

export const wishlistService = {
  async list(req: Request): Promise<WishlistItemDTO[]> {
    const s = assertSession(req)
    const rows = s.userId
      ? await wishlistRepository.listForUser(s.userId)
      : await wishlistRepository.listForSession(s.id)
    return rows.map((r) => ({
      id: r.id,
      productRef: r.productRef,
      variantRef: r.variantRef,
    }))
  },

  async add(
    req: Request,
    input: { productRef: string; variantRef?: string | null },
  ): Promise<WishlistItemDTO> {
    const s = assertSession(req)
    const product = await resolveCatalogProduct(req, input.productRef)
    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Unknown product', 'Prodotto non disponibile.', 404, false)
    }
    const variantRef = resolveVariantRef(product, input.variantRef)
    const productRef = storedProductRef(product)
    const row = s.userId
      ? await wishlistRepository.addForUser(s.userId, productRef, variantRef)
      : await wishlistRepository.addForSession(s.id, productRef, variantRef)
    return { id: row.id, productRef: row.productRef, variantRef: row.variantRef }
  },

  async remove(req: Request, id: string) {
    const s = assertSession(req)
    const result = s.userId
      ? await wishlistRepository.deleteForUser(s.userId, id)
      : await wishlistRepository.deleteForSession(s.id, id)
    if (result.count === 0) {
      throw new AppError('WISHLIST_ITEM_NOT_FOUND', 'Not found', 'Elemento non trovato.', 404, false)
    }
  },
}
