'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'
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
import { buildDesignerProjectsHref } from '@/lib/catalog-filters'
import {
  findSpecValue,
  isDimensionSpecLabel,
  mergeDesignSpecRows,
  mergeProductAndVariantSpecs,
  pickDesignHeroMeta,
} from '@/lib/product-specs-parse'
import {
  ProductDetailCard,
  ProductDetailSectionLabel,
  ProductSpecRowItem,
  buildProductSubtitle,
} from './shared'
import { ProductIdentifierMeta } from '@/components/product/ProductIdentifierMeta'
import { ProductBrandMark } from '@/components/product/ProductBrandMark'
import {
  ProductDetailBreadcrumb,
  buildProductBreadcrumbItems,
  ProductDetailContactLink,
} from './ProductDetailBreadcrumb'
import { ProductDetailGallery } from './ProductDetailGallery'
import { DesignHeroVariantPicker } from './DesignHeroVariantPicker'
import { DesignRelatedProducts } from './DesignRelatedProducts'
import { DesignAccessoryPicker } from './DesignAccessoryPicker'
import {
  ProductDimensionsPanel,
  hasProductDimensionsContent,
} from './ProductDimensionsPanel'
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
  primaryCta: { label: 'Richiedi consulenza', href: '/contatti' },
}

function hasHtmlMarkup(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false
  return /<\/?[a-z][\s\S]*?>/i.test(raw)
}

