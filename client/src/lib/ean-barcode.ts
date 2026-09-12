export type BarcodeFormat = 'EAN-13' | 'EAN-8' | 'UPC-A'

export type EncodedBarcode = {
  digits: string
  format: BarcodeFormat
  modules: ReadonlyArray<0 | 1>
  guardIndexes: ReadonlySet<number>
}

const LEFT_L = [
  '0001101',
  '0011001',
  '0010011',
  '0111101',
  '0100011',
  '0110001',
  '0101111',
  '0111011',
  '0110111',
  '0001011',
] as const

const LEFT_G = [
  '0100111',
  '0110011',
  '0011011',
  '0100001',
  '0011101',
  '0111001',
  '0000101',
  '0010001',
  '0001001',
  '0010111',
] as const

const RIGHT_R = [
  '1110010',
  '1100110',
  '1101100',
  '1000010',
  '1011100',
  '1001110',
  '1010000',
  '1000100',
  '1001000',
  '1110100',
] as const

/** 0 = L, 1 = G per le sei cifre di sinistra (la prima cifra EAN-13 non è disegnata). */
const EAN13_PARITY = [
  '000000',
  '001011',
  '001101',
  '001110',
  '010011',
  '010101',
  '010110',
  '011001',
  '011010',
  '011100',
] as const

