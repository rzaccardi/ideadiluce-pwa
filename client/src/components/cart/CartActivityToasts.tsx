import { useSnapshot } from 'valtio/react'
import { dismissCartToast } from '@/features/cart/cart-feedback'
import { cartFeedbackStore } from '@/features/cart/cart-feedback.store'
import { cn } from '@/utils/cn'

function CartToastIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-600" fill="none">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function CartActivityToasts({ className }: { className?: string }) {
  const { toasts } = useSnapshot(cartFeedbackStore)

  if (toasts.length === 0) return null

  return (
    <div className={cn('flex w-[min(calc(100vw-2.5rem),380px)] flex-col gap-2', className)} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="cart-toast-enter flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg shadow-zinc-950/10"
        >
          {toast.imageUrl ? (
            <img
              src={toast.imageUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-zinc-100"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400">
              —
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-900">
              <CartToastIcon />
              Aggiunto al carrello
            </p>
            <p className="truncate text-sm text-zinc-600">{toast.productName}</p>
            {toast.quantity > 1 ? (
              <p className="text-xs text-zinc-500">Quantità: {toast.quantity}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => dismissCartToast(toast.id)}
            className="shrink-0 rounded-full px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Chiudi notifica"
          >
            Chiudi
          </button>
        </div>
      ))}
    </div>
  )
}
