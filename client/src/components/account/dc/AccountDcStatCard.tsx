type Props = {
  value: string | number
  label: string
}

export function AccountDcStatCard({ value, label }: Props) {
  return (
    <div className="rounded-[14px] border border-[#e7eaee] bg-white p-[22px]">
      <div className="text-[30px] font-extrabold tracking-[-0.02em] text-[#14161b]">{value}</div>
      <div className="mt-0.5 text-[13px] text-[#6c727c]">{label}</div>
    </div>
  )
}
