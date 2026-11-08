#!/usr/bin/env -S deno run -A
// Theme smoke test: every theme, on every kind of page -- desktop & phone width, light & dark -- in headless
// Chrome, on the tiny test site (test/fixtures/site/).  For each page, it checks:
//   - it draws (blogtini's `data-blogtini-rendered` appears) & shows the text it should
//   - no JS errors
//   - no requests to third-party hosts (only this server & esm.archive.org) -- the house rule: no CDNs
//   - no sideways scrolling (a warning)
// & saves a screenshot of each -- see them all at once: test/out/index.html
//
//   deno task test:themes                  # every theme
//   deno task test:themes dossier cosmos   # just these
//   deno task test:themes --all            # every page, at every size & scheme (slower)
//   CHROME=/path/to/chrome deno task test:themes
//
// No npm deps: serves the repo, drives Chrome over the DevTools protocol (like research/fail-open/cls.js).

/* eslint-disable no-console */ // a CLI script: printing results is the point

const REPO = new URL('..', import.meta.url).pathname // (ends w/ /)
const SITE = 'test/fixtures/site/'
const OUT = `${REPO}test/out`
const RENDER_MS = 15000 // max wait for a page to draw
const SETTLE_MS = 400 // then, for fade-ins & such
const ALLOWED_HOSTS = ['esm.archive.org'] // (& this server)
// files blogtini looks for, & is fine w/o: a missing one is no error.  (The test site has an index.txt)
const MAY_404 = ['index.xml', 'sitemap.xml', 'comments.json', 'favicon.ico']

// every kind of page: [name, url (from the site's top), text it should show]
const PAGES = [
  ['home', '', 'Welcome to the Test Kitchen'],
  ['posts', '?page/1', 'I baked a pie'],
  ['post', '2026-01-pie/', 'delicious'],
  ['plain-post', '2026-02-cake/', 'chocolate'],
  ['page', 'about/', 'in the menu'],
  ['tag', '?tags/dessert', 'Then, a cake'],
  ['tags', '?tags', 'dessert'],
  ['contact', '?contact', ''],
]
// [name, width, height, phone?, scheme]
const VIEWS = [
  ['desktop', 1440, 1000, false, 'light'],
  ['desktop-dark', 1440, 1000, false, 'dark'],
  ['phone', 390, 844, true, 'light'],
]
// w/o --all: every page on desktop -- & a few on phone & dark
const QUICK = { 'desktop-dark': ['home', 'post'], phone: ['home', 'posts', 'post'] }

const args = Deno.args
const ALL = args.includes('--all')
const THEMES = Deno.readTextFileSync(`${REPO}index.js`).match(/const THEMES = \[([\s\S]*?)\]/)[1]
  .match(/'[\w-]+'/g).map((e) => e.slice(1, -1))
const picked = args.filter((e) => !e.startsWith('--'))
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
const served = await fetch(`${base}index.txt`)
if (!served.ok) throw Error(`test server broken: ${served.status} for ${base}index.txt`)
await served.body?.cancel()


