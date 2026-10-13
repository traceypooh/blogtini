// Why does `node bin/build-node.js` fail (silently) in Code App?  Run from the repo top:  node test/node-probe.js
// (or open it & press ▶).  Each step logs w/ console.log -- stderr may not show in Code App.

/* eslint-disable no-console, no-undef */
const say = (...args) => console.log(...args)
process.on('uncaughtException', (e) => say('UNCAUGHT:', e?.stack ?? e))
process.on('unhandledRejection', (e) => say('UNHANDLED:', e?.stack ?? e))
process.on('exit', (code) => say('exit code:', code))

async function step(name, fn) {
  try {
    say('ok  ', name, await fn() ?? '')
    return true
  } catch (e) {
    say('FAIL', name, '\n    ', e?.stack ?? e)
    return false
  }
}

await step('node', () => `${process.version} ${process.platform} ${process.arch}  cwd: ${process.cwd()}`)
const mod = await import('node:module')
await step('module.register', () => typeof mod.register)
await step('module.registerHooks', () => typeof mod.registerHooks)
await step('worker_threads', async () => typeof (await import('node:worker_threads')).Worker)
await step('fetch', () => typeof fetch)
await step('local ESM import (bin/deno.js)', async () => Object.keys(await import('../bin/deno.js')))
await step('config.yml here', async () => (await import('node:fs')).existsSync('config.yml'))
await step('fetch js-yaml', async () => (await fetch('https://esm.ext.archive.org/js-yaml@4.1.0')).status)

if (await step('register hooks', () => mod.register('../bin/https-hooks.js', import.meta.url))) {
  // hooks run on a worker thread -- a hang here (no more output) points at that
  const timer = setTimeout(() => say('...still waiting on https import after 15s'), 15000)
  await step('https import (js-yaml)', async () => typeof (await import('https://esm.ext.archive.org/js-yaml@4.1.0')).default)
  await step('import js/text.js', async () => Object.keys(await import('../js/text.js')))
  clearTimeout(timer)
}
say('done')
