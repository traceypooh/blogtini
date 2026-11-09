#!/usr/bin/env -S deno run -A
// Layout shift test: Google's CLS score for every theme, on the tiny test site (test/fixtures/site/), in headless
// Chrome -- the worst case: images arrive *after* the page has drawn (like a slow phone).  Chrome holds every image
// request until blogtini's `data-blogtini-rendered` appears, then lets them all go.  Then it scrolls to the bottom,
// like a reader.  For each page: its CLS & the elements that moved the most.
//   ✓ good (<= 0.1)   ! needs improvement (<= 0.25, a warning)   ✗ poor (> 0.25, a fail)  -- Google's thresholds
//
//   deno task test:cls                  # every theme
//   deno task test:cls dossier cosmos   # just these
//   CHROME=/path/to/chrome deno task test:cls
//
// See future-imperfect.md "Placeholder shapes".  Same plumbing as test/themes.js (no npm deps).

/* eslint-disable no-console */ // a CLI script: printing results is the point

const REPO = new URL('..', import.meta.url).pathname // (ends w/ /)
const SITE = 'test/fixtures/site/'
const RENDER_MS = 15000 // max wait for a page to draw
const SETTLE_MS = 400 // after it draws, before the images go
const LOADED_MS = 1500 // after the images go
const GOOD = 0.1
const POOR = 0.25

// [name, url (from the site's top)]
const PAGES = [
  ['home', ''],
  ['posts', '?page/1'],
  ['post', '2026-01-pie/'], // a featured image (8:5) & a body image (3:4, like a phone portrait)
  ['plain-post', '2026-02-cake/'], // no images: should always be ~0
]
// [name, width, height, phone?]
const VIEWS = [
  ['desktop', 1440, 1000, false],
  ['phone', 390, 844, true],
]

const THEMES = Deno.readTextFileSync(`${REPO}index.js`).match(/const THEMES = \[([\s\S]*?)\]/)[1]
  .match(/'[\w-]+'/g).map((e) => e.slice(1, -1))
const picked = Deno.args.filter((e) => !e.startsWith('--'))
for (const t of picked) {
  if (!THEMES.includes(t)) throw Error(`no theme: ${t} -- the themes: ${THEMES.join(' ')}`)
}
const themes = picked.length ? picked : THEMES

/** Does a file exist? */
function exists(path) {
  try {
    return Boolean(Deno.statSync(path))
  } catch {
    return false
  }
}

function sleep(ms) {
  return new Promise((r) => { setTimeout(r, ms) })
}

const CHROME = Deno.env.get('CHROME') ?? [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(exists) ?? 'chromium'


// serve the repo
const TYPES = {
  html: 'text/html', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', woff2: 'font/woff2',
  woff: 'font/woff', ttf: 'font/ttf', json: 'application/json', yml: 'text/yaml', txt: 'text/plain',
  xml: 'application/xml', png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', ico: 'image/x-icon',
  md: 'text/plain',
}
const server = Deno.serve({ port: 0, hostname: '127.0.0.1', onListen() {} }, async (req) => {
  const path = `${REPO}${decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '').replace(/\/$/, '/index.html')}`
  try {
    const type = TYPES[path.match(/\.(\w+)$/)?.[1]] ?? 'application/octet-stream'
    return new Response(await Deno.readFile(path), { headers: { 'content-type': type } })
  } catch {
    return new Response('', { status: 404 })
  }
})
const base = `http://127.0.0.1:${server.addr.port}/${SITE}`


// start Chrome, & talk to it
const port = 9300 + Math.floor(Math.random() * 500)
let chrome
try {
  chrome = new Deno.Command(CHROME, {
    args: [
      '--headless', '--no-sandbox', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
      `--remote-debugging-port=${port}`, `--user-data-dir=${await Deno.makeTempDir({ prefix: 'bt-cls-' })}`,
      'about:blank',
    ],
    stdin: 'null', stdout: 'null', stderr: 'null',
  }).spawn()
} catch {
  console.error(`couldn't start Chrome: ${CHROME} -- set CHROME=/path/to/chrome`)
  Deno.exit(2)
}

async function devtools_ws() {
  for (let i = 0; i < 75; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      const tab = tabs.find((t) => t.type === 'page')
      if (tab) return tab.webSocketDebuggerUrl
    } catch { /* not up yet */ }
    await sleep(200)
  }
  throw Error(`Chrome never came up: ${CHROME} -- set CHROME=/path/to/chrome`)
}

const ws = new WebSocket(await devtools_ws())
await new Promise((r) => { ws.onopen = r })
let id = 0
const pending = {}
let holding = true // hold image requests (until the page draws)
let held = [] // their request ids
let shifts = [] // [{ value, time, nodes }] for the page being tested
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending[msg.id]) {
    pending[msg.id](msg)
    delete pending[msg.id]
  }
  const p = msg.params
  if (msg.method === 'Fetch.requestPaused') {
    if (holding)
      held.push(p.requestId)
    else // eslint-disable-next-line no-use-before-define
      void send('Fetch.continueRequest', { requestId: p.requestId })
  }
  // Chrome's own layout-shift entries (a shift right after a click or key press doesn't count -- as w/ Google)
  const shift = msg.method === 'PerformanceTimeline.timelineEventAdded' && p.event.layoutShiftDetails
  if (shift && !shift.hadRecentInput)
    shifts.push({ value: shift.value, time: p.event.time, nodes: (shift.sources ?? [])
      .map((s) => s.nodeId) })
}
const send = (method, params = {}) => new Promise((r) => {
  id += 1
  pending[id] = r
  ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true }))
  .result?.result?.value

