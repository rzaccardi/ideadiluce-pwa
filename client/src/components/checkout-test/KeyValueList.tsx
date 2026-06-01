import type { ReactNode } from 'react'

export type KeyValueRow = { label: string; value: ReactNode }

export function KeyValueList({ rows }: { rows: KeyValueRow[] }) {
  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-[minmax(10rem,auto)_1fr] sm:gap-x-4">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="border-b border-zinc-100 pb-1 text-zinc-500 sm:border-0 sm:pb-0">{r.label}</dt>
          <dd className="border-b border-zinc-100 pb-2 font-medium text-zinc-900 break-words sm:pb-1">
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
