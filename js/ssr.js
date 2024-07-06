import './dom.js'

import { render } from 'npm:@lit-labs/ssr/lib/render-lit-html.js'
import { collectResultSync } from 'npm:@lit-labs/ssr/lib/render-result.js'
import { html } from 'npm:lit'
// eslint-disable-next-line import/no-unresolved
import { unsafeHTML } from 'npm:lit/directives/unsafe-html.js'


import '../theme/future-imperfect/bt-body.js'


async function demo() {
  if (globalThis.Deno) {
    /**
  eg:

  clear -x; deno run -A --location https://blogtini.com/2023-06-blogtini-dwebcamp/ js/blogtini.js

    */

    // eslint-disable-next-line import/no-self-import
    const ret = await import('./ssr.js')
    globalThis.render = ret.render
    globalThis.html = ret.html
    globalThis.unsafeHTML = ret.unsafeHTML
    globalThis.collectResultSync = ret.collectResultSync
  }


  // ...


  const bod = document.querySelector('body').innerHTML
  const htm = `
<!DOCTYPE html>
<html>
<head>
  ${document.head.innerHTML.replace(/</g, '\n    <').trim()}
</head>
<body>
  ${bod}
</body>
</html>`

  const ssr = globalThis.collectResultSync(globalThis.render(globalThis.html`${globalThis.unsafeHTML(htm)}`))
  Deno.writeTextFileSync('ssr.htm', ssr)
}


export {
  render, html, unsafeHTML, collectResultSync,
}
