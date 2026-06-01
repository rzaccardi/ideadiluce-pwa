import { useEffect, useState } from 'react'

type Props = {
  images: readonly string[]
  alt: string
  activeUrl?: string | null
}

export function ProductGallery({ images, alt, activeUrl }: Props) {
  const base = images.length ? images : activeUrl ? [activeUrl] : []
  const [selected, setSelected] = useState(base[0] ?? '')

  const baseKey = base.join('\0')

  useEffect(() => {
    if (activeUrl && base.includes(activeUrl)) {
      setSelected(activeUrl)
      return
    }
    if (base.length && !base.includes(selected)) {
      setSelected(base[0])
    }
  }, [activeUrl, baseKey, base, selected])

  if (!base.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
        Anteprima
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-xl bg-zinc-100">
        <img src={selected || base[0]} alt={alt} className="h-full w-full object-cover" />
      </div>
      {base.length > 1 ? (
        <ul className="flex flex-wrap gap-2">
          {base.map((url) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setSelected(url)}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                  (selected || base[0]) === url ? 'border-zinc-900' : 'border-transparent'
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
