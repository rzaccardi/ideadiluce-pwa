import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { authStore, setAuthUser } from '@/features/auth'
import { api } from '@/api/endpoints'
import { ApiRequestError } from '@/types/api'
import { TextInput } from '@/components/TextInput'
import { Button } from '@/components/Button'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader } from '@/components/PageHeader'

export function AccountPage() {
  const auth = useSnapshot(authStore)
  const [firstName, setFirstName] = useState(auth.me?.firstName ?? '')
  const [lastName, setLastName] = useState(auth.me?.lastName ?? '')
  const [phone, setPhone] = useState(auth.me?.phone ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth.me) return
    setFirstName(auth.me.firstName ?? '')
    setLastName(auth.me.lastName ?? '')
    setPhone(auth.me.phone ?? '')
  }, [auth.me])

  if (!auth.me) {
    return null
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    try {
      const { user } = await api.users.patchMe({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || null,
      })
      setAuthUser(user)
      setMessage('Profilo aggiornato.')
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? (err.userMessage ?? err.message) : 'Salvataggio fallito',
      )
    }
  }

  return (
    <div>
      <PageHeader title="Profilo" description="Dati salvati sul backend via PATCH /api/v1/users/me." />
      {error ? <ErrorState message={error} className="mb-4" /> : null}
      {message ? <p className="mb-4 text-sm text-emerald-700">{message}</p> : null}
      <form onSubmit={(e) => void save(e)} className="max-w-md space-y-4">
        <TextInput label="Email" name="email" value={auth.me.email} disabled />
        <TextInput label="Nome" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <TextInput label="Cognome" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <TextInput label="Telefono" name="phone" value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} />
        <Button type="submit">Salva</Button>
      </form>
    </div>
  )
}
