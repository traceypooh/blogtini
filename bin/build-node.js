// Node entry for `build.js` -- `deno run … build.js` doesn't need this.  See DENODE.md.
// Run from the top of your site repo, eg:  node ../blogtini/bin/build-node.js [comments]
// Static imports resolve before any code runs, so: register the hooks first, then import dynamically.
import { register } from 'node:module'

register('./https-hooks.js', import.meta.url)
await import('./build.js')
