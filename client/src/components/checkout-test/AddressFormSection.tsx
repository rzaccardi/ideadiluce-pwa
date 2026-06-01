import { TextInput } from '@/components/TextInput'
import type { AddressInput } from '@/types/integrations'

type Props = {
  title: string
  prefix: string
  address: AddressInput
  disabled?: boolean
  onChange: <K extends keyof AddressInput>(key: K, value: AddressInput[K]) => void
}

export function AddressFormSection({ title, prefix, address, disabled, onChange }: Props) {
  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <h3 className="mb-3 text-sm font-medium text-zinc-800">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput
          label="Nome"
          name={`${prefix}-firstName`}
          value={address.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          disabled={disabled}
          autoComplete="given-name"
        />
        <TextInput
          label="Cognome"
          name={`${prefix}-lastName`}
          value={address.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          disabled={disabled}
          autoComplete="family-name"
        />
        <TextInput
          label="Indirizzo (riga 1)"
          name={`${prefix}-line1`}
          value={address.line1}
          onChange={(e) => onChange('line1', e.target.value)}
          disabled={disabled}
          autoComplete="address-line1"
          className="sm:col-span-2"
        />
        <TextInput
          label="Indirizzo (riga 2) — opz."
          name={`${prefix}-line2`}
          value={address.line2 ?? ''}
          onChange={(e) => onChange('line2', e.target.value)}
          disabled={disabled}
          autoComplete="address-line2"
          className="sm:col-span-2"
        />
        <TextInput
          label="Città"
          name={`${prefix}-city`}
          value={address.city}
          onChange={(e) => onChange('city', e.target.value)}
          disabled={disabled}
          autoComplete="address-level2"
        />
        <TextInput
          label="CAP"
          name={`${prefix}-postalCode`}
          value={address.postalCode}
          onChange={(e) => onChange('postalCode', e.target.value)}
          disabled={disabled}
          autoComplete="postal-code"
        />
        <TextInput
          label="Paese (ISO2)"
          name={`${prefix}-country`}
          value={address.country}
          onChange={(e) => onChange('country', e.target.value.toUpperCase().slice(0, 2))}
          disabled={disabled}
          autoComplete="country"
          maxLength={2}
        />
        <TextInput
          label="Telefono — opz."
          name={`${prefix}-phone`}
          type="tel"
          value={address.phone ?? ''}
          onChange={(e) => onChange('phone', e.target.value)}
          disabled={disabled}
          autoComplete="tel"
        />
      </div>
    </div>
  )
}
