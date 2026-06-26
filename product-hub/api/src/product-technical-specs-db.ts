import {
  emptyTechnicalSpecs,
  type ProductTechnicalSpecs,
  TECH_SPEC_FIELDS,
} from './product-technical-specs.js'

export type TechnicalSpecRowInput = {
  specsIntro: string | null
} & Record<(typeof TECH_SPEC_FIELDS)[number], string | null>

export function technicalSpecsFromRow(
  row: TechnicalSpecRowInput | null | undefined,
): ProductTechnicalSpecs | null {
  if (!row) return null
  const specs = emptyTechnicalSpecs()
  specs.specsIntro = row.specsIntro
  for (const key of TECH_SPEC_FIELDS) {
    specs[key] = row[key]
  }
  return specs
}

export function technicalSpecsToPrismaData(
  specs: Partial<ProductTechnicalSpecs>,
): Omit<ProductTechnicalSpecs, 'specsIntro'> & { specsIntro?: string | null } {
  const data: Record<string, string | null | undefined> = {}
  if (specs.specsIntro !== undefined) data.specsIntro = specs.specsIntro?.trim() || null
  for (const key of TECH_SPEC_FIELDS) {
    if (specs[key] !== undefined) data[key] = specs[key]?.trim() || null
  }
  return data as ReturnType<typeof technicalSpecsToPrismaData>
}
