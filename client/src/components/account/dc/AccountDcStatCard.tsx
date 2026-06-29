type Props = {
  value: string | number
  label: string
}

export function AccountDcStatCard({ value, label }: Props) {
  return (
    <div className="rounded-[14px] border border-idl-tech-border bg-idl-tech-panel p-[22px]">
      <div className="text-[30px] font-extrabold tracking-[-0.02em] text-idl-graphite">{value}</div>
      <div className="mt-0.5 text-[13px] text-idl-muted">{label}</div>
    </div>
  )
}
