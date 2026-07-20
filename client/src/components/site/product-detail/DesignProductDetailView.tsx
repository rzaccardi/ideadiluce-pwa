'use client'

import { useMemo } from 'react'
import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { formatMoney } from '@/lib/format'
import { formatPriceDisplayModeLabel } from '@/lib/price-display'
import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'
import { ProductDescriptionHtml } from '@/components/product/ProductDescriptionHtml'
import { ProductRestockNotify } from '@/components/product/ProductRestockNotify'
import { ProductDocuments } from '@/components/product/ProductDocuments'
import { CategoryCtaBanner } from '@/components/site/category/CategoryCtaBanner'
import { SectionContainer, Eyebrow } from '@/components/site/primitives'
import { SiteImage } from '@/components/site/SiteImage'
import { extractProductDisplayTitle } from '@/lib/product-display-title'
import {
  mergeDesignSpecRows,
  parseProductSpecRows,
  specsToRows,
} from '@/lib/product-specs-parse'
import {
  ProductDetailCard,
  ProductDetailSectionLabel,
  ProductSpecRowItem,
  buildProductSubtitle,
} from './shared'
import { ProductIdentifierMeta } from '@/components/product/ProductIdentifierMeta'
import {
  ProductDetailBreadcrumb,
  buildProductBreadcrumbItems,
  ProductDetailContactLink,
} from './ProductDetailBreadcrumb'
import { ProductDetailGallery } from './ProductDetailGallery'
import { DesignHeroVariantPicker } from './DesignHeroVariantPicker'
import { DesignRelatedProducts } from './DesignRelatedProducts'
import { ProductQuantityStepper } from './ProductQuantityStepper'
import { ProductDetailStickyBar,
  createAddToCartHandler,
} from './ProductDetailStickyBar'
import { ProductProfessionalBanner } from './ProductProfessionalBanner'
import { formatAvailabilityPrimaryLabel } from '@/lib/product-availability'
import type { useProductDetailState } from '@/hooks/use-product-detail-state'

type DetailState = ReturnType<typeof useProductDetailState>

type Props = {
  product: ProductDetailDTO
  relatedProducts: ProductCardDTO[]
  state: DetailState
}

const DESIGN_CTA = {
  title: 'Stai arredando con la luce?',
  description:
    "Raccontaci l'ambiente o inviaci una foto: il nostro showroom di Roma ti aiuta a scegliere brand, finitura e composizione luminosa per dare carattere agli spazi.",
  primaryCta: { label: 'Richiedi consulenza', href: '/contatti' },
  secondaryCta: { label: 'Prenota in showroom', href: '/contatti' },
}

function hasHtmlMarkup(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false
  return /<\/?[a-z][\s\S]*?>/i.test(raw)
}

