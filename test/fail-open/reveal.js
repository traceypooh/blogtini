// fake "theme": waits `ms` (from our import url), then renders + reveals, and reports what the parser built
const ms = Number(new URL(import.meta.url).searchParams.get('ms') ?? 0)

let cls = 0
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value
}).observe({ type: 'layout-shift', buffered: true })

const t0 = performance.now()
const raw = document.body.innerHTML
const vis_at_start = getComputedStyle(document.body).visibility

await new Promise((r) => { setTimeout(r, ms) })

const vis_before_render = getComputedStyle(document.body).visibility
document.body.style.animation = 'none'
document.body.style.whiteSpace = 'normal'
document.body.innerHTML = `
  <h1 style="font-family:sans-serif">rendered by JS after ${ms}ms</h1>
  <ul style="font-family:monospace">
    <li>compatMode: <b>${document.compatMode}</b> (CSS1Compat = standards mode)</li>
    <li>head children: <b>${[...document.head.children].map((e) => e.tagName.toLowerCase()).join(', ')}</b></li>
    <li>title: <b>${document.title}</b></li>
    <li>body visibility when JS started: <b>${vis_at_start}</b></li>
    <li>body visibility just before JS rendered: <b>${vis_before_render}</b></li>
    <li>CLS: <b id="cls">…</b> (final value ~1s after render)</li>
    <li>body.innerHTML starts with: <b>${raw.trimStart().slice(0, 40).replace(/</g, '&lt;')}</b></li>
  </ul>
  <p style="font-family:sans-serif"><a href="../">back</a></p>`

setTimeout(() => { document.getElementById('cls').textContent = cls.toFixed(4) }, 1000)
log_time()

function log_time() {
  // eslint-disable-next-line no-console
  console.log(`rendered at ${Math.round(performance.now())}ms since nav, ${Math.round(performance.now() - t0)}ms after module ran`)
}
