import type { ContentBlock } from '@/types/site-content'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'

type ContactBlock = Extract<ContentBlock, { kind: 'contact' }>

type Props = {
  block: ContactBlock
  className?: string
}

export function ContactPanel({ block, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-idl-tech-border bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-7',
        className,
      )}
    >
      <h2 className="text-lg font-bold tracking-tight text-idl-ink">Dati aziendali</h2>
      <div className="mt-5 space-y-5">
        <div>
          {block.company ? (
            <div className="font-serif text-xl text-idl-ink">{block.company}</div>
          ) : null}
          {block.vat ? <p className="mt-1.5 text-sm text-idl-muted">P.IVA {block.vat}</p> : null}
          {block.rea ? <p className="text-sm text-idl-muted">REA {block.rea}</p> : null}
          {block.address ? (
            <p className="mt-4 text-sm leading-relaxed text-idl-graphite">{block.address}</p>
          ) : null}
        </div>

        <div className="space-y-4 border-t border-idl-border/80 pt-5 text-sm">
          {block.phone ? (
            <div>
              <span className={ui.labelSm}>Telefono</span>
              <p className="mt-1">
                <a
                  href={block.phoneHref ?? `tel:${block.phone}`}
                  className="font-semibold text-idl-brass transition hover:text-idl-amber"
                >
                  {block.phone}
                </a>
              </p>
            </div>
          ) : null}
          {block.email ? (
            <div>
              <span className={ui.labelSm}>Email</span>
              <p className="mt-1">
                <a
                  href={`mailto:${block.email}`}
                  className="font-semibold text-idl-brass transition hover:text-idl-amber"
                >
                  {block.email}
                </a>
              </p>
            </div>
          ) : null}
          {block.hours ? (
            <div>
              <span className={ui.labelSm}>Orari</span>
              <p className="mt-1 text-idl-graphite">{block.hours}</p>
            </div>
          ) : null}
        </div>

        {block.whatsapp ? (
          <div className="flex flex-wrap gap-3 border-t border-idl-border/80 pt-5">
            <a
              href={block.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1f9d57] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#188a4a]"
            >
              WhatsApp
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}
