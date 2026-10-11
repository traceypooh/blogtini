// Tries `bin/https-hooks.mjs` (see DENODE.md):  node test/denode.mjs   (or open in Code App & press ▶)
// Loads the real `js/text.js` -- which imports js-yaml & showdown from https urls.
// 2nd run should come from the cache, eg: works offline.

/* eslint-disable no-console */
import { register } from 'node:module'

register('../bin/https-hooks.mjs', import.meta.url)

// (a dynamic import -- static imports would resolve before the hooks are registered)
const { markdown_parse, markdown_to_html } = await import('../js/text.js')

const [front_matter, body] = markdown_parse('---\ntitle: hello\ntags: [a, b]\n---\n\n> a *quote* & `a<b`\n')
console.log(front_matter)
console.log(markdown_to_html(body))
