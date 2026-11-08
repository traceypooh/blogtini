#!/usr/bin/env -S deno run -A
// Measures CLS (Google's layout-shift score) for each test page, with JS on and off.
// No npm deps: serves this dir, drives headless Chrome over the DevTools protocol.
//
//   research/fail-open/cls.js
//   CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' research/fail-open/cls.js

/* eslint-disable no-console */ // a CLI script: printing results is the point

const DIR = new URL('.', import.meta.url).pathname // (ends w/ /)
const PAGES = ['shift-control', 'nojs', 'nojs-prewrap', 'js-fast', 'js-slow']
const WAIT_MS = 7000 // js-slow renders at 5s
const CHROME = Deno.env.get('CHROME') ?? 'chromium'
const TYPES = { html: 'text/html', js: 'text/javascript' }

const server = Deno.serve({ port: 0, hostname: '127.0.0.1', onListen() {} }, async (req) => {
  const path = `${DIR}${decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '').replace(/\/$/, '/index.html')}`
  try {
    const type = TYPES[path.match(/\.(\w+)$/)?.[1]] ?? 'application/octet-stream'
    return new Response(await Deno.readFile(path), { headers: { 'content-type': type } })
  } catch {
    return new Response('', { status: 404 })
  }
})
const base = `http://127.0.0.1:${server.addr.port}/`
const check = await fetch(`${base}nojs/`)
if (!check.ok) throw Error(`test server broken: ${check.status} for ${base}nojs/`)
await check.body?.cancel()

const port = 9300 + Math.floor(Math.random() * 500)
const chrome = new Deno.Command(CHROME, {
  args: [
    '--headless', '--no-sandbox', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`,
    `--user-data-dir=${await Deno.makeTempDir({ prefix: 'cls-' })}`, '--window-size=1280,800', 'about:blank',
  ],
  stdin: 'null', stdout: 'null', stderr: 'null',
}).spawn()

async function devtools_ws() {
  for (let i = 0; i < 50; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      const tab = tabs.find((t) => t.type === 'page')
      if (tab) return tab.webSocketDebuggerUrl
    } catch { /* not up yet */ }
    await new Promise((r) => { setTimeout(r, 200) })
  }
  throw Error(`chrome never came up: ${CHROME}`)
}

const ws = new WebSocket(await devtools_ws())
await new Promise((r) => { ws.onopen = r })
let id = 0
const pending = {}
let cls = 0
let shifts = 0
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending[msg.id]) pending[msg.id](msg)
  // Chrome's own layout-shift entries -- works even when page JS is disabled
  const shift = msg.method === 'PerformanceTimeline.timelineEventAdded' && msg.params.event.layoutShiftDetails
  if (shift && !shift.hadRecentInput) {
    cls += shift.value
    shifts += 1
  }
}
const send = (method, params = {}) => new Promise((r) => {
  id += 1
  pending[id] = r
  ws.send(JSON.stringify({ id, method, params }))
})

await send('PerformanceTimeline.enable', { eventTypes: ['layout-shift'] })

const results = []
for (const js of [true, false]) {
  await send('Emulation.setScriptExecutionDisabled', { value: !js })
  for (const page of PAGES) {
    cls = 0
    shifts = 0
    const nav = await send('Page.navigate', { url: `${base}${page}/` })
    if (nav.error || nav.result?.errorText) throw Error(`navigate ${page}: ${JSON.stringify(nav)}`)
    await new Promise((r) => { setTimeout(r, WAIT_MS) })
    const { result } = (await send('Runtime.evaluate', {
      expression: 'getComputedStyle(document.body).visibility + " | " + document.body.textContent.trim().slice(0, 20)',
    })).result
    const row = { page, js: js ? 'on' : 'off', cls: cls.toFixed(4), shifts, body_at_7s: result?.value }
    console.log(row)
    results.push(row)
  }
}

console.table(results)
ws.close()
chrome.kill()
await server.shutdown()
