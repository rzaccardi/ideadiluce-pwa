import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/features/auth'
import { ApiRequestError } from '@/types/api'
import { TextInput } from '@/components/TextInput'
import { Button } from '@/components/Button'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader } from '@/components/PageHeader'

export function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await register(email, password, {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? (err.userMessage ?? err.message) : 'Registrazione non riuscita',
      )
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Crea account" />
      {error ? <ErrorState message={error} className="mb-4" /> : null}
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <TextInput label="Nome" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <TextInput
          label="Cognome"
          name="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
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
          label="Password (min 8 caratteri)"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <Button type="submit" className="w-full">
          Registrati
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Hai già un account?{' '}
        <Link to="/login" className="font-medium text-zinc-900 underline">
          Accedi
        </Link>
      </p>
    </div>
  )
}
