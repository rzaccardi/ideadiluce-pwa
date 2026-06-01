import { Link, NavLink } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { cartStore } from '@/features/cart'
import { logout } from '@/features/auth'
import { cn } from '@/utils/cn'
import { Container } from '@/components/Container'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm font-medium transition',
    isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800',
  )

export function Header() {
  const auth = useSnapshot(authStore)
  const cart = useSnapshot(cartStore)

  return (
    <header className="border-b border-zinc-200 bg-white">
      <Container className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight text-zinc-900">
          Idea di Luce
        </Link>
        <nav className="flex flex-wrap items-center gap-4 md:justify-center">
          <NavLink to="/catalog" className={navClass}>
            Catalogo
          </NavLink>
          <NavLink to="/wishlist" className={navClass}>
            Preferiti
          </NavLink>
          <NavLink to="/cart" className={navClass}>
            Carrello
            {cart.cart && cart.cart.itemCount > 0 ? (
              <span className="ml-1 rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">
                {cart.cart.itemCount}
              </span>
            ) : null}
          </NavLink>
          <NavLink to="/checkout" className={navClass}>
            Checkout
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          {auth.isAuthenticated ? (
            <>
              <NavLink to="/account" className={navClass}>
                Account
              </NavLink>
              <button
                type="button"
                onClick={() => void logout()}
                className="text-sm text-zinc-500 hover:text-zinc-800"
              >
                Esci
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                Accedi
              </NavLink>
              <Link
                to="/register"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Registrati
              </Link>
            </>
          )}
        </div>
      </Container>
    </header>
  )
}