// start Chrome, & talk to it
const port = 9300 + Math.floor(Math.random() * 500)
let chrome
try {
  chrome = new Deno.Command(CHROME, {
    args: [
      '--headless', '--no-sandbox', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
      `--remote-debugging-port=${port}`, `--user-data-dir=${await Deno.makeTempDir({ prefix: 'bt-themes-' })}`,
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

function sleep(ms) {
  return new Promise((r) => { setTimeout(r, ms) })
}

const ws = new WebSocket(await devtools_ws())
await new Promise((r) => { ws.onopen = r })
let id = 0
const pending = {}
let heard = { errors: [], hosts: new Set(), urls: {} } // for the page being tested
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending[msg.id]) {
    pending[msg.id](msg)
    delete pending[msg.id]
  }
  const p = msg.params
  if (msg.method === 'Runtime.exceptionThrown')
    heard.errors.push(p.exceptionDetails.exception?.description?.split('\n')[0] ?? p.exceptionDetails.text)
  if (msg.method === 'Runtime.consoleAPICalled' && p.type === 'error')
    heard.errors.push(`console.error: ${p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200)}`)
  // (network errors: from the responses, below -- so a file blogtini only *looks* for isn't one)
  if (msg.method === 'Log.entryAdded' && p.entry.level === 'error' && p.entry.source !== 'network')
    heard.errors.push(`${p.entry.text}${p.entry.url ? ` ${p.entry.url}` : ''}`.slice(0, 200))
  if (msg.method === 'Network.responseReceived' && p.response.status >= 400 &&
    !MAY_404.includes(new URL(p.response.url).pathname.split('/').pop()))
    heard.errors.push(`${p.response.status}: ${p.response.url}`)
  // (aborted: eg, a page navigating on -- not a problem)
  if (msg.method === 'Network.loadingFailed' && !p.canceled && !/ABORTED/.test(p.errorText))
    heard.errors.push(`failed to load (${p.errorText}): ${heard.urls[p.requestId] ?? p.requestId}`)
  if (msg.method === 'Network.requestWillBeSent') {
    heard.urls[p.requestId] = p.request.url
    const { protocol, hostname } = new URL(p.request.url)
    if ((protocol === 'http:' || protocol === 'https:') && hostname !== '127.0.0.1')
      heard.hosts.add(hostname)
  }
}
const send = (method, params = {}) => new Promise((r) => {
  id += 1
  pending[id] = r
  ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true }))
  .result?.result?.value

for (const domain of ['Page', 'Runtime', 'Network', 'Log'])
  await send(`${domain}.enable`)


// every text node's text -- in the page *& inside shadow DOM* (eg: future-imperfect)
const DEEP_TEXT = `(() => {
  const out = []
  const walk = (n) => {
    if (n.nodeType === 3) out.push(n.textContent)
    if (n.shadowRoot) walk(n.shadowRoot)
    for (const c of n.childNodes) walk(c)
  }
  walk(document.body)
  return out.join(' ').replace(/\\s+/g, ' ')
})()`


// Can a visitor get to the theme picker?  Its links already showing => 'shown'.  Else clicks what should open it
// -- a palette icon, or a "Theme" / "Menu" / "Change cover" button -- one at a time, until they show: 'opens'.
// Nothing opens it: 'stuck'.  No picker at all: 'none'.  (In the page & inside shadow DOM -- eg: future-imperfect)
const PICKER = `(async () => {
  const all = (sel, root = document) => {
    const ret = [...root.querySelectorAll(sel)]
    for (const e of root.querySelectorAll('*'))
      if (e.shadowRoot) ret.push(...all(sel, e.shadowRoot))
    return ret
  }
  const links = () => all('#theme-menu a, .theme-menu a')
  // visible: has a size, isn't hidden, isn't off the side of the screen (eg: a closed slide-out panel) --
  // & is on top: scrolled to, the point at its middle is the link (not something covering it -- eg: a
  // dropdown opening *under* the next section)
  const shown = () => links().some((a) => {
    let r = a.getBoundingClientRect()
    const s = getComputedStyle(a)
    if (!(r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && s.visibility !== 'hidden' &&
      Number(s.opacity) > 0))
      return false
    a.scrollIntoView({ block: 'center', inline: 'nearest' })
    r = a.getBoundingClientRect()
    const root = a.getRootNode() // (in a shadow root, eg: future-imperfect: ask it, not the document)
    const hit = (root.elementFromPoint ? root : document).elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return Boolean(hit) && (hit === a || a.contains(hit))
  })
  if (!links().length) return 'none'
  if (shown()) return 'shown'
  const words = /^(theme|menu|change cover)\\b/i
  const triggers = [
    ...all('.fa-palette').map((e) => e.closest('a, button, li, [role=button]') ?? e),
    ...all('a, button, [role=button], li, h3, span').filter((e) => words.test(e.textContent.trim()) &&
      e.textContent.trim().length < 20),
  ].filter((e) => !(e.matches('a[href]') && !/^#/.test(e.getAttribute('href')))) // (not a link off the page)
  for (const t of new Set(triggers)) {
    t.click()
    await new Promise((r) => { setTimeout(r, 700) })
    if (shown()) return 'opens'
  }
  return 'stuck'
})()`


/** Loads one page, in one theme & view.  Returns its result */
async function check(theme, [page, path, expect], [view, width, height, phone, scheme]) {
  heard = { errors: [], hosts: new Set(), urls: {} }
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: phone })
  // the theme, by the previewer's frame name -- so no viewer pick gets saved.  & the light/dark scheme
  const { identifier } = (await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.name = 'bt-preview:${theme}'
      try { localStorage.setItem('blogtini-viewer',
        JSON.stringify({ scheme: { val: '${scheme}', until: Date.now() + 3600000 } })) } catch {}`,
  })).result
  await send('Page.navigate', { url: `${base}${path}` })

  let rendered = false
  for (let waited = 0; waited < RENDER_MS && !rendered; waited += 150) {
    await sleep(150)
    rendered = await evaluate("document.documentElement.hasAttribute('data-blogtini-rendered')")
  }
  await sleep(SETTLE_MS)
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier })

  const text = (await evaluate(DEEP_TEXT)) ?? ''
  const overflow = await evaluate('document.documentElement.scrollWidth - innerWidth')
  const shot = (await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 })).result?.data
  const file = `${theme}/${page}-${view}.jpg`
  Deno.mkdirSync(`${OUT}/${theme}`, { recursive: true })
  if (shot) Deno.writeFileSync(`${OUT}/${file}`, Uint8Array.from(atob(shot), (c) => c.charCodeAt(0)))

  const fails = []
  const warns = []
  if (!rendered) fails.push(`never drew (no data-blogtini-rendered after ${RENDER_MS / 1000}s)`)
  if (expect && !text.includes(expect)) fails.push(`missing text: "${expect}"`)
  fails.push(...heard.errors)
  const outside = [...heard.hosts].filter((e) => !ALLOWED_HOSTS.includes(e))
  if (outside.length) fails.push(`third-party requests: ${outside.join(', ')}`)
  if (overflow > 1) warns.push(`scrolls sideways: ${overflow}px too wide`)

  // the theme picker: on the homepage, on desktop (after the screenshot -- this clicks around)
  if (page === 'home' && view === 'desktop') {
    const picker = (await send('Runtime.evaluate', { expression: PICKER, awaitPromise: true, returnByValue: true }))
      .result?.result?.value
    // can't reach it: a fail.  (No picker at all, just a warning: a site can turn it off -- `header: theme: false`)
    if (picker === 'stuck') fails.push("theme picker: clicking its button doesn't show the themes (or they're covered)")
    if (picker === 'none') warns.push('theme picker: none on the page')
  }
  return { theme, page, view, file, fails, warns }
}


try {
  Deno.removeSync(OUT, { recursive: true })
} catch { /* not there yet */ }
const results = []
for (const theme of themes) {
  for (const v of VIEWS) {
    for (const p of PAGES) {
      if (!ALL && v[0] !== 'desktop' && !QUICK[v[0]]?.includes(p[0]))
        continue
      const r = await check(theme, p, v)
      results.push(r)
      const mark = r.fails.length ? '✗' : (r.warns.length ? '!' : '✓')
      console.log(`${mark} ${theme} ${r.page} ${r.view}${[...r.fails, ...r.warns].map((e) => `\n    ${e}`).join('')}`)
    }
  }
}


// a contact sheet of every screenshot, w/ its problems
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
Deno.writeTextFileSync(`${OUT}/index.html`, `<!doctype html><meta charset="utf-8"><title>blogtini theme tests</title>
<style>
body { font: 14px/1.4 system-ui, sans-serif; margin: 1.5rem; background: #f4f4f2; }
h2 { margin: 2rem 0 0.5rem 0; }
.row { display: flex; flex-wrap: wrap; gap: 12px; }
figure { margin: 0; width: 260px; background: #fff; border: 3px solid #4caf50; }
figure.warn { border-color: #f0b400; }
figure.fail { border-color: #e53935; }
img { display: block; width: 100%; aspect-ratio: 1440 / 1000; object-fit: cover; object-position: top; }
figcaption { padding: 4px 6px; }
figcaption ul { margin: 2px 0 0 0; padding-left: 1.1em; color: #b71c1c; }
</style>
<h1>blogtini theme tests</h1>
<p>${results.filter((r) => r.fails.length).length} failed, ${results.filter((r) => !r.fails.length && r.warns.length).length} warnings, of ${results.length}.  (Click a screenshot for full size)</p>
${themes.map((theme) => `<h2>${esc(theme)}</h2><div class="row">${results.filter((r) => r.theme === theme).map((r) => `
<figure class="${r.fails.length ? 'fail' : (r.warns.length ? 'warn' : 'ok')}">
  <a href="${esc(r.file)}"><img src="${esc(r.file)}" alt="" loading="lazy"></a>
  <figcaption>${esc(r.page)} &middot; ${esc(r.view)}${r.fails.length || r.warns.length ? `<ul>${[...r.fails, ...r.warns].map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}</figcaption>
</figure>`).join('')}</div>`).join('')}
`)

const failed = results.filter((r) => r.fails.length)
const warned = results.filter((r) => !r.fails.length && r.warns.length)
const ok = results.length - failed.length - warned.length
console.log(`\n${ok} of ${results.length} ok${warned.length ? ` -- ${warned.length} WARNING${warned.length > 1 ? 'S' : ''} (!)` : ''}${
  failed.length ? ` -- ${failed.length} FAILED (✗)` : ''}.  Screenshots: test/out/index.html`)
ws.close()
chrome.kill()
await server.shutdown()
Deno.exit(failed.length ? 1 : 0)
