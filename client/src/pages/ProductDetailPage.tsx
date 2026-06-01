import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { productStore, fetchProduct } from '@/features/product'
import { addItem } from '@/features/cart'
import { addWishlistItem } from '@/features/wishlist'
import { formatMoney } from '@/lib/format'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/Button'
import { QuantityInput } from '@/components/QuantityInput'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductDetailSkeleton } from '@/components/Skeleton'

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const snap = useSnapshot(productStore)
  const product = snap.product?.slug === slug ? snap.product : null
  const [quantity, setQuantity] = useState(1)
  const [selectedVariantRef, setSelectedVariantRef] = useState('')

  useEffect(() => {
    if (slug) void fetchProduct(slug)
  }, [slug])

  const selectedVariant = useMemo(() => {
    if (!product) return undefined
    if (selectedVariantRef) {
      return product.variants.find((v) => v.ref === selectedVariantRef)
    }
    return product.variants[0]
  }, [product, selectedVariantRef])

  const variantRef = selectedVariant?.ref ?? null
  const galleryImages = product?.images?.length
    ? product.images
    : product?.imageUrl
      ? [product.imageUrl]
      : []

  if (snap.isLoading && !product) {
    return <ProductDetailSkeleton />
  }

  if (snap.error || !product) {
    return (
      <ErrorState
        message={snap.error ?? 'Prodotto non disponibile'}
        action={
          <Link to="/catalog">
            <Button variant="secondary">Torna al catalogo</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery
          images={galleryImages}
          alt={product.name}
          activeUrl={selectedVariant?.imageUrl ?? product.imageUrl}
        />
        <div className="text-left">
          <h1 className="text-2xl font-semibold text-zinc-900">{product.name}</h1>
          {product.shortDescription ? (
            <p className="mt-2 text-sm text-zinc-600">{product.shortDescription}</p>
          ) : null}
          <p className="mt-4 text-2xl font-semibold">{formatMoney(product.priceCents, product.currency)}</p>
          {product.sku ? <p className="mt-2 text-sm text-zinc-500">SKU {product.sku}</p> : null}
          <p className="mt-2 text-sm text-zinc-600">
            {product.inStock ? 'Disponibile' : 'Non disponibile'}
          </p>
          {product.longDescription ? (
            <p className="mt-6 text-sm leading-relaxed text-zinc-600">{product.longDescription}</p>
          ) : null}

          <div className="mt-6 max-w-md space-y-4">
            {product.variants.length > 0 ? (
              <label className="block text-left text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Variante</span>
                <select
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
                  value={variantRef ?? ''}
                  onChange={(e) => setSelectedVariantRef(e.target.value)}
                  disabled={!product.inStock}
                >
                  {product.variants.map((variant) => (
                    <option key={variant.ref} value={variant.ref}>
                      {variant.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {selectedVariant && selectedVariant.attributes.length > 0 ? (
              <ul className="text-sm text-zinc-600">
                {selectedVariant.attributes.map((a) => (
                  <li key={`${a.name}-${a.value}`}>
                    <span className="font-medium text-zinc-700">{a.name}:</span> {a.value}
                  </li>
                ))}
              </ul>
            ) : null}
            <QuantityInput
              label="Quantità"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              disabled={!product.inStock}
              onClick={() => void addItem(product.slug, quantity, variantRef)}
            >
              Aggiungi al carrello
            </Button>
            <Button
              variant="secondary"
              onClick={() => void addWishlistItem(product.slug, variantRef)}
            >
              Preferiti
            </Button>
          </div>
        </div>
      </div>

      {snap.relatedProducts.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">Altri nella stessa categoria</h2>
          <ProductGrid products={snap.relatedProducts} />
        </section>
      ) : null}
    </div>
  )
}
