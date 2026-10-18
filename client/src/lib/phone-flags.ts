import flagAe from 'circle-flags/flags/ae.svg'
import flagAt from 'circle-flags/flags/at.svg'
import flagAu from 'circle-flags/flags/au.svg'
import flagBe from 'circle-flags/flags/be.svg'
import flagBg from 'circle-flags/flags/bg.svg'
import flagBr from 'circle-flags/flags/br.svg'
import flagCa from 'circle-flags/flags/ca.svg'
import flagCh from 'circle-flags/flags/ch.svg'
import flagCy from 'circle-flags/flags/cy.svg'
import flagCz from 'circle-flags/flags/cz.svg'
import flagDe from 'circle-flags/flags/de.svg'
import flagDk from 'circle-flags/flags/dk.svg'
import flagEe from 'circle-flags/flags/ee.svg'
import flagEs from 'circle-flags/flags/es.svg'
import flagFi from 'circle-flags/flags/fi.svg'
import flagFr from 'circle-flags/flags/fr.svg'
import flagGb from 'circle-flags/flags/gb.svg'
import flagGr from 'circle-flags/flags/gr.svg'
import flagHk from 'circle-flags/flags/hk.svg'
import flagHr from 'circle-flags/flags/hr.svg'
import flagHu from 'circle-flags/flags/hu.svg'
import flagIe from 'circle-flags/flags/ie.svg'
import flagIl from 'circle-flags/flags/il.svg'
import flagIt from 'circle-flags/flags/it.svg'
import flagJp from 'circle-flags/flags/jp.svg'
import flagLt from 'circle-flags/flags/lt.svg'
import flagLu from 'circle-flags/flags/lu.svg'
import flagLv from 'circle-flags/flags/lv.svg'
import flagMt from 'circle-flags/flags/mt.svg'
import flagMx from 'circle-flags/flags/mx.svg'
import flagNl from 'circle-flags/flags/nl.svg'
import flagNo from 'circle-flags/flags/no.svg'
import flagPl from 'circle-flags/flags/pl.svg'
import flagPt from 'circle-flags/flags/pt.svg'
import flagRo from 'circle-flags/flags/ro.svg'
import flagSe from 'circle-flags/flags/se.svg'
import flagSg from 'circle-flags/flags/sg.svg'
import flagSi from 'circle-flags/flags/si.svg'
import flagSk from 'circle-flags/flags/sk.svg'
import flagUs from 'circle-flags/flags/us.svg'
import flagZa from 'circle-flags/flags/za.svg'

const FLAG_SRC: Record<string, string | { src: string }> = {
  AE: flagAe,
  AT: flagAt,
  AU: flagAu,
  BE: flagBe,
  BG: flagBg,
  BR: flagBr,
  CA: flagCa,
  CH: flagCh,
  CY: flagCy,
  CZ: flagCz,
  DE: flagDe,
  DK: flagDk,
  EE: flagEe,
  ES: flagEs,
  FI: flagFi,
  FR: flagFr,
  GB: flagGb,
  GR: flagGr,
  HK: flagHk,
  HR: flagHr,
  HU: flagHu,
  IE: flagIe,
  IL: flagIl,
  IT: flagIt,
  JP: flagJp,
  LT: flagLt,
  LU: flagLu,
  LV: flagLv,
  MT: flagMt,
  MX: flagMx,
  NL: flagNl,
  NO: flagNo,
  PL: flagPl,
  PT: flagPt,
  RO: flagRo,
  SE: flagSe,
  SG: flagSg,
  SI: flagSi,
  SK: flagSk,
  US: flagUs,
  ZA: flagZa,
}

export function phoneFlagUrl(country: string): string | undefined {
  const value = FLAG_SRC[country.trim().toUpperCase()]
  if (!value) return undefined
  return typeof value === 'string' ? value : value.src
}
