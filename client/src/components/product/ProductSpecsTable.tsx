import { ProductDescriptionHtml } from '@/components/product/ProductDescriptionHtml'
import { cn } from '@/utils/cn'

const TABLE_CLASS_COMPACT =
  'product-description max-w-none text-sm text-idl-muted [&_table]:my-0 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-idl-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-idl-border [&_th]:bg-idl-cream [&_th]:px-3 [&_th]:py-2'

const TABLE_CLASS_FULL =
  'product-description max-w-none text-sm leading-relaxed text-idl-muted [&_p]:mb-4 [&_p]:text-idl-ink-soft [&_table]:my-0 [&_table]:w-full [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-idl-border [&_table]:border-collapse [&_td]:border-b [&_td]:border-idl-border [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_td:first-child]:w-[42%] [&_td:first-child]:font-medium [&_td:first-child]:text-idl-graphite [&_tr:last-child_td]:border-b-0 [&_tr:nth-child(odd)]:bg-idl-cream/80 [&_th]:border [&_th]:border-idl-border [&_th]:bg-idl-cream [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-idl-graphite'

type Props = {
  html: string
  title?: string
  compact?: boolean
  className?: string
}

export function ProductSpecsTable({ html, title, compact, className }: Props) {
  return (
    <div className={cn(compact ? 'text-sm' : '', className)}>
      {title ? (
        <h3 className={cn('font-semibold text-idl-graphite', compact ? 'mb-2 text-sm' : 'mb-3 text-base')}>
          {title}
        </h3>
      ) : null}
      <ProductDescriptionHtml
        html={html}
        className={compact ? TABLE_CLASS_COMPACT : TABLE_CLASS_FULL}
      />
    </div>
  )
}
