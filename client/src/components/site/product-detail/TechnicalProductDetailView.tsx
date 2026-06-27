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
  })

  const compatRows = COMPAT_LABELS.map(({ label, re }) => ({
    label,
    value: findSpecValue(parsedSpecs, re),
  }))

  const handleAddToCart = createAddToCartHandler({
    product,
    quantity,
    variantRef,
    galleryImages,
    setIsAddingToCart,
  })

  return (
    <div className="-mx-0 w-full bg-white">
      <ProductDetailBreadcrumb items={breadcrumbItems} lp={lp} variant="technical" />

      {/* HERO */}
      <SectionContainer className="grid items-start gap-12 pb-10 pt-1 sm:px-12 lg:grid-cols-2 lg:gap-12 lg:pb-10">
        <ProductDetailGallery
          images={galleryImages}
          alt={product.name}
          activeUrl={selectedVariant?.imageUrl ?? product.imageUrl}
          variant="technical"
        />

        <div>
          <div className="mb-2 font-mono text-[11px] tracking-[0.1em] text-idl-muted uppercase">
            {brandEyebrow}
            {product.brand ? '' : ' · COMPONENTISTICA'}
          </div>
          <h1 className="text-[30px] leading-[1.1] font-extrabold tracking-[-0.02em] text-idl-graphite">
            {displayTitle}
          </h1>
          <div className="mt-2 font-mono text-[15px] text-idl-graphite-2">
            <ProductDetailValue value={subtitle} placeholder="Specifiche principali — in arrivo" />
          </div>
          <div className="mt-3.5 mb-[18px] font-mono text-[11.5px] text-idl-muted">
            <ProductDetailValue value={metaLine} placeholder="SKU / EAN — in arrivo" />
          </div>

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
          ) : (
            <div className="mb-[22px] flex flex-wrap gap-[7px] opacity-60">
              {['Attacco', 'Potenza', 'Tensione'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-[5px] border border-idl-tech-chip-border bg-[#eef1f4] px-[11px] py-1.5 font-mono text-[11.5px] text-idl-muted"
                >
                  {tag} —
                </span>
              ))}
            </div>
          )}

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
          <div className="rounded-xl border border-idl-tech-border bg-white p-[22px] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="mb-1.5 flex items-baseline gap-2.5">
              <span className="text-[30px] font-extrabold tracking-[-0.02em]">
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

            <div className="flex min-w-0 items-stretch gap-3">
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
                className="flex-1 rounded-lg bg-idl-amber px-4 py-3.5 text-center text-[15.5px] font-bold text-white transition hover:bg-[#c2730f] disabled:opacity-60"
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

            <div className="mt-3.5 flex flex-col gap-3 border-t border-[#eef0f3] pt-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[13.5px] font-bold text-idl-graphite">Non sei sicuro che sia quello giusto?</div>
                <div className="text-[12.5px] text-[#7a6a52]">
                  Inviaci una foto della vecchia lampadina o del portalampada.
                </div>
              </div>
              <ProductDetailContactLink
                href={lp('/contatti')}
                className="shrink-0 rounded-[7px] border border-[#f0ddc0] bg-[#fbf4ea] px-4 py-[11px] text-center text-[13px] font-bold text-[#b5701a] whitespace-nowrap"
              >
                Verifica compatibilità
              </ProductDetailContactLink>
            </div>
          </div>

            <div className="mt-3.5 flex flex-wrap gap-[18px] text-[12.5px] text-idl-muted">
              <span>✓ Reso entro 50 giorni</span>
              <span>✓ Garanzia 2 anni</span>
              <span>✓ Pagamenti sicuri</span>
            </div>
        </div>
      </SectionContainer>

      {/* Compatibilità */}
      <section className="border-y border-[#eef0f3] bg-[#f7f8fa]">
        <SectionContainer className="grid gap-6 px-6 py-[34px] sm:px-12 sm:grid-cols-2">
          <ProductDetailCard variant="technical" className="p-[26px]">
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

          <div className="flex flex-col gap-3.5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="mb-2 flex items-center gap-2 text-[15px] font-extrabold text-amber-900">
                <span aria-hidden>⚠️</span> Controlla prima dell&apos;acquisto
              </div>
              <p className="text-sm leading-relaxed text-amber-950/80">
                {product.shortDescription?.trim() ? (
                  product.shortDescription
                ) : (
                  <ProductDetailPlaceholder>
                    Note di compatibilità — verifica attacco e misure prima dell&apos;acquisto.
                  </ProductDetailPlaceholder>
                )}
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-bold text-red-800">
                <span aria-hidden>⛔</span>
                <ProductDetailValue
                  value={compatRows.find((r) => r.label === 'Non compatibile con')?.value}
                  placeholder="Avvertenze di incompatibilità — in arrivo"
                />
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* Descrizione + specs principali */}
      <SectionContainer className="grid items-start gap-10 py-10 sm:gap-12 lg:grid-cols-2 lg:py-12">
        <div>
          <h2 className="mb-3 text-lg font-extrabold tracking-tight">Descrizione</h2>
          {product.longDescription?.trim() ? (
            hasHtmlMarkup(product.longDescription) ? (
              <ProductDescriptionHtml
                html={product.longDescription}
                className="product-description max-w-none text-[15px] leading-relaxed text-idl-graphite-2"
              />
            ) : (
              <p className="text-[15px] leading-relaxed text-idl-graphite-2">{product.longDescription}</p>
            )
          ) : (
            <p className="text-[15px] leading-relaxed text-idl-graphite-2">
              <ProductDetailPlaceholder>Descrizione prodotto — in arrivo</ProductDetailPlaceholder>
            </p>
          )}
        </div>
        <div>
          <h2 className="mb-3.5 text-lg font-extrabold tracking-tight">Specifiche principali</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {highlightSpecs.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg border border-idl-tech-chip bg-idl-tech-panel px-3.5 py-3"
              >
                <div className="mb-0.5 text-[11.5px] text-idl-muted">{label}</div>
                <ProductDetailValue
                  value={value}
                  mono
                  className="font-mono text-[15px] font-semibold text-idl-graphite"
                />
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>

      {/* Scheda tecnica completa */}
      <section className="border-t border-idl-tech-chip bg-idl-tech-panel">
        <SectionContainer className="py-10 sm:py-12">
          <h2 className="mb-5 text-xl font-extrabold tracking-tight">Scheda tecnica completa</h2>
          <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-11">
            <div>
              {specGroups.length > 0 ? (
                specGroups.map((group) => (
                  <div key={group.title} className="mb-5">
                    <ProductDetailSectionLabel variant="technical" className="mb-2 tracking-wider">
                      {group.title}
                    </ProductDetailSectionLabel>
                    <div className="overflow-hidden rounded-[10px] border border-idl-tech-border bg-white">
                      {group.rows.map((row, index) => (
                        <div
                          key={`${row.label}-${index}`}
                          className="flex justify-between gap-4 border-b border-idl-tech-chip px-4 py-2.5 last:border-b-0"
                        >
                          <span className="text-[13px] text-idl-muted">{row.label}</span>
                          <span className="text-right text-[13.5px] font-semibold text-idl-graphite">
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
                ))
              ) : (
                <ProductDetailCard variant="technical">
                  <ProductDetailPlaceholder>
                    Scheda tecnica completa — dati in preparazione.
                  </ProductDetailPlaceholder>
                </ProductDetailCard>
              )}
            </div>

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

              <ProductDetailCard variant="technical">
                <h3 className="mb-4 text-base font-extrabold tracking-tight">Dimensioni e ingombri</h3>
                <div className="flex aspect-[3.5/1] items-center justify-center rounded-lg border border-dashed border-idl-tech-border bg-idl-tech-panel text-sm text-idl-muted">
                  <ProductDetailPlaceholder>Schema dimensioni — in arrivo</ProductDetailPlaceholder>
                </div>
                <p className="mt-2.5 text-xs text-idl-muted">
                  <ProductDetailValue
                    value={findSpecValue(parsedSpecs, /dimensioni|lunghezza|diametro/i)}
                    placeholder="Misure — in arrivo"
                  />
                </p>
              </ProductDetailCard>

              <ProductDetailCard variant="technical">
                <h3 className="mb-3 text-base font-extrabold tracking-tight">Documenti tecnici</h3>
                {productDocuments.length > 0 ? (
                  <ProductDocuments
                    slug={product.slug}
                    documents={productDocuments}
                    variantRef={variantRef}
                    variant="technical"
                    showTitle={false}
                  />
                ) : (
                  <div className="space-y-0 opacity-70">
                    {['Scheda tecnica', 'Etichetta energetica'].map((doc, i) => (
                      <div
                        key={doc}
                        className={cn(
                          'flex items-center gap-3 py-2.5',
                          i === 0 && 'border-b border-idl-tech-chip',
                        )}
                      >
                        <span className="rounded border border-red-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700">
                          PDF
                        </span>
                        <ProductDetailPlaceholder className="flex-1 text-[13.5px] font-semibold not-italic text-idl-graphite">
                          {doc} — in arrivo
                        </ProductDetailPlaceholder>
                      </div>
                    ))}
                  </div>
                )}
              </ProductDetailCard>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* Alternative */}
      <SectionContainer className="py-10 sm:py-12">
        <h2 className="text-xl font-extrabold tracking-tight sm:text-[22px]">Non è quella giusta?</h2>
        <p className="mt-1.5 text-sm text-idl-muted">
          Le alternative più simili per lunghezza, colore luce e dimmerabilità.
        </p>
        <div className="mt-5 overflow-hidden rounded-xl border border-idl-tech-border">
          <div className="grid grid-cols-[2fr_repeat(4,1fr)_1.1fr] border-b border-idl-tech-border bg-idl-tech-panel font-mono text-[11px] tracking-wide text-idl-muted max-lg:hidden">
            <div className="px-4 py-3">PRODOTTO</div>
            <div className="px-3 py-3">LUNGH.</div>
            <div className="px-3 py-3">WATT</div>
            <div className="px-3 py-3">LUCE</div>
            <div className="px-3 py-3">DIMMER</div>
            <div className="px-3 py-3" />
          </div>

          <div className="border-b border-idl-tech-chip bg-amber-50/50 px-4 py-3.5 max-lg:space-y-1 lg:grid lg:grid-cols-[2fr_repeat(4,1fr)_1.1fr] lg:items-center lg:px-0">
            <div className="text-[13.5px] font-bold">
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

          {alternativeProducts.length > 0 ? (
            alternativeProducts.slice(0, 3).map((alt) => {
              const altTags = alt.specTags ?? buildTechnicalCardSpecTags({ name: alt.name, shortDescription: alt.shortDescription })
              return (
                <div
                  key={alt.slug}
                  className="border-b border-idl-tech-chip px-4 py-3.5 last:border-b-0 max-lg:space-y-2 lg:grid lg:grid-cols-[2fr_repeat(4,1fr)_1.1fr] lg:items-center lg:px-0"
                >
                  <div className="text-[13.5px] font-semibold">{alt.name}</div>
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
            })
          ) : (
            <div className="px-4 py-8 text-center text-sm text-idl-muted">
              <ProductDetailPlaceholder>Alternative consigliate — in arrivo</ProductDetailPlaceholder>
            </div>
          )}
        </div>
      </SectionContainer>

      {accessoryProducts.length > 0 ? (
        <SectionContainer className="border-t border-idl-tech-chip py-10 sm:py-12">
          <h2 className="text-xl font-extrabold tracking-tight sm:text-[22px]">Accessori compatibili</h2>
          <p className="mt-1.5 text-sm text-idl-muted">Componenti e accessori consigliati per questo prodotto.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accessoryProducts.slice(0, 6).map((item) => (
              <Link
                key={item.slug}
                to={lp(`/prodotto/${item.slug}`)}
                className="rounded-xl border border-idl-tech-border bg-white px-4 py-3 text-sm font-semibold transition hover:border-idl-amber"
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
              <details className="group overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm open:shadow-md" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                  Come verifico che sia il ricambio giusto?
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-idl-amber text-sm text-white group-open:rotate-180">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm leading-relaxed text-idl-muted">
                  {product.shortDescription?.trim() ? (
                    product.shortDescription
                  ) : (
                    <ProductDetailPlaceholder>
                      Controlla attacco, lunghezza e tensione. Nel dubbio inviaci una foto con un righello accanto.
                    </ProductDetailPlaceholder>
                  )}
                </div>
              </details>
              {['Questo prodotto è dimmerabile?', 'Posso sostituire una vecchia alogena?', 'Che differenza c\'è tra le temperature colore?'].map(
                (q) => (
                  <details
                    key={q}
                    className="overflow-hidden rounded-xl border border-idl-tech-border bg-white [&_summary]:flex [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:items-center [&_summary]:justify-between [&_summary]:gap-3 [&_summary]:px-5 [&_summary]:py-4 [&_summary]:text-[15px] [&_summary]:font-bold [&::-webkit-details-marker]:hidden"
                  >
                    <summary>
                      {q}
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-idl-tech-panel text-idl-amber">
                        +
                      </span>
                    </summary>
                    <div className="px-5 pb-5 text-sm text-idl-muted">
                      <ProductDetailPlaceholder>Risposta in preparazione — contattaci per assistenza immediata.</ProductDetailPlaceholder>
                    </div>
                  </details>
                ),
              )}
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
                href={lp('/catalogo')}
                className="flex items-center gap-3 rounded-[10px] border border-idl-tech-chip-border px-4 py-3 text-sm font-bold text-idl-graphite"
              >
                Cerca per EAN o codice →
              </ProductDetailContactLink>
              <ProductDetailContactLink
                href={lp('/contatti')}
                className="flex items-center gap-3 rounded-[10px] border border-idl-tech-chip-border px-4 py-3 text-sm font-bold text-idl-graphite"
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
        addingLabel={t('product.addingToCart')}
        variant="technical"
      />
    </div>
  )
}
