'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParam } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import { useI18n } from '@/hooks/use-i18n'
import { useSnapshot } from 'valtio/react'
import { productStore, fetchProduct } from '@/features/product'
import {
  getProductAvailabilityStatus,
  resolveAvailabilityData,
} from '@/lib/product-availability'
import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'

export type UseProductDetailStateOptions = {
  slug?: string
  initialProduct?: ProductDetailDTO | null
  initialRelatedProducts?: ProductCardDTO[]
}

export function useProductDetailState({
  slug: slugProp,
  initialProduct,
  initialRelatedProducts,
}: UseProductDetailStateOptions = {}) {
  const paramsSlug = useParam('slug')
  const slug = slugProp ?? paramsSlug
  const { locale } = useLocale()
  const { locale: i18nLocale, t } = useI18n()
  const snap = useSnapshot(productStore)
  const product =
    snap.product?.slug === slug
      ? snap.product
      : initialProduct?.slug === slug
        ? initialProduct
        : null
  const relatedProducts =
    snap.product?.slug === slug ? snap.relatedProducts : (initialRelatedProducts ?? [])

  const [quantity, setQuantity] = useState(1)
  const [selectedVariantRef, setSelectedVariantRef] = useState('')
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    if (initialProduct && initialProduct.slug === slug) {
      productStore.product = initialProduct
      productStore.relatedProducts = initialRelatedProducts ?? []
      productStore.currentSlug = slug
      productStore.currentLocale = locale
      productStore.isLoading = false
      productStore.error = null
      return
    }
    if (slug) void fetchProduct(slug, locale)
  }, [slug, locale, initialProduct, initialRelatedProducts])

  const variantRefsKey = product?.variants.map((v) => v.ref).join('\n') ?? ''

  useEffect(() => {
    if (!product?.variants.length) {
      setSelectedVariantRef('')
      return
    }
    setSelectedVariantRef((prev) => {
      if (prev && product.variants.some((v) => v.ref === prev)) return prev
      const preferred =
        product.variants.find((v) => {
          const av = v.availability ?? product.availability
          return getProductAvailabilityStatus({ availability: av, locale: i18nLocale }).status !==
            'out_of_stock'
        }) ?? product.variants[0]
      return preferred.ref
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- variantRefsKey
  }, [product?.slug, variantRefsKey])

  const selectedVariant = useMemo(() => {
    if (!product?.variants.length) return undefined
    if (selectedVariantRef) {
      return product.variants.find((v) => v.ref === selectedVariantRef) ?? product.variants[0]
    }
    return product.variants[0]
  }, [product, selectedVariantRef])

  useEffect(() => {
    setQuantity(1)
  }, [selectedVariantRef, slug])

  const variantRef = selectedVariant?.ref ?? null
  const galleryImages = product?.images?.length
    ? product.images
    : product?.imageUrl
      ? [product.imageUrl]
      : []

  const displayPriceCents = selectedVariant?.priceCents ?? product?.priceCents ?? 0
  const availabilityData = product
    ? resolveAvailabilityData(product, selectedVariant)
    : null
  const availability = product
    ? getProductAvailabilityStatus({
        availability: availabilityData,
        requestedQty: quantity,
        locale: i18nLocale,
      })
    : null
  const maxQuantity =
    availability?.status === 'available' &&
    availabilityData != null &&
    availabilityData.qtyAvailable > 0
      ? availabilityData.qtyAvailable
      : undefined

  return {
    slug,
    product,
    relatedProducts,
    quantity,
    setQuantity,
    selectedVariantRef,
    setSelectedVariantRef,
    selectedVariant,
    variantRef,
    galleryImages,
    displayPriceCents,
    availability,
    maxQuantity,
    isAddingToCart,
    setIsAddingToCart,
    isLoading: snap.isLoading && !product,
    error: snap.error,
    t,
  }
}
