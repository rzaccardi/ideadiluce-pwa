'use client'

import { Link } from '@/lib/navigation'
import { toast } from 'sonner'
import type { ProductCardDTO } from '@/types/dto'
import { useLocale } from '@/context/locale-context'
import { addItem } from '@/features/cart'
import { removeWishlistItem } from '@/features/wishlist'
import { formatMoney } from '@/lib/format'
import { SiteImage } from '@/components/site/SiteImage'
import { useI18n } from '@/hooks/use-i18n'
import { accountDcPrimaryBtnClass } from './account-dc-styles'

type Props = {
  itemId: string
  productRef: string
  variantRef: string | null
  product: ProductCardDTO | null
  unavailable?: boolean
}

export function AccountDcPartCard({
  itemId,
  productRef,
  variantRef,
  product,
  unavailable = false,
}: Props) {
  const { localize } = useLocale()
  const { t } = useI18n()

  async function handleReorder() {
    if (!product) return
    try {
      await addItem(product.slug, 1, variantRef ?? undefined)
      toast.success(t('orders.reorder.success'))
    } catch (e) {
      toast.error(String(e))
    }
  }

  if (unavailable || !product) {
    return (
      <article className="rounded-[10px] border border-idl-tech-border bg-white p-3.5 dark:bg-idl-tech-panel">
        <div className="mb-3 flex aspect-square items-center justify-center rounded-md bg-idl-tech-panel text-center text-xs text-idl-muted">
          {t('wishlist.item.unavailable')}
        </div>
        <div className="font-mono text-[10px] text-[#8b919b]">{productRef}</div>
        <button
          type="button"
          onClick={() => void removeWishlistItem(itemId)}
          className="mt-3 text-xs font-bold text-[#9298a3]"
        >
          {t('common.remove')}
        </button>
      </article>
    )
  }

  const brandLine = productRef

  return (
    <article className="rounded-[10px] border border-idl-tech-border bg-white p-3.5 dark:bg-idl-tech-panel">
      <Link to={localize(`/prodotto/${product.slug}`)} className="block">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-idl-tech-panel">
          {product.imageUrl ? (
            <SiteImage src={product.imageUrl} alt="" fill className="object-cover" sizes="200px" />
          ) : null}
        </div>
      </Link>
      {brandLine ? (
        <div className="mb-1 font-mono text-[10px] text-[#8b919b]">{brandLine}</div>
      ) : null}
      <Link
        to={localize(`/prodotto/${product.slug}`)}
        className="mb-2.5 block min-h-[34px] text-[13px] font-semibold leading-snug text-idl-graphite no-underline hover:underline"
      >
        {product.name}
      </Link>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-extrabold text-idl-graphite">
          {formatMoney(product.priceCents, product.currency)}
        </span>
        <button
          type="button"
          disabled={product.inStock === false}
          onClick={() => void handleReorder()}
          className={`${accountDcPrimaryBtnClass} !px-3 !py-1.5 !text-xs`}
        >
          {t('account.orders.reorder')}
        </button>
      </div>
    </article>
  )
}