export function DesignProductDetailView({ product, relatedProducts, state }: Props) {
  const lp = useLocalePath()
  const {
    galleryImages,
    displayPriceCents,
    availability,
    quantity,
    setQuantity,
    maxQuantity,
    selectedVariant,
    variantRef,
    setSelectedVariantRef,
    isAddingToCart,
    setIsAddingToCart,
    isStockEnriching,
    t,
  } = state

  const breadcrumbItems = buildProductBreadcrumbItems({
    productName: product.name,
    category: product.categories?.[0] ?? null,
    lp,
    catalogKind: 'design',
  })

  const activeSpecs =
    selectedVariant?.specs?.length
      ? selectedVariant.specs
      : product.specs?.length
        ? product.specs
        : null
  const specRows = mergeDesignSpecRows(
    activeSpecs ? specsToRows(activeSpecs) : parseProductSpecRows(product.specsTableHtml),
  )
  const { title: displayTitle, rest: titleRest } = extractProductDisplayTitle(product.name)
  const subtitle = buildProductSubtitle(product)
  const brandLabel = product.brand?.name?.toUpperCase() ?? 'BRAND'
  const lifestyleImages = galleryImages.slice(1, 4)
  const storyQuote = subtitle ?? product.shortDescription
  const priceModeLabel = formatPriceDisplayModeLabel(
    selectedVariant?.priceDisplayMode ?? product.priceDisplayMode,
  )

  const productDocuments = useMemo(() => {
    const byId = new Map<string, NonNullable<typeof product.documents>[number]>()
    for (const doc of product.documents ?? []) {
      if (doc.url) byId.set(doc.id, doc)
    }
    for (const doc of selectedVariant?.documents ?? []) {
      if (doc.url) byId.set(doc.id, doc)
    }
    return [...byId.values()]
  }, [product.documents, selectedVariant?.documents])

  const accessories = product.accessories ?? []
  const dimensionsValue = specRows.find((r) => r.label === 'Dimensioni')?.value
  const designerName = specRows.find((r) => r.label === 'Designer')?.value
  const storyBody =
    product.longDescription?.trim() && !hasHtmlMarkup(product.longDescription)
      ? product.longDescription.trim()
      : null
  const hasStorySection = Boolean(storyQuote || storyBody)
  const lifestyleGridImages = lifestyleImages.slice(1).filter(Boolean)
  const specRowsWithValues = specRows.filter((row) => row.value?.trim())

  const handleAddToCart = createAddToCartHandler({
    product,
    quantity,
    variantRef,
    galleryImages,
    setIsAddingToCart,
  })

  return (
    <div className="min-w-0 w-full overflow-x-clip bg-idl-design pb-20 text-idl-design-fg sm:pb-0">
      {/* HERO */}
      <section className="relative overflow-hidden bg-idl-design">
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 right-[8%] hidden h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(201, 162, 75,0.20)_0%,rgba(201, 162, 75,0)_68%)] animate-idl-glow-drift lg:block"
        />
        <ProductDetailBreadcrumb items={breadcrumbItems} lp={lp} variant="design" inHero />

        <SectionContainer className="relative z-[2] grid min-w-0 items-start gap-8 pb-10 pt-5 sm:gap-14 sm:pb-14 sm:pt-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-14">
          <ProductDetailGallery
            gallery={product.gallery}
            images={galleryImages}
            alt={product.name}
            activeUrl={selectedVariant?.imageUrl ?? product.imageUrl}
            variant="design"
          />

          <div className="min-w-0">
            <Eyebrow variant="design" className="mb-4 tracking-[0.18em] text-idl-glow sm:mb-[18px]">
              {brandLabel}
              {product.brand ? ' · ICONA DEL DESIGN' : ''}
            </Eyebrow>
            <h1 className="font-serif text-[clamp(2rem,8vw,3.375rem)] leading-none font-medium tracking-[-0.01em]">
              {displayTitle}
            </h1>
            {(titleRest || subtitle) ? (
              <div className="mt-3 text-base text-idl-design-muted">
                {titleRest ? <span>{titleRest}</span> : subtitle ? <span>{subtitle}</span> : null}
              </div>
            ) : null}
            <div className="mb-7">
              <ProductIdentifierMeta
                product={product}
                variant={selectedVariant}
                includeBrand={false}
                className="mt-2 text-xs text-idl-design-dim"
              />
            </div>

            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3.5">
              <span className="font-serif text-[26px] font-medium sm:text-[34px]">
                {formatMoney(displayPriceCents, product.currency)}
              </span>
              {priceModeLabel ? (
                <span className="text-[13.5px] text-idl-design-dim">{priceModeLabel}</span>
              ) : null}
            </div>
            {isStockEnriching ? (
              <div className="mt-2 mb-[30px] flex flex-col gap-1 text-[13.5px]">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-idl-design-dim/40" aria-hidden />
                  <span className="text-idl-design-muted not-italic">
                    {t('product.availability.checking')}
                  </span>
                </div>
              </div>
            ) : availability ? (
              <div className="mt-2 mb-[30px] flex flex-col gap-1 text-[13.5px]">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#5fb98a]" aria-hidden />
                  <span className="text-idl-design-muted not-italic">
                    {formatAvailabilityPrimaryLabel(availability)}
                  </span>
                </div>
                {availability.detail ? (
                  <p className="pl-4 text-idl-design-dim">{availability.detail}</p>
                ) : null}
              </div>
            ) : (
              <div className="mb-[30px]" />
            )}

            <DesignHeroVariantPicker
              variants={product.variants}
              selectedRef={variantRef ?? product.variants[0]?.ref ?? ''}
              onChange={setSelectedVariantRef}
            />

            <div className="mb-3.5 flex min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:items-stretch">
              {!isStockEnriching && availability?.canAddToCart ? (
                <ProductQuantityStepper
                  value={quantity}
                  min={1}
                  max={maxQuantity}
                  onChange={setQuantity}
                  variant="design"
                />
              ) : null}
              <button
                type="button"
                disabled={isStockEnriching || !availability?.canAddToCart || isAddingToCart}
                onClick={handleAddToCart}
                className="flex-1 rounded-lg bg-idl-glow px-4 py-[15px] text-center text-[15.5px] font-bold text-idl-design transition hover:bg-[#f7bd6f] disabled:opacity-60"
              >
                {isAddingToCart ? t('product.addingToCart') : t('product.addToCart')}
              </button>
            </div>

            {!isStockEnriching &&
            !availability?.canAddToCart &&
            (availability?.showRestockNotify || availability?.showProductRequest) ? (
              <div className="mt-4">
                <ProductRestockNotify
                  productSlug={product.slug}
                  productName={product.name}
                  variantRef={variantRef}
                  requestType={
                    availability.showProductRequest ? 'PRODUCT_REQUEST' : 'RESTOCK_NOTIFY'
                  }
                  ctaLabel={
                    availability.showProductRequest ? t('product.requestProduct') : undefined
                  }
                />
              </div>
            ) : null}

            <ProductDetailContactLink
              href={lp('/contatti')}
              className="mb-[22px] block rounded-lg border border-white/20 px-4 py-[13px] text-center text-[14.5px] font-semibold text-idl-design-fg transition hover:border-idl-glow hover:text-idl-glow"
            >
              Richiedi una consulenza sul progetto luce
            </ProductDetailContactLink>

            <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4 text-[12px] text-idl-design-dim sm:gap-5 sm:pt-[18px] sm:text-[12.5px]">
              <span>✓ {t('product.trust.returnBadge')}</span>
              <span>✓ Garanzia ufficiale</span>
              {product.brand?.name ? <span>✓ Prodotto originale {product.brand.name}</span> : null}
            </div>
          </div>
        </SectionContainer>
      </section>

      {hasStorySection ? (
      <section className="border-t border-white/6 bg-[#0c0c0d]">
        <SectionContainer narrow className="py-12 text-center sm:py-16">
          <ProductDetailSectionLabel variant="design" className="mb-6 tracking-[0.22em]">
            LA STORIA
          </ProductDetailSectionLabel>
          {storyQuote ? (
            <blockquote className="font-serif text-[clamp(1.375rem,5vw,2rem)] leading-[1.32] font-normal italic text-idl-design-fg">
              &ldquo;{storyQuote}&rdquo;
            </blockquote>
          ) : null}
          {storyBody ? (
            <div className="mx-auto mt-7 max-w-3xl text-base leading-[1.7] text-idl-design-muted">
              <p>{storyBody}</p>
            </div>
          ) : null}
        </SectionContainer>
      </section>
      ) : null}

      {lifestyleImages[0] ? (
      <section className="bg-idl-design">
          <div className="relative h-[420px] sm:h-[560px] lg:h-[680px]">
            <SiteImage src={lifestyleImages[0]} alt="" fill className="object-cover" sizes="100vw" />
          </div>
      </section>
      ) : null}

      {product.longDescription?.trim() ? (
      <section className="border-t border-idl-border bg-idl-path-design">
        <SectionContainer narrow className="py-12 sm:py-16">
          <ProductDetailSectionLabel variant="design" className="mb-[18px] text-idl-brass tracking-[0.18em]">
            DESCRIZIONE
          </ProductDetailSectionLabel>
          {hasHtmlMarkup(product.longDescription) ? (
            <ProductDescriptionHtml
              html={product.longDescription}
              className="product-description max-w-none text-base leading-[1.85] text-idl-ink-soft [&_p:first-child]:font-serif [&_p:first-child]:text-[23px] [&_p:first-child]:leading-[1.5] [&_p:first-child]:text-idl-ink [&_p]:mb-[18px] [&_ul]:my-[18px] [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:my-[18px] [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_li]:text-idl-ink-soft [&_strong]:text-idl-ink"
            />
          ) : (
            <p className="mb-[26px] font-serif text-[23px] leading-[1.5] text-idl-ink">{product.longDescription}</p>
          )}
          <div className="mt-7 flex flex-col gap-3 border-t border-idl-border pt-[22px] sm:flex-row sm:flex-wrap sm:items-center">
            <span className="font-mono text-[11px] tracking-wide text-idl-placeholder uppercase">
              SCHEDA A CURA DI IDEADILUCE
            </span>
            <span className="hidden flex-1 sm:block" />
            <ProductDetailContactLink
              href={lp('/contatti')}
              className="text-sm font-bold text-idl-brass hover:text-idl-brass-light"
            >
              Richiedi maggiori informazioni →
            </ProductDetailContactLink>
          </div>
        </SectionContainer>
      </section>
      ) : null}

      {(specRowsWithValues.length > 0 || dimensionsValue || productDocuments.length > 0) ? (
      <section className="bg-idl-paper">
        <SectionContainer className="grid min-w-0 items-start gap-8 py-10 sm:gap-14 sm:py-14 lg:grid-cols-2 lg:py-14">
          {specRowsWithValues.length > 0 ? (
          <div>
            <ProductDetailSectionLabel variant="design" className="mb-4 text-idl-brass tracking-[0.18em]">
              CARATTERISTICHE TECNICHE
            </ProductDetailSectionLabel>
            <h2 className="mb-5 font-serif text-[28px] font-medium text-idl-ink">
              {displayTitle}
              {product.brand ? ` · ${product.brand.name}` : ''}
            </h2>
            <div>
              {specRowsWithValues.map((row) => (
                <ProductSpecRowItem
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  href={row.href}
                  variant="design"
                  monoValue={/portalampade|tensione|dimensioni|protezione|manuale/i.test(row.label)}
                />
              ))}
            </div>
          </div>
          ) : <div />}

          {(dimensionsValue || productDocuments.length > 0) ? (
          <div className="flex flex-col gap-[22px]">
            {dimensionsValue ? (
            <ProductDetailCard variant="design">
              <h3 className="mb-[18px] font-serif text-xl font-medium text-idl-ink">Dimensioni</h3>
              <p className="text-sm text-idl-ink-muted">{dimensionsValue}</p>
            </ProductDetailCard>
            ) : null}

            {productDocuments.length > 0 ? (
            <ProductDetailCard variant="design">
              <h3 className="mb-4 font-serif text-xl font-medium text-idl-ink">Download</h3>
              <ProductDocuments
                slug={product.slug}
                documents={productDocuments}
                variantRef={variantRef}
                ced={selectedVariant?.ced ?? product.ced}
                variant="design"
                showTitle={false}
                className="space-y-0"
              />
            </ProductDetailCard>
            ) : null}
          </div>
          ) : null}
        </SectionContainer>
      </section>
      ) : null}

      {lifestyleGridImages.length > 0 ? (
      <section className="bg-idl-design">
        <div className="grid sm:grid-cols-2">
          {lifestyleGridImages.map((src) => (
            <div key={src} className="relative h-[360px] sm:h-[480px] lg:h-[600px]">
              <SiteImage src={src} alt="" fill className="object-cover" sizes="50vw" />
            </div>
          ))}
        </div>
      </section>
      ) : null}

      {relatedProducts.length > 0 ? (
      <section className="border-t border-white/6 bg-idl-design">
        <SectionContainer className="py-12 sm:py-16">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <ProductDetailSectionLabel variant="design" className="mb-3">
                {product.brand ? `FIRMA ${product.brand.name.toUpperCase()}` : 'COLLEZIONE'}
              </ProductDetailSectionLabel>
              <h2 className="font-serif text-2xl font-medium sm:text-[30px]">Altre icone da scoprire</h2>
            </div>
            {product.brand ? (
              <Link
                to={lp(`/brand/${product.brand.slug}`)}
                className="text-sm font-semibold text-idl-glow hover:underline"
              >
                Tutto {product.brand.name} →
              </Link>
            ) : null}
          </div>
          <DesignRelatedProducts
            products={relatedProducts.slice(0, 4)}
            lp={lp}
            brandName={product.brand?.name}
          />
        </SectionContainer>
      </section>
      ) : null}

      {accessories.length > 0 ? (
        <section className="border-t border-white/6 bg-idl-design">
          <SectionContainer className="py-12 sm:py-16">
            <div className="mb-7">
              <ProductDetailSectionLabel variant="design" className="mb-3">
                ACCESSORI
              </ProductDetailSectionLabel>
              <h2 className="font-serif text-2xl font-medium sm:text-[30px]">Completa il progetto</h2>
            </div>
            <DesignRelatedProducts products={accessories.slice(0, 4)} lp={lp} brandName={product.brand?.name} />
          </SectionContainer>
        </section>
      ) : null}

      <CategoryCtaBanner banner={DESIGN_CTA} lp={lp} variant="design" />

      {designerName ? (
      <section className="border-t border-white/6 bg-idl-design">
        <SectionContainer className="grid items-center gap-10 py-14 sm:gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:py-16">
          <div>
            <ProductDetailSectionLabel variant="design" className="mb-4">
              IL DESIGNER
            </ProductDetailSectionLabel>
            <h2 className="mb-4 font-serif text-3xl font-medium sm:text-[38px]">{designerName}</h2>
            <Link
              to={lp('/negozio')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold transition hover:border-idl-glow hover:text-idl-glow"
            >
              Tutti i progetti del designer →
            </Link>
          </div>
        </SectionContainer>
      </section>
      ) : null}

      <ProductProfessionalBanner variant="design" />

      <ProductDetailStickyBar
        product={product}
        displayPriceCents={displayPriceCents}
        imageUrl={galleryImages[0] ?? product.imageUrl}
        variantRef={variantRef}
        quantity={quantity}
        availabilityLabel={
          isStockEnriching
            ? t('product.availability.checking')
            : availability
              ? formatAvailabilityPrimaryLabel(availability)
              : t('product.availability.orderable')
        }
        availabilityDetail={isStockEnriching ? undefined : availability?.detail}
        availabilityStatus={isStockEnriching ? undefined : availability?.status}
        canAddToCart={!isStockEnriching && (availability?.canAddToCart ?? false)}
        isAddingToCart={isAddingToCart}
        onAdd={handleAddToCart}
        addLabel={t('product.addToCart')}
        addLabelShort={t('product.addToCartShort')}
        addingLabel={t('product.addingToCart')}
        variant="design"
      />
    </div>
  )
}
