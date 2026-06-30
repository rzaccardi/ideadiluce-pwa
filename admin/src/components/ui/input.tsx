import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function PasswordToggleButton({
  show,
  onToggle,
}: {
  show: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? "Nascondi password" : "Mostra password"}
      className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
    >
      {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
    </button>
  )
}

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const [showPassword, setShowPassword] = React.useState(false)
  const isPassword = type === "password"
  const resolvedType = isPassword && showPassword ? "text" : type

  const input = (
    <InputPrimitive
      type={resolvedType}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm",
        isPassword && "pr-10",
        className
      )}
      {...props}
    />
  )

  if (!isPassword) {
    return input
  }

  return (
    <div className="relative w-full">
      {input}
      <PasswordToggleButton show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
    </div>
  )
}

export { Input }
