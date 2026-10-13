/*
  Node module hooks: lets Node `import` ES modules from https urls (like browsers & Deno do),
  w/ a local cache -- so the same script runs on Deno *and* Node.  See DENODE.md.

  Register them before importing anything over https, eg: in an entry file:
    import { register } from 'node:module'
    register('./https-hooks.js', import.meta.url)
    await import('./build.js')

  Needs Node 18.19+ / 20.6+ (`module.register()`).
*/
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const CACHE_DIR = join(process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'), 'denode')
// re-fetch after this long -- except an exact version (eg: `js-yaml@4.1.0`) never changes, so keep it
const MAX_AGE_DAYS = 30


export function resolve(specifier, context, next) {
  if (specifier.startsWith('https://'))
    return { url: specifier, shortCircuit: true }

  // a relative import inside an https module, eg: esm.sh-style `export * from "/js-yaml@4.1.0/es2022/js-yaml.mjs"`
  if (context.parentURL?.startsWith('https://') && /^\.{0,2}\//.test(specifier))
    return { url: new URL(specifier, context.parentURL).href, shortCircuit: true }

  return next(specifier, context)
}


export async function load(url, context, next) {
  if (!url.startsWith('https://'))
    return next(url, context)

  return { format: 'module', source: await fetch_cached(url), shortCircuit: true }
}


/** @returns {Promise<string>} the module source at `url` -- from the cache, when fresh enough */
async function fetch_cached(url) {
  const file = join(CACHE_DIR, createHash('sha256').update(url).digest('hex'))
  const pinned = /@\d+\.\d+\.\d+/.test(url)
  try {
    if (pinned || Date.now() - statSync(file).mtimeMs < MAX_AGE_DAYS * 86400e3)
      return readFileSync(file, 'utf8')
    /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
  } catch {}

  try {
    const res = await fetch(url)
    if (!res.ok) throw Error(`HTTP ${res.status} ${url}`)
    const source = await res.text()
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(file, source)
    return source
  } catch (err) {
    // a stale copy beats failing, eg: offline
    try {
      return readFileSync(file, 'utf8')
      /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
    } catch {}
    throw err
  }
}
