export type AdminBrandRow = {
  slug: string
  name: string
  productCount: number
  worlds?: ReadonlyArray<'design' | 'technical'>
  logoLightUrl: string | null
  logoDarkUrl: string | null
  logoLightSource: 'managed' | 'static' | null
  hasLogos: boolean
  updatedAt: string | null
}
