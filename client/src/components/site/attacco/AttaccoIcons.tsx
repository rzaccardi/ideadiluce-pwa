import type { ComponentType, ReactNode } from 'react'
import type { AttaccoSocketKey } from '@/lib/attacco.defaults'
import { cn } from '@/utils/cn'

type IconProps = { className?: string; size?: number }

function SvgWrap({ children, size = 40, className }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('text-idl-graphite-2', className)}
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function SocketIconE27({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M24 14 H40 V42 L32 50 L24 42 Z" />
      <path d="M24 21 H40 M24 28 H40 M24 35 H40" opacity="0.5" />
      <path d="M29 50 L32 54 L35 50" className="stroke-idl-amber" />
    </SvgWrap>
  )
}

export function SocketIconE14({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M27 14 H37 V42 L32 49 L27 42 Z" />
      <path d="M27 21 H37 M27 28 H37 M27 35 H37" opacity="0.5" />
      <path d="M30 49 L32 52 L34 49" className="stroke-idl-amber" />
    </SvgWrap>
  )
}

export function SocketIconGU10({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M22 16 H42 V30 H22 Z" />
      <path d="M29 30 V44 M35 30 V44" />
      <circle cx="29" cy="47" r="3" className="fill-idl-amber stroke-none" />
      <circle cx="35" cy="47" r="3" className="fill-idl-amber stroke-none" />
    </SvgWrap>
  )
}

export function SocketIconGU53({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M22 16 H42 V30 H22 Z" />
      <path d="M30 30 V48 M34 30 V48" className="stroke-idl-amber" />
    </SvgWrap>
  )
}

export function SocketIconG9({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M24 16 H40 V28 H24 Z" />
      <path d="M29 28 V44 Q29 49 31 44 V28" className="stroke-idl-amber" />
      <path d="M35 28 V44 Q35 49 33 44 V28" className="stroke-idl-amber" />
    </SvgWrap>
  )
}

export function SocketIconG4({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M25 18 H39 V30 H25 Z" />
      <path d="M31 30 V46 M34 30 V46" className="stroke-idl-amber" />
    </SvgWrap>
  )
}

export function SocketIconR7s({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M16 32 H48" />
      <path d="M16 27 V37 M48 27 V37" />
      <path d="M12 32 H16 M48 32 H52" className="stroke-idl-amber" />
    </SvgWrap>
  )
}

export function SocketIconGX53({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <ellipse cx="32" cy="26" rx="16" ry="6" />
      <path d="M16 26 V32 Q16 38 32 38 Q48 38 48 32 V26" />
      <path d="M28 38 V45 M36 38 V45" className="stroke-idl-amber" />
    </SvgWrap>
  )
}

export function SocketIconG13({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M14 27 H46 V37 H14 Z" />
      <path d="M46 30 H52 M46 34 H52" className="stroke-idl-amber" />
    </SvgWrap>
  )
}

export function SocketIcon2G11({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M22 16 H42 V30 H22 Z" />
      <path d="M27 30 V46 M31 30 V46 M37 30 V46" className="stroke-idl-amber" />
    </SvgWrap>
  )
}

export function SocketIconG24({ size = 40, className }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M24 16 H40 V28 H24 Z" />
      <path d="M28 28 V40 L26 46 M36 28 V40 L38 46" className="stroke-idl-amber" />
    </SvgWrap>
  )
}

export function SocketIconAltri({ size = 34, className }: IconProps) {
  return (
    <SvgWrap size={size} className={cn('text-idl-muted', className)}>
      <circle cx="22" cy="24" r="2.4" className="fill-current stroke-none" />
      <circle cx="32" cy="24" r="2.4" className="fill-current stroke-none" />
      <circle cx="42" cy="24" r="2.4" className="fill-current stroke-none" />
      <circle cx="22" cy="34" r="2.4" className="fill-current stroke-none" />
      <circle cx="32" cy="34" r="2.4" className="fill-current stroke-none" />
      <circle cx="42" cy="34" r="2.4" className="fill-current stroke-none" />
    </SvgWrap>
  )
}

