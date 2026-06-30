import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { Loader2Icon } from 'lucide-react'
import { adminAuthStore } from '@/features/auth'
import { useAdminAuth } from '@/context/admin-auth'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

const DEV_EMAIL =
  import.meta.env.VITE_ADMIN_DEV_EMAIL ??
  (import.meta.env.DEV ? 'admin@ideadiluce.local' : '')
const DEV_PASSWORD =
  import.meta.env.VITE_ADMIN_DEV_PASSWORD ??
  (import.meta.env.DEV ? 'admin123456' : '')

export function LoginPage() {
  const { user, login } = useAdminAuth()
  const auth = useSnapshot(adminAuthStore)
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [email, setEmail] = useState(DEV_EMAIL)
  const [password, setPassword] = useState(DEV_PASSWORD)

  if (user) {
    return <Navigate to={location.state?.from ?? '/orders'} replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      navigate(location.state?.from ?? '/orders', { replace: true })
    } catch {
      // error shown via adminAuthStore.error
    }
  }

  return (
    <div className="safe-area-top safe-area-bottom flex min-h-[100dvh] items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <BrandLogo />
          <h1 className="text-2xl font-bold text-gray-900">Accedi al backoffice</h1>
          <p className="text-sm text-gray-500">Inserisci email e password</p>
        </div>

        {auth.error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{auth.error}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={(e) => void onSubmit(e)}>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="email" className="text-sm text-gray-500">
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password" className="text-sm text-gray-500">
                Password
              </FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Button type="submit" disabled={auth.isSubmitting} className="w-full">
              {auth.isSubmitting ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
                  Accesso…
                </>
              ) : (
                'Entra'
              )}
            </Button>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
