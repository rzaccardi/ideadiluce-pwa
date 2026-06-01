import { TextInput } from '@/components/TextInput'
import { cn } from '@/utils/cn'

type Props = Omit<React.ComponentProps<typeof TextInput>, 'type' | 'label'> & {
  label?: string
}

/** Input numerico per quantità carrello / PDP. */
export function QuantityInput({ label = 'Quantità', min = 1, className, ...props }: Props) {
  return (
    <TextInput
      label={label}
      type="number"
      min={min}
      className={cn('w-24', className)}
      {...props}
    />
  )
}