export function normalizeBarcodeDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function ean13Checksum(first12: string): number {
  let sum = 0
  for (let i = 0; i < 12; i += 1) {
    const digit = Number(first12[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }
  return (10 - (sum % 10)) % 10
}

export function ean8Checksum(first7: string): number {
  let sum = 0
  for (let i = 0; i < 7; i += 1) {
    const digit = Number(first7[i])
    sum += i % 2 === 0 ? digit * 3 : digit
  }
  return (10 - (sum % 10)) % 10
}

function appendPattern(modules: Array<0 | 1>, pattern: string, guards?: Set<number>) {
  const start = modules.length
  for (const bit of pattern) {
    modules.push(bit === '1' ? 1 : 0)
  }
  if (!guards) return
  for (let i = 0; i < pattern.length; i += 1) {
    guards.add(start + i)
  }
}

function encodeEan13Digits(digits: string): EncodedBarcode {
  const modules: Array<0 | 1> = []
  const guardIndexes = new Set<number>()
  const first = Number(digits[0])
  const parity = EAN13_PARITY[first] ?? EAN13_PARITY[0]

  appendPattern(modules, '101', guardIndexes)
  for (let i = 1; i <= 6; i += 1) {
    const digit = Number(digits[i])
    const pattern = parity[i - 1] === '1' ? LEFT_G[digit] : LEFT_L[digit]
    appendPattern(modules, pattern)
  }
  appendPattern(modules, '01010', guardIndexes)
  for (let i = 7; i <= 12; i += 1) {
    appendPattern(modules, RIGHT_R[Number(digits[i])])
  }
  appendPattern(modules, '101', guardIndexes)

  return { digits, format: 'EAN-13', modules, guardIndexes }
}

function encodeEan8Digits(digits: string): EncodedBarcode {
  const modules: Array<0 | 1> = []
  const guardIndexes = new Set<number>()
  appendPattern(modules, '101', guardIndexes)
  for (let i = 0; i < 4; i += 1) {
    appendPattern(modules, LEFT_L[Number(digits[i])])
  }
  appendPattern(modules, '01010', guardIndexes)
  for (let i = 4; i < 8; i += 1) {
    appendPattern(modules, RIGHT_R[Number(digits[i])])
  }
  appendPattern(modules, '101', guardIndexes)
  return { digits, format: 'EAN-8', modules, guardIndexes }
}

export function encodeProductBarcode(value: string): EncodedBarcode | null {
  let digits = normalizeBarcodeDigits(value)
  if (!digits) return null
  if (digits.length === 14 && digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 12) {
    const encoded = encodeEan13Digits(`0${digits}`)
    return { ...encoded, format: 'UPC-A' }
  }
  if (digits.length === 13) {
    return encodeEan13Digits(digits)
  }
  if (digits.length === 8) {
    return encodeEan8Digits(digits)
  }
  return null
}

export type BarcodeRenderOptions = {
  moduleWidth?: number
  barHeight?: number
  quietModules?: number
  includeDigits?: boolean
  foreground?: string
  background?: string
}

const DEFAULT_RENDER: Required<BarcodeRenderOptions> = {
  moduleWidth: 2,
  barHeight: 72,
  quietModules: 10,
  includeDigits: true,
  foreground: '#111111',
  background: '#ffffff',
}

function digitLabel(encoded: EncodedBarcode): string {
  if (encoded.format === 'UPC-A' || (encoded.format === 'EAN-13' && encoded.digits.startsWith('0') && encoded.digits.length === 13)) {
    return encoded.digits.length === 13 && encoded.digits.startsWith('0')
      ? encoded.digits.slice(1)
      : encoded.digits
  }
  if (encoded.format === 'EAN-13') {
    return `${encoded.digits[0]}  ${encoded.digits.slice(1, 7)}  ${encoded.digits.slice(7)}`
  }
  return `${encoded.digits.slice(0, 4)}  ${encoded.digits.slice(4)}`
}

export function barcodeToSvg(encoded: EncodedBarcode, options: BarcodeRenderOptions = {}): string {
  const opts = { ...DEFAULT_RENDER, ...options }
  const width = (encoded.modules.length + opts.quietModules * 2) * opts.moduleWidth
  const textHeight = opts.includeDigits ? 18 : 0
  const height = opts.barHeight + textHeight + 8
  const bars = encoded.modules
    .map((bit, index) => {
      if (!bit) return ''
      const x = (opts.quietModules + index) * opts.moduleWidth
      const h = encoded.guardIndexes.has(index) ? opts.barHeight + 6 : opts.barHeight
      return `<rect x="${x}" y="4" width="${opts.moduleWidth}" height="${h}" fill="${opts.foreground}"/>`
    })
    .join('')
  const text = opts.includeDigits
    ? `<text x="${width / 2}" y="${opts.barHeight + 22}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" fill="${opts.foreground}">${escapeXml(digitLabel(encoded))}</text>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">${`<rect width="100%" height="100%" fill="${opts.background}"/>`}${bars}${text}</svg>`
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function barcodeToCanvas(
  encoded: EncodedBarcode,
  options: BarcodeRenderOptions = {},
): HTMLCanvasElement {
  const opts = { ...DEFAULT_RENDER, ...options }
  const width = (encoded.modules.length + opts.quietModules * 2) * opts.moduleWidth
  const textHeight = opts.includeDigits ? 22 : 0
  const height = opts.barHeight + textHeight + 8
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.fillStyle = opts.background
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = opts.foreground
  encoded.modules.forEach((bit, index) => {
    if (!bit) return
    const x = (opts.quietModules + index) * opts.moduleWidth
    const h = encoded.guardIndexes.has(index) ? opts.barHeight + 6 : opts.barHeight
    ctx.fillRect(x, 4, opts.moduleWidth, h)
  })
  if (opts.includeDigits) {
    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(digitLabel(encoded), width / 2, opts.barHeight + 12)
  }
  return canvas
}

function pdfEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function toPdfAscii(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90)
}

export function barcodeToPdf(
  encoded: EncodedBarcode,
  meta?: { productName?: string | null; brand?: string | null },
): Uint8Array {
  const pageW = 420
  const pageH = 220
  const quiet = 18
  const usable = pageW - quiet * 2
  const moduleW = usable / (encoded.modules.length + 16)
  const barBottom = 70
  const barTop = 150
  const barH = barTop - barBottom
  const startX = quiet + 8 * moduleW

  const rects: string[] = []
  encoded.modules.forEach((bit, index) => {
    if (!bit) return
    const x = startX + index * moduleW
    const extra = encoded.guardIndexes.has(index) ? 6 : 0
    rects.push(`${x.toFixed(2)} ${barBottom - extra} ${moduleW.toFixed(2)} ${barH + extra} re`)
  })

  const title = toPdfAscii(meta?.productName ?? '')
  const brand = toPdfAscii(meta?.brand ?? '')
  const heading = [brand, title].filter(Boolean).join(' — ') || encoded.format
  const lines = [
    '0 0 0 rg',
    `${rects.join(' ')} f`,
    'BT',
    '/F1 11 Tf',
    `1 0 0 1 ${quiet} 186 Tm`,
    `(${pdfEscape(heading)}) Tj`,
    '/F1 10 Tf',
    `1 0 0 1 ${pageW / 2 - 40} 48 Tm`,
    `(${pdfEscape(digitLabel(encoded))}) Tj`,
    '/F1 8 Tf',
    `1 0 0 1 ${quiet} 24 Tm`,
    `(${pdfEscape(`${encoded.format}  ·  Idea di Luce`)}) Tj`,
    'ET',
  ]
  const stream = lines.join('\n')

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n`,
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ]

  let body = '%PDF-1.4\n'
  const offsets = [0]
  for (const object of objects) {
    offsets.push(body.length)
    body += object
  }
  const xrefStart = body.length
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  body += xref
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  return new TextEncoder().encode(body)
}

export function barcodeFilename(digits: string, extension: 'png' | 'pdf' | 'svg'): string {
  return `ean-${normalizeBarcodeDigits(digits) || 'codice'}.${extension}`
}
