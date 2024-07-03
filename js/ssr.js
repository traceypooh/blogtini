import './dom.js'

import { render } from 'npm:@lit-labs/ssr/lib/render-lit-html.js'
import { collectResultSync } from 'npm:@lit-labs/ssr/lib/render-result.js'
import { html } from 'npm:lit'
// eslint-disable-next-line import/no-unresolved
import { unsafeHTML } from 'npm:lit/directives/unsafe-html.js'


import '../theme/future-imperfect/bt-body.js' // xxxcc

export {
  render, html, unsafeHTML, collectResultSync,
}
