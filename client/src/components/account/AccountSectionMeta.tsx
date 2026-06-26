export function AccountSectionMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-zinc-900">{value}</dd>
    </div>
  )
}