for (const domain of ['Page', 'Runtime', 'DOM'])
  await send(`${domain}.enable`)
await send('PerformanceTimeline.enable', { eventTypes: ['layout-shift'] })
await send('Fetch.enable', { patterns: [{ resourceType: 'Image', requestStage: 'Request' }] })
// no caching: every page load fetches its images again (& so they get held again)
await send('Network.enable')
await send('Network.setCacheDisabled', { cacheDisabled: true })


/**
 * Google's CLS: the worst "session window" -- shifts less than 1s apart, in a window of at most 5s.
 * (`time`: seconds)
 */
function session_cls(list) {
  let worst = 0
  let sum = 0
  let start = 0
  let prev = -Infinity
  for (const s of list) {
    if (s.time - prev > 1 || s.time - start > 5) {
      sum = 0
      start = s.time
    }
    sum += s.value
    prev = s.time
    worst = Math.max(worst, sum)
  }
  return worst
}

/** Names an element, eg: 'img[pie.svg]' or 'article.card' -- or '?' if it's gone */
async function node_name(backendNodeId) {
  const node = (await send('DOM.describeNode', { backendNodeId })).result?.node
  if (!node)
    return '?'
  const attrs = {}
  for (let i = 0; i < (node.attributes?.length ?? 0); i += 2)
    attrs[node.attributes[i]] = node.attributes[i + 1]
  const name = node.nodeName.toLowerCase()
  if (attrs.src)
    return `${name}[${attrs.src.split('/').pop().split('?')[0]}]`
  return `${name}${attrs.id ? `#${attrs.id}` : ''}${attrs.class ? `.${attrs.class.trim().split(/\s+/).slice(0, 2).join('.')}` : ''}`
}


/** Loads one page, in one theme & view.  Returns its result */
async function check(theme, [page, path], [view, width, height, phone]) {
  shifts = []
  held = []
  holding = true
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: phone })
  // the theme, by the previewer's frame name -- so no viewer pick gets saved.  Light scheme
  const { identifier } = (await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.name = 'bt-preview:${theme}'
      try { localStorage.setItem('blogtini-viewer',
        JSON.stringify({ scheme: { val: 'light', until: Date.now() + 3600000 } })) } catch {}`,
  })).result
  await send('Page.navigate', { url: `${base}${path}` })

  let rendered = false
  for (let waited = 0; waited < RENDER_MS && !rendered; waited += 150) {
    await sleep(150)
    rendered = await evaluate("document.documentElement.hasAttribute('data-blogtini-rendered')")
  }
  await sleep(SETTLE_MS)
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier })

  // the page has drawn (& its own shifts, if any, are counted): now the images arrive
  const n_images = held.length
  holding = false
  await Promise.all(held.map((requestId) => send('Fetch.continueRequest', { requestId })))
  await sleep(LOADED_MS)
  const at_load = session_cls(shifts)

  // then scroll down, like a reader
  await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
        scrollTo(0, y)
        await new Promise((r) => { setTimeout(r, 120) })
      }
    })()`,
  })
  await sleep(600)

  const cls = session_cls(shifts)
  // what moved the most: each shift's value, split among its elements
  const blame = {}
  for (const s of shifts) {
    for (const node of s.nodes) {
      const name = await node_name(node)
      blame[name] = (blame[name] ?? 0) + s.value / s.nodes.length
    }
  }
  const culprits = Object.entries(blame).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([name, val]) => `${name} ${val.toFixed(3)}`)

  return { theme, page, view, rendered, cls, at_load, n_shifts: shifts.length, n_images, culprits }
}


const results = []
for (const theme of themes) {
  for (const v of VIEWS) {
    for (const p of PAGES) {
      const r = await check(theme, p, v)
      results.push(r)
      const mark = !r.rendered || r.cls > POOR ? '✗' : (r.cls > GOOD ? '!' : '✓')
      console.log(`${mark} ${r.cls.toFixed(3)}  ${theme} ${r.page} ${r.view}${
        r.rendered ? '' : '  -- never drew'}${
        r.n_shifts ? `  (${r.n_shifts} shift${r.n_shifts > 1 ? 's' : ''}, ${r.at_load.toFixed(3)} as ${r.n_images} image${r.n_images === 1 ? '' : 's'} loaded)` : ''}${
        r.culprits.length && r.cls > GOOD ? `\n      moved most: ${r.culprits.join(', ')}` : ''}`)
    }
  }
}

const failed = results.filter((r) => !r.rendered || r.cls > POOR)
const warned = results.filter((r) => r.rendered && r.cls > GOOD && r.cls <= POOR)
console.log(`\n${results.length - failed.length - warned.length} of ${results.length} good (CLS <= ${GOOD})${
  warned.length ? ` -- ${warned.length} need improvement (!)` : ''}${failed.length ? ` -- ${failed.length} POOR (✗)` : ''}`)
ws.close()
chrome.kill()
await server.shutdown()
Deno.exit(failed.length ? 1 : 0)
