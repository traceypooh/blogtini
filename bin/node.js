/*
  Runs the blogtini build (`build.js`) on Node w/o a blogtini checkout.  From the top of your site repo:
    curl -s https://blogtini.com/bin/node.js | node --input-type=module - [--seo]

  Node can't `import` from https urls -- so: fetch our https module hooks, register them (as a `data:` url),
  then import `build.js` over https (& the hooks fetch whatever it imports).
  Always re-fetches blogtini.com files (the latest build); pinned (`@1.2.3`) imports stay cached.  See DENODE.md.
*/
import { register } from 'node:module'

const BASE = 'https://blogtini.com/bin/'

const hooks = await (await fetch(`${BASE}https-hooks.js`)).text()
register(`data:text/javascript,${encodeURIComponent(hooks)}`, { data: { max_age_days: 0 } })
await import(`${BASE}build.js`)
