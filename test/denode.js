// Tries `bin/https-hooks.js` (see DENODE.md):  node test/denode.js   (or open in Code App & press ▶)
// Loads the real `js/text.js` -- which imports js-yaml & showdown from https urls.
// 2nd run should come from the cache, eg: works offline.

/* eslint-disable no-console */
import { register } from 'node:module'

register('../bin/https-hooks.js', import.meta.url)

// (a dynamic import -- static imports would resolve before the hooks are registered)
const { markdown_parse, markdown_to_html } = await import('../js/text.js')

const [front_matter, body] = markdown_parse('---\ntitle: hello\ntags: [a, b]\n---\n\n> a *quote* & `a<b`\n')
console.log(front_matter)
console.log(markdown_to_html(body))
