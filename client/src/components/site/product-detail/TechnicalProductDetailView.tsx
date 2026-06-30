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
import { SectionContainer } from '@/components/site/primitives'
import { extractProductDisplayTitle } from '@/lib/product-display-title'
import {
  findSpecValue,
  groupSpecRowsForTechnical,
  parseProductSpecRows,
} from '@/lib/product-specs-parse'
import { buildTechnicalCardSpecTags } from '@/lib/technical-card-spec-tags'
import { cn } from '@/utils/cn'
import {
  ProductDetailCard,
  ProductDetailSectionLabel,
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
import { TechnicalHeroVariantPicker } from './TechnicalHeroVariantPicker'
import { ProductQuantityStepper } from './ProductQuantityStepper'
import {
  ProductDetailStickyBar,
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

const COMPAT_LABELS = [
  { key: 'attacco', label: 'Attacco', re: /attacco|portalampade|socket/i },
  { key: 'lunghezza', label: 'Lunghezza', re: /lunghezza|length/i },
  { key: 'tensione', label: 'Tensione', re: /tensione|volt/i },
  { key: 'dimmer', label: 'Dimmerabile', re: /dimmer/i },
  { key: 'uso', label: 'Uso consigliato', re: /uso|applicazione/i },
  { key: 'incompat', label: 'Non compatibile con', re: /non compatibile|incompatib/i },
] as const

const HIGHLIGHT_SPEC_LABELS = [
  'Attacco',
  'Lunghezza',
  'Potenza',
  'Flusso luminoso',
  'Temperatura colore',
  'Tensione',
  'Dimmerabile',
  'Angolo luce',
]

function hasHtmlMarkup(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false
  return /<\/?[a-z][\s\S]*?>/i.test(raw)
}

export function TechnicalProductDetailView({ product, relatedProducts, state }: Props) {
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

  const alternativeProducts =
    (product.alternatives?.length ? product.alternatives : relatedProducts) ?? []
  const accessoryProducts = product.accessories ?? []

  const parsedSpecs = parseProductSpecRows(product.specsTableHtml)
  const specGroups = groupSpecRowsForTechnical(parsedSpecs)
  const tags =
    product.specTags ??
    buildTechnicalCardSpecTags({
      name: product.name,
      shortDescription: product.shortDescription,
    })

  const breadcrumbItems = buildProductBreadcrumbItems({
    productName: product.name,
    category: product.categories?.[0] ?? null,
    lp,
    catalogKind: 'technical',
  })

  const { title: displayTitle } = extractProductDisplayTitle(product.name)
  const subtitle = buildProductSubtitle(product)
  const metaLine = buildProductMetaLine(product)
  const brandEyebrow = product.brand?.name?.toUpperCase() ?? 'PRODOTTO TECNICO'
  const priceModeLabel = formatPriceDisplayModeLabel(
    selectedVariant?.priceDisplayMode ?? product.priceDisplayMode,
  )

  const highlightSpecs = HIGHLIGHT_SPEC_LABELS.map((label) => {
    const re = new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const found = parsedSpecs.find((row) => re.test(row.label))
    return { label, value: found?.value ?? null }
  }).filter((spec) => spec.value?.trim())

  const compatRows = COMPAT_LABELS.map(({ label, re }) => ({
    label,
    value: findSpecValue(parsedSpecs, re),
  })).filter((row) => row.value?.trim())

  const incompatValue = findSpecValue(parsedSpecs, /non compatibile|incompatib/i)
  const dimensionsValue = findSpecValue(parsedSpecs, /dimensioni|lunghezza|diametro/i)
  const hasCompatSection =
    compatRows.length > 0 || Boolean(product.shortDescription?.trim()) || Boolean(incompatValue?.trim())
  const hasDescriptionOrSpecs =
    Boolean(product.longDescription?.trim()) || highlightSpecs.length > 0

  const handleAddToCart = createAddToCartHandler({
    product,
    quantity,
    variantRef,
    galleryImages,
    setIsAddingToCart,
  })

  return (
    <div className="min-w-0 w-full overflow-x-clip bg-idl-tech-panel pb-20 sm:pb-0">
      <ProductDetailBreadcrumb items={breadcrumbItems} lp={lp} variant="technical" />

      {/* HERO */}
        <SectionContainer className="grid min-w-0 items-start gap-8 pb-8 pt-1 sm:gap-12 sm:pb-10 lg:grid-cols-2 lg:gap-12 lg:pb-10">
        <ProductDetailGallery
          images={galleryImages}
          alt={product.name}
          activeUrl={selectedVariant?.imageUrl ?? product.imageUrl}
          variant="technical"
        />

        <div className="min-w-0">
          <div className="mb-2 font-mono text-[11px] tracking-[0.1em] text-idl-muted uppercase">
            {brandEyebrow}
            {product.brand ? '' : ' · COMPONENTISTICA'}
          </div>
          <h1 className="text-[clamp(1.5rem,6vw,1.875rem)] leading-[1.1] font-extrabold tracking-[-0.02em] text-idl-graphite">
            {displayTitle}
          </h1>
          {subtitle ? (
            <div className="mt-2 font-mono text-[15px] text-idl-graphite-2">{subtitle}</div>
          ) : null}
          {metaLine ? (
            <div className="mt-3.5 mb-[18px] font-mono text-[11.5px] text-idl-muted">{metaLine}</div>
          ) : (
            <div className="mb-[18px]" />
          )}

          {tags.length > 0 ? (
            <div className="mb-[22px] flex flex-wrap gap-[7px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'rounded-[5px] border px-[11px] py-1.5 font-mono text-[11.5px] text-idl-graphite',
                    /K$/i.test(tag) || /calda|naturale/i.test(tag)
                      ? 'border-[#f0ddc0] bg-[#fbf1e3]'
                      : 'border-idl-tech-chip-border bg-[#eef1f4]',
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {product.variants.length > 1 ? (
            <div className="mb-[22px]">
              <TechnicalHeroVariantPicker
                variants={product.variants}
                selectedRef={variantRef ?? product.variants[0]?.ref ?? ''}
                onChange={setSelectedVariantRef}
              />
            </div>
          ) : null}

          {/* Buy box card */}
          <div className="rounded-xl border border-idl-tech-border bg-idl-tech-panel p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] sm:p-[22px]">
            <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
              <span className="text-[26px] font-extrabold tracking-[-0.02em] sm:text-[30px]">
                {formatMoney(displayPriceCents, product.currency)}
              </span>
              {priceModeLabel ? (
                <span className="text-[13.5px] text-idl-muted">{priceModeLabel}</span>
              ) : null}
            </div>
            <div className="mb-[18px] flex flex-col gap-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'text-[13.5px] font-bold',
                    availability?.status === 'available'
                      ? 'text-[#1f9d57]'
                      : availability?.status === 'orderable'
                        ? 'text-[#b5701a]'
                        : 'text-idl-muted',
                  )}
                >
                  ●{' '}
                  {availability
                    ? formatAvailabilityPrimaryLabel(availability)
                    : t('product.availability.orderable')}
                </span>
                {availability?.status === 'available' ? (
                  <span className="text-[13px] text-idl-muted">· spedizione entro 24/48h</span>
                ) : null}
              </div>
              {availability?.detail ? (
                <p className="text-[13px] text-idl-muted">{availability.detail}</p>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:items-stretch">
              {availability?.canAddToCart ? (
                <ProductQuantityStepper
                  value={quantity}
                  min={1}
                  max={maxQuantity}
                  onChange={setQuantity}
                  variant="technical"
                />
              ) : null}
              <button
                type="button"
                disabled={!availability?.canAddToCart || isAddingToCart}
                onClick={handleAddToCart}
                className="flex-1 rounded-lg bg-idl-amber px-4 py-3.5 text-center text-[15.5px] font-bold text-white transition hover:bg-[#b08e3e] disabled:opacity-60"
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

            <div className="mt-3.5 flex flex-col gap-3 border-t border-[#ededea] pt-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold text-idl-graphite">Non sei sicuro che sia quello giusto?</div>
                <div className="text-[12.5px] text-[#7a6a52]">
                  Inviaci una foto della vecchia lampadina o del portalampada.
                </div>
              </div>
              <ProductDetailContactLink
                href={lp('/contatti')}
                className="w-full shrink-0 rounded-[7px] border border-[#f0ddc0] bg-[#fbf4ea] px-4 py-[11px] text-center text-[13px] font-bold text-[#b5701a] sm:w-auto sm:whitespace-nowrap"
              >
                Verifica compatibilità
              </ProductDetailContactLink>
            </div>
          </div>

            <div className="mt-3.5 flex flex-wrap gap-[18px] text-[12.5px] text-idl-muted">
              <span>✓ {t('product.trust.returnBadge')}</span>
              <span>✓ Garanzia 2 anni</span>
              <span>✓ Pagamenti sicuri</span>
            </div>
        </div>
      </SectionContainer>

      {hasCompatSection ? (
      <section className="border-y border-[#ededea] bg-[#f7f8fa]">
        <SectionContainer className="grid gap-5 py-7 sm:grid-cols-2 sm:gap-6 sm:py-[34px]">
          {compatRows.length > 0 ? (
          <ProductDetailCard variant="technical" className="p-4 sm:p-[26px]">
            <h2 className="mb-4 text-base font-extrabold tracking-[-0.01em]">Compatibilità rapida</h2>
            <div>
              {compatRows.map((row) => (
                <ProductSpecRowItem
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  variant="technical"
                  compact
                  monoValue={row.label !== 'Uso consigliato' && row.label !== 'Non compatibile con'}
                />
              ))}
            </div>
          </ProductDetailCard>
          ) : <div />}

          {(product.shortDescription?.trim() || incompatValue?.trim()) ? (
          <div className="flex flex-col gap-3.5">
            {product.shortDescription?.trim() ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="mb-2 flex items-center gap-2 text-[15px] font-extrabold text-amber-900">
                <span aria-hidden>⚠️</span> Controlla prima dell&apos;acquisto
              </div>
              <p className="text-sm leading-relaxed text-amber-950/80">{product.shortDescription}</p>
            </div>
            ) : null}
            {incompatValue?.trim() ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-bold text-red-800">
                <span aria-hidden>⛔</span>
                {incompatValue}
              </div>
            </div>
            ) : null}
          </div>
          ) : null}
        </SectionContainer>
      </section>
      ) : null}

      {hasDescriptionOrSpecs ? (
      <SectionContainer className="grid items-start gap-10 py-10 sm:gap-12 lg:grid-cols-2 lg:py-12">
        {product.longDescription?.trim() ? (
        <div>
          <h2 className="mb-3 text-lg font-extrabold tracking-tight">Descrizione</h2>
          {hasHtmlMarkup(product.longDescription) ? (
            <ProductDescriptionHtml
              html={product.longDescription}
              className="product-description max-w-none text-[15px] leading-relaxed text-idl-graphite-2"
            />
          ) : (
            <p className="text-[15px] leading-relaxed text-idl-graphite-2">{product.longDescription}</p>
          )}
        </div>
        ) : <div />}

        {highlightSpecs.length > 0 ? (
        <div>
          <h2 className="mb-3.5 text-lg font-extrabold tracking-tight">Specifiche principali</h2>
          <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
            {highlightSpecs.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg border border-idl-tech-chip bg-idl-tech-panel px-3.5 py-3"
              >
                <div className="mb-0.5 text-[11.5px] text-idl-muted">{label}</div>
                <span className="font-mono text-[15px] font-semibold text-idl-graphite">{value}</span>
              </div>
            ))}
          </div>
        </div>
        ) : null}
      </SectionContainer>
      ) : null}

      {(specGroups.length > 0 || dimensionsValue || productDocuments.length > 0) ? (
      <section className="border-t border-idl-tech-chip bg-idl-tech-panel">
        <SectionContainer className="py-10 sm:py-12">
          <h2 className="mb-5 text-xl font-extrabold tracking-tight">Scheda tecnica completa</h2>
          <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-11">
            {specGroups.length > 0 ? (
            <div>
              {specGroups.map((group) => (
                <div key={group.title} className="mb-5">
                  <ProductDetailSectionLabel variant="technical" className="mb-2 tracking-wider">
                    {group.title}
                  </ProductDetailSectionLabel>
                  <div className="overflow-hidden rounded-[10px] border border-idl-tech-border bg-idl-tech-panel">
                    {group.rows.map((row, index) => (
                      <div
                        key={`${row.label}-${index}`}
                        className="flex flex-col gap-1 border-b border-idl-tech-chip px-4 py-2.5 last:border-b-0 min-[480px]:flex-row min-[480px]:items-start min-[480px]:justify-between min-[480px]:gap-4"
                      >
                        <span className="shrink-0 text-[13px] text-idl-muted">{row.label}</span>
                        <span className="text-left text-[13.5px] font-semibold break-words text-idl-graphite min-[480px]:max-w-[60%] min-[480px]:text-right">
                          {row.href ? (
                            <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-idl-amber underline-offset-2 hover:underline">
                              {row.value}
                            </a>
                          ) : (
                            row.value
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            ) : <div />}

            <div className="flex flex-col gap-6 lg:sticky lg:top-24">
              <ProductDetailCard variant="technical">
                <h3 className="mb-3.5 text-base font-extrabold tracking-tight">Come scegliere il ricambio corretto</h3>
                <ol className="space-y-3">
                  {[
                    'Misura la lunghezza o le dimensioni del componente da sostituire.',
                    'Controlla attacco, tensione e potenza sulla vecchia etichetta.',
                    'Verifica temperatura colore e dimmerabilità se usi un dimmer.',
                    'Nel dubbio, inviaci una foto: ti rispondiamo in giornata.',
                  ].map((step, i) => (
                    <li key={step} className="flex gap-3 text-[13.5px] leading-snug text-idl-graphite-2">
                      <span className="shrink-0 font-mono text-xs font-bold text-idl-amber">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </ProductDetailCard>

              {dimensionsValue ? (
              <ProductDetailCard variant="technical">
                <h3 className="mb-4 text-base font-extrabold tracking-tight">Dimensioni e ingombri</h3>
                <p className="text-xs text-idl-muted">{dimensionsValue}</p>
              </ProductDetailCard>
              ) : null}

              {productDocuments.length > 0 ? (
              <ProductDetailCard variant="technical">
                <h3 className="mb-3 text-base font-extrabold tracking-tight">Documenti tecnici</h3>
                <ProductDocuments
                  slug={product.slug}
                  documents={productDocuments}
                  variantRef={variantRef}
                  variant="technical"
                  showTitle={false}
                />
              </ProductDetailCard>
              ) : null}
            </div>
          </div>
        </SectionContainer>
      </section>
      ) : null}

      {alternativeProducts.length > 0 ? (
      <SectionContainer className="py-10 sm:py-12">
        <h2 className="text-xl font-extrabold tracking-tight sm:text-[22px]">Non è quella giusta?</h2>
        <p className="mt-1.5 text-sm text-idl-muted">
          Le alternative più simili per lunghezza, colore luce e dimmerabilità.
        </p>
        <div className="mt-5 overflow-hidden rounded-xl border border-idl-tech-border bg-white dark:bg-idl-tech-panel">
          <div className="grid grid-cols-[2fr_repeat(4,1fr)_1.1fr] border-b border-idl-tech-border bg-idl-tech-panel font-mono text-[11px] tracking-wide text-idl-muted max-lg:hidden">
            <div className="px-4 py-3">PRODOTTO</div>
            <div className="px-3 py-3">LUNGH.</div>
            <div className="px-3 py-3">WATT</div>
            <div className="px-3 py-3">LUCE</div>
            <div className="px-3 py-3">DIMMER</div>
            <div className="px-3 py-3" />
          </div>

          <div className="border-b border-idl-tech-chip bg-amber-50/50 px-4 py-3.5 max-lg:space-y-1 lg:grid lg:grid-cols-[2fr_repeat(4,1fr)_1.1fr] lg:items-center lg:px-0">
            <div className="text-[13.5px] font-bold lg:px-4">
              {product.name}{' '}
              <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10.5px] text-idl-amber">
                ATTUALE
              </span>
            </div>
            <div className="font-mono text-[13px] max-lg:inline max-lg:mr-3 lg:px-3">
              {findSpecValue(parsedSpecs, /lunghezza/) ?? '—'}
            </div>
            <div className="font-mono text-[13px] max-lg:inline max-lg:mr-3 lg:px-3">
              {findSpecValue(parsedSpecs, /potenza|watt/) ?? '—'}
            </div>
            <div className="font-mono text-[13px] max-lg:inline max-lg:mr-3 lg:px-3">
              {findSpecValue(parsedSpecs, /temperatura|kelvin|colore/) ?? '—'}
            </div>
            <div className="font-mono text-[13px] max-lg:inline lg:px-3">
              {findSpecValue(parsedSpecs, /dimmer/) ?? '—'}
            </div>
            <div className="text-[13px] font-bold text-idl-muted max-lg:mt-1 lg:px-3">In pagina</div>
          </div>

          {alternativeProducts.slice(0, 3).map((alt) => {
              const altTags = alt.specTags ?? buildTechnicalCardSpecTags({ name: alt.name, shortDescription: alt.shortDescription })
              return (
                <div
                  key={alt.slug}
                  className="border-b border-idl-tech-chip px-4 py-3.5 last:border-b-0 max-lg:space-y-2 lg:grid lg:grid-cols-[2fr_repeat(4,1fr)_1.1fr] lg:items-center lg:px-0"
                >
                  <div className="text-[13.5px] font-semibold lg:px-4">{alt.name}</div>
                  <div className="font-mono text-[13px] text-idl-graphite max-lg:inline max-lg:mr-3 lg:px-3">
                    {altTags[1] ?? '—'}
                  </div>
                  <div className="font-mono text-[13px] max-lg:inline max-lg:mr-3 lg:px-3">{altTags[0] ?? '—'}</div>
                  <div className="font-mono text-[13px] max-lg:inline max-lg:mr-3 lg:px-3">{altTags[2] ?? '—'}</div>
                  <div className="font-mono text-[13px] max-lg:inline lg:px-3">—</div>
                  <Link
                    to={lp(`/prodotto/${alt.slug}`)}
                    className="text-[13px] font-bold text-idl-amber hover:underline max-lg:mt-1 lg:px-3"
                  >
                    Vedi →
                  </Link>
                </div>
              )
            })}
        </div>
      </SectionContainer>
      ) : null}

      {accessoryProducts.length > 0 ? (
        <SectionContainer className="border-t border-idl-tech-chip py-10 sm:py-12">
          <h2 className="text-xl font-extrabold tracking-tight sm:text-[22px]">Accessori compatibili</h2>
          <p className="mt-1.5 text-sm text-idl-muted">Componenti e accessori consigliati per questo prodotto.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accessoryProducts.slice(0, 6).map((item) => (
              <Link
                key={item.slug}
                to={lp(`/prodotto/${item.slug}`)}
                className="rounded-xl border border-idl-tech-border bg-idl-tech-panel px-4 py-3 text-sm font-semibold transition hover:border-idl-amber"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </SectionContainer>
      ) : null}

      {/* FAQ + supporto */}
      <section className="border-t border-idl-tech-chip bg-idl-tech-panel">
        <SectionContainer className="grid items-start gap-10 py-10 sm:gap-11 lg:grid-cols-[1.15fr_1fr] lg:py-12">
          <div>
            <ProductDetailSectionLabel variant="technical" className="mb-2.5">
              FAQ · PRODOTTO
            </ProductDetailSectionLabel>
            <h2 className="text-2xl font-extrabold tracking-tight">Domande frequenti</h2>
            <p className="mt-1.5 mb-5 text-sm text-idl-muted">
              Le risposte ai dubbi più comuni su questo prodotto.
            </p>
            <div className="space-y-2.5">
              {product.shortDescription?.trim() ? (
              <details className="group overflow-hidden rounded-xl border border-amber-200 bg-idl-tech-panel shadow-sm open:shadow-md" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                  Come verifico che sia il ricambio giusto?
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-idl-amber text-sm text-white group-open:rotate-180">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-idl-muted">
                  {product.shortDescription}
                </div>
              </details>
              ) : null}
            </div>
          </div>

          <ProductDetailCard variant="technical" className="overflow-hidden p-0 shadow-lg">
            <div className="border-b border-idl-tech-chip px-6 py-5 sm:px-7">
              <ProductDetailSectionLabel variant="technical" className="mb-3">
                SUPPORTO TECNICO
              </ProductDetailSectionLabel>
              <h3 className="text-xl font-extrabold tracking-tight text-idl-graphite">
                Non sei sicuro che sia la misura giusta?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-idl-muted">
                Inviaci una foto della vecchia lampadina o del portalampada: un nostro tecnico ti dice qual è il
                ricambio corretto, di solito <strong className="text-idl-graphite">in giornata</strong>.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 px-6 py-5 sm:px-7">
              <ProductDetailContactLink
                href={lp('/contatti')}
                className="flex items-center gap-3 rounded-[10px] bg-idl-amber px-4 py-3.5 text-sm font-bold text-white"
              >
                Invia una foto →
              </ProductDetailContactLink>
              <ProductDetailContactLink
                href={lp('/negozio')}
                className="flex items-center gap-3 rounded-[10px] border border-idl-tech-chip-border bg-white px-4 py-3 text-sm font-bold text-idl-graphite dark:bg-idl-tech-panel"
              >
                Cerca per EAN o codice →
              </ProductDetailContactLink>
              <ProductDetailContactLink
                href={lp('/contatti')}
                className="flex items-center gap-3 rounded-[10px] border border-idl-tech-chip-border bg-white px-4 py-3 text-sm font-bold text-idl-graphite dark:bg-idl-tech-panel"
              >
                Scrivi una domanda →
              </ProductDetailContactLink>
              <div className="mt-1 flex items-center gap-2 text-xs text-idl-muted">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                Tecnici disponibili · risposta in giornata · showroom Roma
              </div>
            </div>
          </ProductDetailCard>
        </SectionContainer>
      </section>

      <ProductProfessionalBanner variant="technical" />

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
        addLabelShort={t('product.addToCartShort')}
        addingLabel={t('product.addingToCart')}
        variant="technical"
      />
    </div>
  )
}
