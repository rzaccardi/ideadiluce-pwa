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
} from '@/lib/product-specs-parse'
import {
  ProductDetailCard,
  ProductDetailPlaceholder,
  ProductDetailSectionLabel,
  ProductDetailValue,
  ProductSpecRowItem,
  buildProductMetaLine,
  buildProductSubtitle,
} from './shared'
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
    t,
  } = state

  const breadcrumbItems = buildProductBreadcrumbItems({
    productName: product.name,
    category: product.categories?.[0] ?? null,
    lp,
    catalogKind: 'design',
  })

  const specRows = mergeDesignSpecRows(parseProductSpecRows(product.specsTableHtml))
  const { title: displayTitle, rest: titleRest } = extractProductDisplayTitle(product.name)
  const subtitle = buildProductSubtitle(product)
  const metaLine = buildProductMetaLine(product)
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

  const handleAddToCart = createAddToCartHandler({
    product,
    quantity,
    variantRef,
    galleryImages,
    setIsAddingToCart,
  })

  return (
    <div className="-mx-0 w-full bg-idl-design text-idl-design-fg">
      {/* HERO */}
      <section className="relative overflow-hidden bg-idl-design">
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 right-[8%] hidden h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(240,173,87,0.20)_0%,rgba(240,173,87,0)_68%)] animate-idl-glow-drift lg:block"
        />
        <ProductDetailBreadcrumb items={breadcrumbItems} lp={lp} variant="design" inHero />

        <SectionContainer className="relative z-[2] grid items-start gap-10 pb-14 pt-7 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-14">
          <ProductDetailGallery
            images={galleryImages}
            alt={product.name}
            activeUrl={selectedVariant?.imageUrl ?? product.imageUrl}
            variant="design"
          />

          <div>
            <Eyebrow variant="design" className="mb-[18px] tracking-[0.18em] text-idl-glow">
              {brandLabel}
              {product.brand ? ' · ICONA DEL DESIGN' : ''}
            </Eyebrow>
            <h1 className="font-serif text-[42px] leading-none font-medium tracking-[-0.01em] sm:text-5xl lg:text-[54px]">
              {displayTitle}
            </h1>
            <div className="mt-3 text-base text-idl-design-muted">
              {titleRest ? (
                <span>{titleRest}</span>
              ) : (
                <ProductDetailValue value={subtitle} placeholder="Tipologia e designer — in arrivo" />
              )}
            </div>
            {metaLine ? (
              <div className="mt-2 mb-7 font-mono text-xs text-idl-design-dim">{metaLine}</div>
            ) : (
              <div className="mt-2 mb-7 font-mono text-xs text-idl-design-dim">
                <ProductDetailPlaceholder>Premi e riconoscimenti — in arrivo</ProductDetailPlaceholder>
              </div>
            )}

            <div className="flex items-baseline gap-3.5">
              <span className="font-serif text-[30px] font-medium sm:text-[34px]">
                {formatMoney(displayPriceCents, product.currency)}
              </span>
              {priceModeLabel ? (
                <span className="text-[13.5px] text-idl-design-dim">{priceModeLabel}</span>
              ) : null}
            </div>
            <div className="mt-2 mb-[30px] flex flex-col gap-1 text-[13.5px]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#5fb98a]" aria-hidden />
                <span className="text-idl-design-muted">
                  <ProductDetailValue
                    value={
                      availability
                        ? formatAvailabilityPrimaryLabel(availability)
                        : undefined
                    }
                    placeholder="Disponibilità — contattaci per tempi di consegna"
                    className="not-italic text-idl-design-muted"
                  />
                </span>
              </div>
              {availability?.detail ? (
                <p className="pl-4 text-idl-design-dim">{availability.detail}</p>
              ) : null}
            </div>

            <DesignHeroVariantPicker
              variants={product.variants}
              selectedRef={variantRef ?? product.variants[0]?.ref ?? ''}
              onChange={setSelectedVariantRef}
            />

            <div className="mb-3.5 flex min-w-0 items-stretch gap-3">
              {availability?.canAddToCart ? (
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
                disabled={!availability?.canAddToCart || isAddingToCart}
                onClick={handleAddToCart}
                className="flex-1 rounded-lg bg-idl-glow px-4 py-[15px] text-center text-[15.5px] font-bold text-idl-design transition hover:bg-[#f7bd6f] disabled:opacity-60"
              >
                {isAddingToCart ? t('product.addingToCart') : t('product.addToCart')}
              </button>
            </div>

            {!availability?.canAddToCart &&
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

            <div className="flex flex-wrap gap-5 border-t border-white/10 pt-[18px] text-[12.5px] text-idl-design-dim">
              <span>✓ Reso entro 50 giorni</span>
              <span>✓ Garanzia ufficiale</span>
              <span>
                ✓ Prodotto originale{' '}
                {product.brand?.name ?? <ProductDetailPlaceholder>brand</ProductDetailPlaceholder>}
              </span>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* STORIA */}
      <section className="border-t border-white/6 bg-[#1b160f]">
        <SectionContainer narrow className="px-6 py-16 text-center sm:px-12 sm:py-16">
          <ProductDetailSectionLabel variant="design" className="mb-6 tracking-[0.22em]">
            LA STORIA
          </ProductDetailSectionLabel>
          <blockquote className="font-serif text-[26px] leading-[1.32] font-normal italic text-idl-design-fg sm:text-[32px]">
            {storyQuote ? `"${storyQuote}"` : <ProductDetailPlaceholder>Citazione editoriale — in arrivo</ProductDetailPlaceholder>}
          </blockquote>
          <div className="mx-auto mt-7 max-w-3xl text-base leading-[1.7] text-idl-design-muted">
            {product.longDescription?.trim() && !hasHtmlMarkup(product.longDescription) ? (
              <p>{product.longDescription}</p>
            ) : (
              <ProductDetailPlaceholder>
                Racconto del prodotto e del designer — contenuto in preparazione.
              </ProductDetailPlaceholder>
            )}
          </div>
        </SectionContainer>
      </section>

      {/* Lifestyle hero */}
      <section className="bg-idl-design">
        {lifestyleImages[0] ? (
          <div className="relative h-[420px] sm:h-[560px] lg:h-[680px]">
            <SiteImage src={lifestyleImages[0]} alt="" fill className="object-cover" sizes="100vw" />
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center bg-idl-design-elevated text-sm text-idl-design-dim sm:h-[420px]">
            <ProductDetailPlaceholder>Immagine ambiente — in arrivo</ProductDetailPlaceholder>
          </div>
        )}
      </section>

      {/* DESCRIZIONE */}
      <section className="border-t border-idl-border bg-idl-path-design">
        <SectionContainer narrow className="px-6 py-16 sm:px-12">
          <ProductDetailSectionLabel variant="design" className="mb-[18px] text-idl-brass tracking-[0.18em]">
            DESCRIZIONE
          </ProductDetailSectionLabel>
          {product.longDescription?.trim() ? (
            hasHtmlMarkup(product.longDescription) ? (
              <ProductDescriptionHtml
                html={product.longDescription}
                className="product-description max-w-none [&_p:first-child]:font-serif [&_p:first-child]:text-[23px] [&_p:first-child]:leading-[1.5] [&_p:first-child]:text-[#2a241c] [&_p]:mb-[18px] [&_p]:text-base [&_p]:leading-[1.85] [&_p]:text-[#5c5447]"
              />
            ) : (
              <>
                <p className="mb-[26px] font-serif text-[23px] leading-[1.5] text-[#2a241c]">{product.longDescription}</p>
              </>
            )
          ) : (
            <p className="mb-[26px] font-serif text-[23px] leading-[1.5] text-[#2a241c]">
              <ProductDetailPlaceholder>Descrizione completa — in arrivo</ProductDetailPlaceholder>
            </p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-idl-border pt-[22px]">
            <span className="font-mono text-[11px] tracking-wide text-idl-placeholder uppercase">
              SCHEDA A CURA DI IDEADILUCE
            </span>
            <span className="flex-1" />
            <ProductDetailContactLink
              href={lp('/contatti')}
              className="text-sm font-bold text-idl-brass hover:text-idl-brass-light"
            >
              Richiedi maggiori informazioni →
            </ProductDetailContactLink>
          </div>
        </SectionContainer>
      </section>

      {/* CARATTERISTICHE TECNICHE */}
      <section className="bg-idl-paper">
        <SectionContainer className="grid items-start gap-14 px-6 py-14 sm:px-12 lg:grid-cols-2 lg:py-14">
          <div>
            <ProductDetailSectionLabel variant="design" className="mb-4 text-idl-brass tracking-[0.18em]">
              CARATTERISTICHE TECNICHE
            </ProductDetailSectionLabel>
            <h2 className="mb-5 font-serif text-[28px] font-medium text-idl-ink">
              {displayTitle}
              {product.brand ? ` · ${product.brand.name}` : ''}
            </h2>
            <div>
              {specRows.map((row) => (
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

          <div className="flex flex-col gap-[22px]">
            <ProductDetailCard variant="design">
              <h3 className="mb-[18px] font-serif text-xl font-medium text-idl-ink">Dimensioni</h3>
              <div className="flex aspect-[2/1] items-center justify-center rounded-lg border border-dashed border-idl-border bg-idl-cream/50 text-sm text-idl-placeholder">
                <ProductDetailPlaceholder>Schema dimensioni — in arrivo</ProductDetailPlaceholder>
              </div>
              <p className="mt-3 text-sm text-idl-ink-muted">
                <ProductDetailValue
                  value={specRows.find((r) => r.label === 'Dimensioni')?.value}
                  placeholder="Misure e peso — in arrivo"
                />
              </p>
            </ProductDetailCard>

            <ProductDetailCard variant="design">
              <h3 className="mb-4 font-serif text-xl font-medium text-idl-ink">Download</h3>
              {productDocuments.length > 0 ? (
                <ProductDocuments
                  slug={product.slug}
                  documents={productDocuments}
                  variantRef={variantRef}
                  variant="design"
                  showTitle={false}
                  className="space-y-0"
                />
              ) : (
                <div className="space-y-0">
                  <div className="flex items-center gap-3 border-b border-idl-cream py-3 opacity-60">
                    <span className="rounded border border-red-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700">
                      PDF
                    </span>
                    <ProductDetailPlaceholder className="flex-1 text-sm font-semibold not-italic text-idl-ink">
                      Scheda prodotto — in arrivo
                    </ProductDetailPlaceholder>
                  </div>
                </div>
              )}
            </ProductDetailCard>
          </div>
        </SectionContainer>
      </section>

      {/* Lifestyle doppio */}
      <section className="bg-idl-design">
        <div className="grid sm:grid-cols-2">
          {[0, 1].map((i) =>
            lifestyleImages[i + 1] ? (
              <div key={i} className="relative h-[360px] sm:h-[480px] lg:h-[600px]">
                <SiteImage src={lifestyleImages[i + 1]!} alt="" fill className="object-cover" sizes="50vw" />
              </div>
            ) : (
              <div
                key={i}
                className="flex h-[280px] items-center justify-center bg-idl-design-elevated text-sm text-idl-design-dim sm:h-[360px]"
              >
                <ProductDetailPlaceholder>Immagine lifestyle — in arrivo</ProductDetailPlaceholder>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Correlati */}
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
              <Link to={lp('/brand')} className="text-sm font-semibold text-idl-glow hover:underline">
                Tutto {product.brand.name} →
              </Link>
            ) : null}
          </div>
          {relatedProducts.length > 0 ? (
            <DesignRelatedProducts
              products={relatedProducts.slice(0, 4)}
              lp={lp}
              brandName={product.brand?.name}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-white/15 py-12 text-center text-sm text-idl-design-dim">
              <ProductDetailPlaceholder>Prodotti correlati — in arrivo</ProductDetailPlaceholder>
            </div>
          )}
        </SectionContainer>
      </section>

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

      {/* Recensioni placeholder */}
      <section className="border-t border-idl-border bg-idl-paper">
        <SectionContainer className="py-12 sm:py-16">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <ProductDetailSectionLabel variant="design" className="mb-3 text-idl-brass">
                RECENSIONI
              </ProductDetailSectionLabel>
              <h2 className="font-serif text-2xl font-medium text-idl-ink sm:text-[30px]">Cosa dicono i clienti</h2>
            </div>
            <div className="text-right opacity-60">
              <div className="font-serif text-2xl font-medium text-idl-ink sm:text-[30px]">
                <ProductDetailPlaceholder>—</ProductDetailPlaceholder>
                <span className="text-lg text-idl-placeholder">/5</span>
              </div>
              <div className="text-xs text-idl-placeholder">recensioni — in arrivo</div>
            </div>
          </div>
          <div className="grid gap-[22px] md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-xl border border-idl-path-design-border bg-white p-[26px] opacity-70"
              >
                <div className="mb-3.5 text-[15px] tracking-[2px] text-[#e0a85a]">★★★★★</div>
                <ProductDetailPlaceholder className="block font-serif text-[17px] leading-[1.55] not-italic text-[#2a241c]">
                  Recensione cliente — in arrivo
                </ProductDetailPlaceholder>
              </div>
            ))}
          </div>
        </SectionContainer>
      </section>

      {/* Designer placeholder */}
      <section className="border-t border-white/6 bg-idl-design">
        <SectionContainer className="grid items-center gap-10 py-14 sm:gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:py-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded bg-idl-design-elevated shadow-[0_0_70px_rgba(240,173,87,0.08)]">
            <div className="flex h-full items-center justify-center text-sm text-idl-design-dim">
              <ProductDetailPlaceholder>Ritratto designer — in arrivo</ProductDetailPlaceholder>
            </div>
          </div>
          <div>
            <ProductDetailSectionLabel variant="design" className="mb-4">
              IL DESIGNER
            </ProductDetailSectionLabel>
            <h2 className="mb-4 font-serif text-3xl font-medium sm:text-[38px]">
              <ProductDetailValue
                value={specRows.find((r) => r.label === 'Designer')?.value}
                placeholder="Nome designer — in arrivo"
              />
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-idl-design-muted">
              <ProductDetailPlaceholder>
                Biografia del designer e curiosità sul progetto — contenuto in preparazione.
              </ProductDetailPlaceholder>
            </p>
            <Link
              to={lp('/catalog')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold transition hover:border-idl-glow hover:text-idl-glow"
            >
              Tutti i progetti del designer →
            </Link>
          </div>
        </SectionContainer>
      </section>

      <ProductProfessionalBanner variant="design" />

      <ProductDetailStickyBar
        product={product}
        displayPriceCents={displayPriceCents}
        imageUrl={galleryImages[0] ?? product.imageUrl}
        variantRef={variantRef}
        quantity={quantity}
        availabilityLabel={
          availability ? formatAvailabilityPrimaryLabel(availability) : t('product.availability.orderable')
        }
        availabilityDetail={availability?.detail}
        availabilityStatus={availability?.status}
        canAddToCart={availability?.canAddToCart ?? false}
        isAddingToCart={isAddingToCart}
        onAdd={handleAddToCart}
        addLabel={t('product.addToCart')}
        addingLabel={t('product.addingToCart')}
        variant="design"
      />
    </div>
  )
}
