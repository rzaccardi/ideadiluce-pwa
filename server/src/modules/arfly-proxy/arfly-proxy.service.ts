import {
  ArflyClientError,
  fetchArflyProductBySlug,
  fetchArflyProductDetail,
  fetchArflyProductList,
} from '../../adapters/arfly/arflyClient.js'
import { parseHubLocale, type HubLocale } from '../../lib/hub-locale.js'
import { buildTechnicalCardSpecTagsFromSpecs } from '../../lib/technical-card-spec-tags.js'

function langFromQuery(locale?: string, lang?: string): HubLocale {
  if (lang?.includes('_')) {
    const code = lang.split('_')[0]?.toUpperCase()
    if (code === 'IT' || code === 'EN' || code === 'ES' || code === 'FR' || code === 'DE') {
      return code
    }
  }
  return parseHubLocale(locale)
}

function pricingFromQuery(query: Record<string, string | undefined>) {
  const partnerId = query.partner_id ? Number(query.partner_id) : undefined
  const pricelistId = query.pricelist_id ? Number(query.pricelist_id) : undefined
  return {
    partnerId: partnerId != null && partnerId > 0 ? partnerId : undefined,
    pricelistId: pricelistId != null && pricelistId > 0 ? pricelistId : undefined,
  }
}

export async function proxyArflyProductList(query: {
  locale?: string
  lang?: string
  page?: string
  pageSize?: string
  per_page?: string
  q?: string
  category?: string
  brand?: string
  partner_id?: string
  pricelist_id?: string
  website?: string
}) {
  const locale = langFromQuery(query.locale, query.lang)
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(60, Math.max(1, Number(query.per_page ?? query.pageSize) || 24))
  const pricing = pricingFromQuery(query)

  const list = await fetchArflyProductList({
    locale,
    page,
    perPage,
    q: query.q,
    category: query.category,
    brand: query.brand,
    partnerId: pricing.partnerId,
    pricelistId: pricing.pricelistId,
  })

  const items = await Promise.all(
    list.items.map(async (item) => {
      if (item.spec_tags?.length) return item
      try {
        const detail = await fetchArflyProductDetail(item.id, locale, pricing)
        const specTags = buildTechnicalCardSpecTagsFromSpecs(detail.product.specs ?? [])
        return specTags.length ? { ...item, spec_tags: specTags } : item
      } catch {
        return item
      }
    }),
  )

  return { ...list, items }
}

export async function proxyArflyProductDetail(
  productId: number,
  query: {
    locale?: string
    lang?: string
    partner_id?: string
    pricelist_id?: string
    website?: string
  },
) {
  const locale = langFromQuery(query.locale, query.lang)
  const pricing = pricingFromQuery(query)
  return fetchArflyProductDetail(productId, locale, pricing)
}

export async function proxyArflyProductBySlug(
  slug: string,
  query: {
    locale?: string
    lang?: string
    partner_id?: string
    pricelist_id?: string
    website?: string
  },
) {
  const locale = langFromQuery(query.locale, query.lang)
  const pricing = pricingFromQuery(query)
  const bySlug = await fetchArflyProductBySlug(slug, locale, pricing)
  if (bySlug) return bySlug
  throw new ArflyClientError(`Prodotto non trovato per slug ${slug}`, 404)
}

export { ArflyClientError }
