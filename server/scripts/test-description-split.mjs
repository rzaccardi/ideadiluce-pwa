import assert from 'node:assert/strict'
import { splitProductDescription } from '../dist/lib/product-description-split.js'

const html = `
<p>Testo introduttivo.</p>
<table><tr><th>Peso</th><td>0,01 kg</td></tr></table>
<h3>Caratteristiche</h3>
<table>
<tr><th>Codice</th><td>73336</td></tr>
<tr><th>Potenza</th><td>13W</td></tr>
<tr><th>Flusso</th><td>900lm</td></tr>
</table>
`

const split = splitProductDescription(html)
assert.ok(split.descriptionHtml?.includes('Testo introduttivo'))
assert.ok(!split.descriptionHtml?.includes('<table'))
assert.ok(split.additionalInfoTableHtml?.includes('Peso'))
assert.ok(split.specsTableHtml?.includes('Flusso'))
console.log('product-description-split: ok')
