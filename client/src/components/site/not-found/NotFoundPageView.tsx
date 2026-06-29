'use client'

import { Link } from '@/lib/navigation'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'

function BulbIcon() {
  return (
    <svg
      className="idl-bulb-glow animate-[idl-bulb-pulse_3s_ease-in-out_infinite]"
      viewBox="0 0 120 150"
      width={118}
      height={148}
      style={{ filter: 'drop-shadow(0 0 40px rgba(201, 162, 75,.45))' }}
      aria-hidden
    >
      <path
        d="M60 14 q34 0 34 38 q0 22 -18 35 v14 h-32 v-14 q-18 -13 -18 -35 q0 -38 34 -38Z"
        fill="#c9a24b"
      />
      <path
        d="M46 70 q14 12 28 0"
        fill="none"
        stroke="#0c0c0d"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M52 52 v22 M68 52 v22"
        stroke="#0c0c0d"
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.5}
      />
      <rect x={44} y={101} width={32} height={7} rx={2} fill="#cdbfa5" />
      <rect x={46} y={110} width={28} height={6} rx={2} fill="#b3a890" />
      <rect x={48} y={118} width={24} height={6} rx={2} fill="#b0b0b4" />
    </svg>
  )
}

type HoverButtonProps = {
  href: string
  children: React.ReactNode
  variant: 'primary' | 'secondary'
}

function HoverLinkButton({ href, children, variant }: HoverButtonProps) {
  const baseStyle =
    variant === 'primary'
      ? {
          background: '#c9a24b',
          color: '#0c0c0d',
          fontSize: '15px',
          fontWeight: 700,
          padding: '15px 26px',
          borderRadius: '8px',
          textDecoration: 'none' as const,
        }
      : {
          background: 'transparent',
          color: '#f1e8d8',
          fontSize: '15px',
          fontWeight: 600,
          padding: '14px 26px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,.22)',
          textDecoration: 'none' as const,
        }

  const hoverStyle =
    variant === 'primary'
      ? { background: '#f7bd6f' }
      : { borderColor: '#c9a24b', color: '#c9a24b' }

  return (
    <Link
      to={href}
      style={baseStyle}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, baseStyle)}
    >
      {children}
    </Link>
  )
}

export function NotFoundPageView() {
  const { t } = useI18n()
  const lp = useLocalePath()

  return (
    <>
      <style>{`
        @keyframes idl-bulb-pulse {
          0%, 100% { filter: drop-shadow(0 0 40px rgba(201, 162, 75,.45)); }
          50% { filter: drop-shadow(0 0 56px rgba(201, 162, 75,.65)); }
        }
        @keyframes idl-glow-drift {
          0%, 100% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0.85; transform: translateX(12px); }
        }
        .idl-glow { animation: idl-glow-drift 8s ease-in-out infinite; }
      `}</style>

      <div
        style={{
          width: '100%',
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: '#0c0c0d',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Hanken Grotesk',system-ui,sans-serif",
        }}
      >
        <div
          className="idl-glow"
          style={{
            position: 'absolute',
            top: -120,
            left: '50%',
            marginLeft: -300,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background:
              'radial-gradient(circle,rgba(201, 162, 75,.22) 0%,rgba(201, 162, 75,.05) 42%,rgba(201, 162, 75,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '60px 32px 80px',
          }}
        >
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <BulbIcon />
          </div>

          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: '12px',
              letterSpacing: '.28em',
              color: '#c9a24b',
              marginBottom: 22,
            }}
          >
            {t('notFound.eyebrow')}
          </div>

          <h1
            style={{
              fontFamily: "'Newsreader',serif",
              fontSize: '52px',
              lineHeight: 1.05,
              fontWeight: 500,
              letterSpacing: '-.01em',
              maxWidth: 680,
              color: '#f1e8d8',
              margin: '0 0 18px',
            }}
          >
            {t('notFound.title')}
          </h1>

          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.55,
              color: '#b0b0b4',
              maxWidth: 520,
              marginBottom: 36,
            }}
          >
            {t('notFound.description')}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
            }}
          >
            <HoverLinkButton href={lp('/')} variant="primary">
              {t('notFound.backHome')}
            </HoverLinkButton>
            <HoverLinkButton href={lp('/negozio')} variant="secondary">
              {t('notFound.exploreCatalog')}
            </HoverLinkButton>
          </div>
        </div>
      </div>
    </>
  )
}
