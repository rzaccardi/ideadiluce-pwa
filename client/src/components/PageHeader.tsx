type Props = {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-idl-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-idl-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  )
}
