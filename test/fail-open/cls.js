#!/usr/bin/env -S deno run -A
// Measures CLS (Google's layout-shift score) for each test page, with JS on and off.
// No npm deps: serves this dir, drives headless Chrome over the DevTools protocol.
//
//   test/fail-open/cls.js
//   CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' test/fail-open/cls.js
import process from 'node:process'
import { createServer } from 'node:http'
import { readFile, mkdtemp } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGES = ['shift-control', 'nojs', 'nojs-prewrap', 'js-fast', 'js-slow']
const WAIT_MS = 7000 // js-slow renders at 5s
const CHROME = process.env.CHROME ?? 'chromium'
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' }

const server = createServer(async (req, res) => {
  const path = join(DIR, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'))
  try {
    const body = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404).end()
  }
}).listen(0)
const base = `http://127.0.0.1:${server.address().port}/`
const check = await fetch(`${base}nojs/`)
if (!check.ok) throw Error(`test server broken: ${check.status} for ${base}nojs/`)

const port = 9300 + Math.floor(Math.random() * 500)
const chrome = spawn(CHROME, [
  '--headless', '--no-sandbox', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`,
  `--user-data-dir=${await mkdtemp(join(tmpdir(), 'cls-'))}`, '--window-size=1280,800', 'about:blank',
], { stdio: 'ignore' })

async function devtools_ws() {
  for (let i = 0; i < 50; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      const tab = tabs.find((t) => t.type === 'page')
      if (tab) return tab.webSocketDebuggerUrl
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200))
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
    shifts++
  }
}
const send = (method, params = {}) => new Promise((r) => {
  pending[++id] = r
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
    await new Promise((r) => setTimeout(r, WAIT_MS))
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
server.close()
