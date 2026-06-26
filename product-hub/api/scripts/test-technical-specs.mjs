import assert from 'node:assert/strict'
import {
  extractTechnicalSpecsFromDescription,
  parseSpecsFromTableHtml,
  renderTechnicalSpecsTableHtml,
} from '../src/product-technical-specs.ts'

const table = `<table><tbody>
<tr><td>Codice prodotto</td><td><strong>36910</strong></td></tr>
<tr><td>Potenza</td><td>70W</td></tr>
<tr><td>Manuale tecnico</td><td>N/A</td></tr>
</tbody></table>`

const parsed = parseSpecsFromTableHtml(table)
assert.equal(parsed.productCode, '36910')
assert.equal(parsed.power, '70W')
assert.equal(parsed.technicalManual, null)

const html = `<p>Intro lampada.</p>
<h3>Caratteristiche Tecniche</h3>
${table}`

const { specs, descriptionHtml } = extractTechnicalSpecsFromDescription(html)
assert.equal(specs.productCode, '36910')
assert.ok(!descriptionHtml?.includes('<table'))
assert.ok(renderTechnicalSpecsTableHtml(specs)?.includes('Potenza'))

console.log('technical-specs: ok')
