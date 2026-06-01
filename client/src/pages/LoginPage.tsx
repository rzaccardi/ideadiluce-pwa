import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '@/features/auth'
import { ApiRequestError } from '@/types/api'
import { TextInput } from '@/components/TextInput'
import { Button } from '@/components/Button'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader } from '@/components/PageHeader'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? (err.userMessage ?? err.message) : 'Errore di accesso',
      )
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Accedi" />
      {error ? <ErrorState message={error} className="mb-4" /> : null}
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <TextInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextInput
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          Entra
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Non hai un account?{' '}
        <Link to="/register" className="font-medium text-zinc-900 underline">
          Registrati
        </Link>
      </p>
    </div>
  )
}
