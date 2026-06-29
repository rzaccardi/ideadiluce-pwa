type Props = {
  label: string
  value: string
}

export function AccountDcDetailRow({ label, value }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-[#ededea] py-3 first:border-t-0 first:pt-0">
      <dt className="text-sm text-idl-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-idl-graphite">{value}</dd>
    </div>
  )
}