const SOCKET_ICONS: Record<AttaccoSocketKey | 'altri', ComponentType<IconProps>> = {
  E27: SocketIconE27,
  E14: SocketIconE14,
  GU10: SocketIconGU10,
  'GU5.3': SocketIconGU53,
  G9: SocketIconG9,
  G4: SocketIconG4,
  R7s: SocketIconR7s,
  GX53: SocketIconGX53,
  G13: SocketIconG13,
  '2G11': SocketIcon2G11,
  G24: SocketIconG24,
  altri: SocketIconAltri,
}

export function AttaccoSocketIcon({
  icon,
  size = 40,
  className,
}: {
  icon: AttaccoSocketKey | 'altri'
  size?: number
  className?: string
}) {
  const Comp = SOCKET_ICONS[icon]
  return <Comp size={size} className={className} />
}

function ShapeSvg({ children, className, tall = true }: { children: ReactNode; className?: string; tall?: boolean }) {
  return (
    <svg
      viewBox={tall ? '0 0 64 80' : '0 0 64 64'}
      width={tall ? 50 : 56}
      height={tall ? 62 : 40}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('text-idl-graphite-2', className)}
      aria-hidden
    >
      {children}
    </svg>
  )
}

const SHAPE_ICONS: Record<string, ComponentType> = {
  goccia: () => (
    <ShapeSvg>
      <path d="M32 8 C18 8 14 20 14 30 C14 40 22 44 24 50 H40 C42 44 50 40 50 30 C50 20 46 8 32 8 Z" />
      <path d="M24 50 H40 M25 54 H39 M27 58 H37" className="stroke-idl-amber" />
    </ShapeSvg>
  ),
  sfera: () => (
    <ShapeSvg>
      <circle cx="32" cy="28" r="18" />
      <path d="M24 46 H40 M25 50 H39 M27 54 H37" className="stroke-idl-amber" />
    </ShapeSvg>
  ),
  candela: () => (
    <ShapeSvg>
      <path d="M32 6 C28 14 26 18 26 26 C26 36 26 42 27 48 H37 C38 42 38 36 38 26 C38 18 36 14 32 6 Z" />
      <path d="M27 48 H37 M28 52 H36 M29 56 H35" className="stroke-idl-amber" />
    </ShapeSvg>
  ),
  tubolare: () => (
    <ShapeSvg>
      <path d="M26 8 Q32 4 38 8 V46 H26 Z" />
      <path d="M26 46 H38 M27 50 H37 M28 54 H36" className="stroke-idl-amber" />
    </ShapeSvg>
  ),
  riflettore: () => (
    <ShapeSvg>
      <path d="M18 14 Q32 8 46 14 L40 44 H24 Z" />
      <path d="M18 14 Q32 22 46 14" opacity="0.5" />
      <path d="M24 44 H40 M26 48 H38 M28 52 H36" className="stroke-idl-amber" />
    </ShapeSvg>
  ),
  globo: () => (
    <ShapeSvg>
      <circle cx="32" cy="26" r="22" />
      <path d="M25 48 H39 M27 52 H37" className="stroke-idl-amber" />
    </ShapeSvg>
  ),
  spot: () => (
    <ShapeSvg>
      <path d="M20 12 H44 L38 40 H26 Z" />
      <path d="M26 40 H38" opacity="0.8" />
      <path d="M30 40 V48 M34 40 V48" className="stroke-idl-amber" />
    </ShapeSvg>
  ),
  lineare: () => (
    <ShapeSvg tall={false}>
      <path d="M12 32 H52" />
      <path d="M12 27 V37 M52 27 V37" />
      <path d="M8 32 H12 M52 32 H56" className="stroke-idl-amber" />
    </ShapeSvg>
  ),
  filamento: () => (
    <ShapeSvg>
      <path d="M32 8 C20 8 16 18 16 28 C16 38 24 42 25 48 H39 C40 42 48 38 48 28 C48 18 44 8 32 8 Z" />
      <path d="M27 20 V36 M32 18 V38 M37 20 V36" className="stroke-idl-amber" opacity="0.9" />
      <path d="M25 48 H39" />
    </ShapeSvg>
  ),
  altri: () => <SocketIconAltri size={34} />,
}

export function AttaccoShapeIcon({ icon }: { icon: string }) {
  const Comp = SHAPE_ICONS[icon] ?? SHAPE_ICONS.altri
  return <Comp />
}

export function WizardSocketIcon({ socket }: { socket: AttaccoSocketKey }) {
  return <AttaccoSocketIcon icon={socket} size={48} />
}
