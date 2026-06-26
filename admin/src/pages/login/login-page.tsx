import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { toast } from 'sonner'
import { Loader2Icon } from 'lucide-react'
import { adminAuthStore } from '@/features/auth'
import { useAdminAuth } from '@/context/admin-auth'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

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
      toast.success('Benvenuto!', { description: 'Accesso effettuato con successo.' })
      navigate(location.state?.from ?? '/orders', { replace: true })
    } catch {
      /* errore in adminAuthStore.error */
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-100">
      <header className="safe-area-top flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
        <BrandLogo />
      </header>

      <div className="admin-page-canvas grid flex-1 lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <BrandLogo inverted />
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Backoffice Idea di Luce</h2>
            <p className="max-w-md text-sm leading-relaxed text-primary-foreground/80">
              Gestisci il catalogo Product Hub, gli ordini PWA e le impostazioni di spedizione da un
              unico pannello.
            </p>
          </div>
          <p className="text-xs text-primary-foreground/60">© Idea di Luce</p>
        </div>

        <div className="safe-area-bottom flex flex-col items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-md border-gray-200 shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Accedi</CardTitle>
            <CardDescription>Inserisci le credenziali del tuo account backoffice</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {auth.error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>{auth.error}</AlertDescription>
              </Alert>
            ) : null}
            <form onSubmit={(e) => void onSubmit(e)}>
              <FieldGroup>
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
                <Button type="submit" variant="default" disabled={auth.isSubmitting} className="w-full">
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
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
