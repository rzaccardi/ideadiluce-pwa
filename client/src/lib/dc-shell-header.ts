export type DcHeaderActive =
  | 'none'
  | 'arredo'
  | 'tecnico'
  | 'attacco'
  | 'ambienti'
  | 'brand'
  | 'guide'

export function resolveDcHeaderVars(html: string, active: DcHeaderActive = 'none'): string {
  const A = '#3a3a3d'
  const T = '#0c0c0d'
  const N = 'transparent'
  const ink = '#3a3a3d'

  const ddCol = (key: DcHeaderActive, accent: string) => (active === key ? accent : ink)
  const ddUnd = (key: DcHeaderActive, accent: string) => (active === key ? accent : N)
  const lkCol = (key: DcHeaderActive) => (active === key ? A : ink)
  const lkUnd = (key: DcHeaderActive) => (active === key ? A : N)

  const colors: Record<string, string> = {
    cArredo: ddCol('arredo', A),
    uArredo: ddUnd('arredo', A),
    cTecnico: ddCol('tecnico', T),
    uTecnico: ddUnd('tecnico', T),
    cAttacco: ddCol('attacco', T),
    uAttacco: ddUnd('attacco', T),
    cAmbienti: lkCol('ambienti'),
    uAmbienti: lkUnd('ambienti'),
    cBrand: lkCol('brand'),
    uBrand: lkUnd('brand'),
    cGuide: lkCol('guide'),
    uGuide: lkUnd('guide'),
  }

  let out = html
  for (const [key, value] of Object.entries(colors)) {
    out = out.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value)
  }
  return out.replace(/\s*onClick="\{\{[^"]+\}\}"/gi, '')
}