export function DesignProductDetailView({ product, relatedProducts, state }: Props) {
  const lp = useLocalePath()
  const { tParams } = useI18n()
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

  const parsedSpecRows = mergeProductAndVariantSpecs({
    productSpecs: product.specs,
    variantSpecs: selectedVariant?.specs,
    specsTableHtml: product.specsTableHtml,
  })
  const specRows = mergeDesignSpecRows(parsedSpecRows)
  const { title: displayTitle, rest: titleRest } = extractProductDisplayTitle(product.name)
  const subtitle = buildProductSubtitle(product)
  const brandLabel = product.brand?.name?.toUpperCase() ?? 'BRAND'
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

  const galleryByTag = useMemo(() => {
    const urlsFor = (tag: string) =>
      (product.gallery ?? [])
        .filter((item) => item.type === 'image' && (item.tag || 'foto') === tag && item.url)
        .map((item) => item.url)
    return {
      ambiente: urlsFor('ambiente'),
      dettaglio: urlsFor('dettaglio'),
    }
  }, [product.gallery])

  /** Solo media taggati ambiente (niente riuso packshot). */
  const lifestyleHeroImage = galleryByTag.ambiente[0] ?? null
  const lifestyleGridImages = [
    ...galleryByTag.ambiente.slice(1),
    ...galleryByTag.dettaglio,
  ].slice(0, 2)

  const accessories = useMemo(
    () => (product.accessories ?? []).filter((item) => item.slug?.trim()).slice(0, 8),
    [product.accessories],
  )
  const alternatives = product.alternatives ?? []
  const [selectedAccessorySlugs, setSelectedAccessorySlugs] = useState<string[]>([])

  useEffect(() => {
    setSelectedAccessorySlugs((prev) => prev.filter((slug) => accessories.some((item) => item.slug === slug)))
  }, [accessories])

  const selectedAccessories = accessories.filter((item) => selectedAccessorySlugs.includes(item.slug))
  const accessoriesTotalCents = selectedAccessories.reduce((sum, item) => sum + (item.priceCents ?? 0), 0)
  const combinedPriceCents = displayPriceCents + accessoriesTotalCents

  function toggleAccessory(slug: string) {
    setSelectedAccessorySlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  }
  const hasDimensionsPanel = hasProductDimensionsContent(
    product,
    parsedSpecRows,
    selectedVariant?.attributes,
  )
  const designerName =
    findSpecValue(parsedSpecRows, /designer/i) ??
    specRows.find((r) => /designer/i.test(r.label))?.value ??
    null
  const designerProjectsHref = buildDesignerProjectsHref(designerName)
  const heroMeta = pickDesignHeroMeta(specRows)
  const categoryChips = (product.categories ?? []).filter((c) => c.slug && c.name)
  const specTags = (product.specTags ?? []).filter((t) => t.trim())
  /** Storia solo con testo narrativo dedicato (plain longDescription), non shortDescription. */
  const storyBody =
    product.longDescription?.trim() && !hasHtmlMarkup(product.longDescription)
      ? product.longDescription.trim()
      : null
  const hasStorySection = Boolean(storyBody)
  const hasHtmlDescription =
    Boolean(product.longDescription?.trim()) && hasHtmlMarkup(product.longDescription)
  const shortDescription = product.shortDescription?.trim() || ''
  const showShortDescription =
    Boolean(shortDescription) &&
    shortDescription !== (subtitle?.trim() || '') &&
    shortDescription !== (product.name?.trim() || '') &&
    shortDescription !== (storyBody || '')
  const specRowsWithValues = specRows.filter(
    (row) => row.value?.trim() && !isDimensionSpecLabel(row.label, row.key),
  )

  const handleAddToCart = createAddToCartHandler({
    product,
    quantity,
    variantRef,
    galleryImages,
    setIsAddingToCart,
    extraItems: selectedAccessories.map((item) => ({ product: item, quantity: 1 })),
  })

  return (
    <div className="min-w-0 w-full overflow-x-clip bg-idl-path-design pb-20 text-idl-ink sm:pb-0">
      {/* HERO */}
      <section>
        <ProductDetailBreadcrumb items={breadcrumbItems} lp={lp} variant="design" />

        <SectionContainer className="grid min-w-0 items-start gap-8 pb-12 pt-1 sm:gap-14 sm:pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-16">
          <ProductDetailGallery
            gallery={product.gallery}
            images={galleryImages}
            alt={product.name}
            activeUrl={selectedVariant?.imageUrl ?? product.imageUrl}
            variant="design"
          />

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 sm:mb-[18px]">
              <ProductBrandMark
                brand={product.brand}
                fallbackLabel={brandLabel}
                size="md"
                className="text-idl-brass"
              />
              {product.brand ? (
                <Eyebrow variant="neutral" className="tracking-[0.18em]">
                  · ICONA DEL DESIGN
                </Eyebrow>
              ) : null}
            </div>
            <h1 className="font-serif text-[clamp(2rem,8vw,3.375rem)] leading-none font-medium tracking-[-0.01em] text-idl-ink">
              {displayTitle}
            </h1>
            {(titleRest || subtitle) ? (
              <div className="mt-3 text-base text-idl-ink-muted">
                {titleRest ? <span>{titleRest}</span> : subtitle ? <span>{subtitle}</span> : null}
              </div>
            ) : null}
            {showShortDescription ? (
              <p className="mt-3 text-sm leading-relaxed text-idl-ink-muted">{shortDescription}</p>
            ) : null}
            {heroMeta.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {heroMeta.map(({ label, value }) => (
                  <span
                    key={`${label}:${value}`}
                    className="rounded border border-idl-path-design-border bg-idl-tech-chip px-2.5 py-1 text-[11.5px] tracking-wide"
                  >
                    <span className="text-idl-ink-muted">{label}</span>
                    <span className="mx-1.5 text-idl-ink-muted/50">·</span>
                    <span className="text-idl-ink">{value}</span>
                  </span>
                ))}
              </div>
            ) : null}
            {specTags.length > 0 || categoryChips.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {specTags.map((tag) => (
                  <span
                    key={`tag:${tag}`}
                    className="rounded-sm bg-idl-tech-chip px-2 py-0.5 text-[11px] tracking-wide text-idl-ink-muted"
                  >
                    {tag}
                  </span>
                ))}
                {categoryChips.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={lp(`/categoria/${cat.slug}`)}
                    className="rounded-sm border border-idl-path-design-border px-2 py-0.5 text-[11px] tracking-wide text-idl-ink-muted transition hover:border-idl-brass hover:text-idl-brass"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="mb-7">
              <ProductIdentifierMeta
                product={product}
                variant={selectedVariant}
                includeBrand={false}
                className="mt-2 text-xs text-idl-ink-muted"
              />
            </div>

            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3.5">
              <span className="font-serif text-[26px] font-medium text-idl-ink sm:text-[34px]">
                {formatMoney(displayPriceCents, product.currency)}
              </span>
              {priceModeLabel ? (
                <span className="text-[13.5px] text-idl-ink-muted">{priceModeLabel}</span>
              ) : null}
            </div>
            {isStockEnriching ? (
              <div className="mt-2 mb-[30px] flex flex-col gap-1 text-[13.5px]">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-idl-ink-muted/40" aria-hidden />
                  <span className="text-idl-ink-muted not-italic">
                    {t('product.availability.checking')}
                  </span>
                </div>
              </div>
            ) : availability ? (
              <div className="mt-2 mb-[30px] flex flex-col gap-1 text-[13.5px]">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#5fb98a]" aria-hidden />
                  <span className="text-idl-ink-muted not-italic">
                    {formatAvailabilityPrimaryLabel(availability)}
                  </span>
                </div>
                {availability.detail ? (
                  <p className="pl-4 text-idl-ink-muted">{availability.detail}</p>
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

            {accessories.length > 0 ? (
              <DesignAccessoryPicker
                accessories={accessories}
                selectedSlugs={selectedAccessorySlugs}
                onToggle={toggleAccessory}
                lp={lp}
                layout="compact"
              />
            ) : null}

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
                className="flex-1 rounded-lg bg-idl-glow px-4 py-[15px] text-center text-[15.5px] font-bold text-idl-design transition hover:bg-idl-cta-glow-hover disabled:opacity-60"
              >
                {isAddingToCart
                  ? t('product.addingToCart')
                  : selectedAccessories.length > 0
                    ? t('product.accessories.addWithProduct')
                    : t('product.addToCart')}
              </button>
            </div>
            {selectedAccessories.length > 0 ? (
              <p className="mb-3.5 text-[12.5px] text-idl-ink-muted">
                {tParams('product.accessories.includedTotal', {
                  count: selectedAccessories.length,
                  total: formatMoney(combinedPriceCents, product.currency),
                })}
              </p>
            ) : null}

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
              className="mb-[22px] block rounded-lg border border-idl-path-design-border px-4 py-[13px] text-center text-[14.5px] font-semibold text-idl-ink transition hover:border-idl-brass hover:text-idl-brass"
            >
              Richiedi una consulenza sul progetto luce
            </ProductDetailContactLink>

            <div className="flex flex-wrap gap-3 border-t border-idl-border pt-4 text-[12px] text-idl-ink-muted sm:gap-5 sm:pt-[18px] sm:text-[12.5px]">
              <span>✓ Spedizioni tracciate in tutto il mondo</span>
              <span>✓ {t('product.trust.returnBadge')}</span>
              <span>✓ Garanzia ufficiale</span>
              {product.brand?.name ? <span>✓ Prodotto originale {product.brand.name}</span> : null}
            </div>
          </div>
        </SectionContainer>
      </section>

      {hasStorySection && storyBody ? (
      <section className="border-t border-idl-border bg-idl-paper">
        <SectionContainer narrow className="py-16 text-center sm:py-24">
          <ProductDetailSectionLabel variant="design" className="mb-6 tracking-[0.22em]">
            LA STORIA
          </ProductDetailSectionLabel>
          <div className="mx-auto max-w-3xl font-serif text-[clamp(1.25rem,4vw,1.625rem)] leading-[1.55] text-idl-ink">
            <p>{storyBody}</p>
          </div>
        </SectionContainer>
      </section>
      ) : null}

      {lifestyleHeroImage ? (
      <section>
          <div className="relative h-[420px] sm:h-[560px] lg:h-[680px]">
            <SiteImage src={lifestyleHeroImage} alt="" fill className="object-cover" sizes="100vw" />
          </div>
      </section>
      ) : null}

      {hasHtmlDescription && product.longDescription?.trim() ? (
      <section className="border-t border-idl-border bg-idl-path-design">
        <SectionContainer narrow className="py-16 sm:py-20">
          <ProductDetailSectionLabel variant="design" className="mb-[18px] text-idl-brass tracking-[0.18em]">
            DESCRIZIONE
          </ProductDetailSectionLabel>
          <ProductDescriptionHtml
            html={product.longDescription}
            className="product-description max-w-none text-base leading-[1.85] text-idl-ink-soft [&_p:first-child]:font-serif [&_p:first-child]:text-[23px] [&_p:first-child]:leading-[1.5] [&_p:first-child]:text-idl-ink [&_p]:mb-[18px] [&_ul]:my-[18px] [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:my-[18px] [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_li]:text-idl-ink-soft [&_strong]:text-idl-ink"
          />
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

      {(specRowsWithValues.length > 0 || hasDimensionsPanel || productDocuments.length > 0) ? (
      <section className="border-t border-idl-border bg-idl-paper">
        <SectionContainer className="grid min-w-0 items-start gap-10 py-16 sm:gap-14 sm:py-20 lg:grid-cols-2">
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
                  key={`${row.key ?? row.label}:${row.value}`}
                  label={row.label}
                  value={row.value}
                  href={row.href}
                  variant="design"
                  monoValue={/portalampade|attacco|tensione|protezione|manuale|wattaggio/i.test(row.label)}
                />
              ))}
            </div>
          </div>
          ) : <div />}

          {(hasDimensionsPanel || productDocuments.length > 0) ? (
          <div className="flex flex-col gap-[22px]">
            <ProductDimensionsPanel
              product={product}
              specRows={parsedSpecRows}
              variantAttributes={selectedVariant?.attributes}
              variant="design"
            />

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
      <section>
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
      <section className="border-t border-idl-border bg-idl-path-design">
        <SectionContainer className="py-16 sm:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <ProductDetailSectionLabel variant="design" className="mb-3">
                {product.brand ? `FIRMA ${product.brand.name.toUpperCase()}` : 'COLLEZIONE'}
              </ProductDetailSectionLabel>
              <h2 className="font-serif text-2xl font-medium text-idl-ink sm:text-[30px]">Altre icone da scoprire</h2>
            </div>
            {product.brand ? (
              <Link
                to={lp(`/brand/${product.brand.slug}`)}
                className="text-sm font-semibold text-idl-brass hover:underline"
              >
                Tutto {product.brand.name} →
              </Link>
            ) : null}
          </div>
          <DesignRelatedProducts
            products={relatedProducts.slice(0, 8)}
            lp={lp}
            brandName={product.brand?.name}
          />
        </SectionContainer>
      </section>
      ) : null}

      {alternatives.length > 0 ? (
        <section className="border-t border-idl-border bg-idl-paper">
          <SectionContainer className="py-16 sm:py-20">
            <div className="mb-10">
              <ProductDetailSectionLabel variant="design" className="mb-3">
                ALTERNATIVE
              </ProductDetailSectionLabel>
              <h2 className="font-serif text-2xl font-medium text-idl-ink sm:text-[30px]">Potrebbe interessarti anche</h2>
            </div>
            <DesignRelatedProducts
              products={alternatives.slice(0, 8)}
              lp={lp}
              brandName={product.brand?.name}
            />
          </SectionContainer>
        </section>
      ) : null}

      {accessories.length > 0 ? (
        <section className="border-t border-idl-border bg-idl-path-design">
          <SectionContainer className="py-16 sm:py-20">
            <div className="mb-10">
              <ProductDetailSectionLabel variant="design" className="mb-3">
                ACCESSORI
              </ProductDetailSectionLabel>
              <h2 className="font-serif text-2xl font-medium text-idl-ink sm:text-[30px]">
                {t('product.accessories.sectionHeading')}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-idl-ink-muted">{t('product.accessories.subtitle')}</p>
            </div>
            <DesignAccessoryPicker
              accessories={accessories}
              selectedSlugs={selectedAccessorySlugs}
              onToggle={toggleAccessory}
              lp={lp}
              layout="section"
            />
          </SectionContainer>
        </section>
      ) : null}

      <CategoryCtaBanner banner={DESIGN_CTA} lp={lp} variant="design" />

      {designerName ? (
      <section className="border-t border-idl-border bg-idl-paper">
        <SectionContainer className="grid items-center gap-10 py-16 sm:gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
          <div>
            <ProductDetailSectionLabel variant="design" className="mb-4">
              IL DESIGNER
            </ProductDetailSectionLabel>
            <h2 className="mb-4 font-serif text-3xl font-medium text-idl-ink sm:text-[38px]">{designerName}</h2>
            {designerProjectsHref ? (
            <Link
              to={lp(designerProjectsHref)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-idl-path-design-border px-5 py-3 text-sm font-semibold text-idl-ink transition hover:border-idl-brass hover:text-idl-brass"
            >
              Tutti i progetti del designer →
            </Link>
            ) : null}
          </div>
        </SectionContainer>
      </section>
      ) : null}

      <ProductProfessionalBanner variant="design" />

      <ProductDetailStickyBar
        product={product}
        displayPriceCents={combinedPriceCents}
        imageUrl={selectedVariant?.imageUrl ?? galleryImages[0] ?? product.imageUrl}
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
        addLabel={
          selectedAccessories.length > 0 ? t('product.accessories.addWithProduct') : t('product.addToCart')
        }
        addLabelShort={t('product.addToCartShort')}
        addingLabel={t('product.addingToCart')}
        variant="design"
      />
    </div>
  )
}
