/**
 * Verifica matrice IVA attesa vs regole DB (seed default).
 * Uso: cd server && npx tsx scripts/tax-matrix-verify.ts
 */
import { prisma } from '../src/lib/prisma.js'
import { findMatchingTaxRule } from '../src/modules/tax/tax.service.js'
import type { CustomerSegment } from '@prisma/client'

type Scenario = {
  name: string
  shippingCountry: string
  customerSegment?: CustomerSegment
  vatValid?: boolean
  expectedRate: number
  expectedLabelIncludes?: string
}

const SCENARIOS: Scenario[] = [
  { name: 'IT retail', shippingCountry: 'IT', customerSegment: 'RETAIL', expectedRate: 22 },
  { name: 'IT business senza VAT valid', shippingCountry: 'IT', customerSegment: 'BUSINESS', expectedRate: 22 },
  {
    name: 'IT business VAT valid',
    shippingCountry: 'IT',
    customerSegment: 'BUSINESS',
    vatValid: true,
    expectedRate: 22,
  },
  {
    name: 'IT business VAT valid ship IT',
    shippingCountry: 'IT',
    customerSegment: 'BUSINESS',
    vatValid: true,
    expectedRate: 22,
  },
  {
    name: 'DE B2B VAT invalid',
    shippingCountry: 'DE',
    customerSegment: 'BUSINESS',
    vatValid: false,
    expectedRate: 22,
  },
  {
    name: 'FR B2B reverse charge',
    shippingCountry: 'FR',
    customerSegment: 'BUSINESS',
    vatValid: true,
    expectedRate: 0,
    expectedLabelIncludes: 'Reverse',
  },
  { name: 'FR retail EU', shippingCountry: 'FR', customerSegment: 'RETAIL', expectedRate: 22 },
  {
    name: 'US extra-EU',
    shippingCountry: 'US',
    customerSegment: 'RETAIL',
    expectedRate: 0,
    expectedLabelIncludes: 'Esente',
  },
]

async function main() {
  const rules = await prisma.taxRule.findMany({ orderBy: { priority: 'desc' } })
  if (rules.length === 0) {
    console.error('Nessuna TaxRule in DB — esegui prima db:seed')
    process.exit(1)
  }

  let failed = 0
  for (const scenario of SCENARIOS) {
    const rule = findMatchingTaxRule(rules, {
      netCents: 10_000,
      shippingCountry: scenario.shippingCountry,
      customerSegment: scenario.customerSegment,
      vatValid: scenario.vatValid,
    })
    const rate = rule ? Number(rule.taxRatePct) : scenario.shippingCountry === 'US' ? 0 : 22
    const label = rule?.taxLabel ?? ''
    const rateOk = rate === scenario.expectedRate
    const labelOk = !scenario.expectedLabelIncludes || label.includes(scenario.expectedLabelIncludes)
    const ok = rateOk && labelOk
    if (!ok) {
      failed += 1
      console.error(`FAIL ${scenario.name}: rate=${rate} label="${label}" ruleId=${rule?.id ?? 'fallback'}`)
    } else {
      console.log(`OK   ${scenario.name}: ${rate}% ${label}`)
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} scenario/i falliti su ${SCENARIOS.length}`)
    process.exit(1)
  }
  console.log(`\nTutti i ${SCENARIOS.length} scenari IVA passati.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
