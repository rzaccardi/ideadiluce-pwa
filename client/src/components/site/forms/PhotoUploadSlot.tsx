'use client'

import { useRef } from 'react'
import { cn } from '@/utils/cn'

type Props = {
  id: string
  label: string
  hint: string
  file: File | null
  previewUrl: string | null
  onPick: (file: File | null) => void
}

export function PhotoUploadSlot({ id, label, hint, file, previewUrl, onPick }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <div className="mb-2.5 font-mono text-[10.5px] tracking-[0.1em] text-idl-muted uppercase">
        {label}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex aspect-[3/2] w-full flex-col items-center justify-center overflow-hidden rounded-[10px]',
          'border-[1.5px] border-dashed border-[#d4d9df] bg-[#fafbfc] text-center transition hover:border-idl-amber/50',
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- anteprima locale da File
          <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-[13px] leading-snug text-idl-muted">{hint}</span>
        )}
        {file ? (
          <span className="absolute bottom-2 rounded-md bg-idl-ink/75 px-2 py-1 text-[11px] font-semibold text-white">
            {file.name}
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
