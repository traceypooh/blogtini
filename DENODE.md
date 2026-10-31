# DENODE: one JS codebase that runs on Deno *and* Node

**Status:**
- **Done:** [bin/https-hooks.js](bin/https-hooks.js) works on Node from the Mac CLI (2026-10-11).
- **Done:** `bin/build.js` runs on both Deno and Node (2026-10-12), via [bin/deno.js](bin/deno.js) (option B below). Deno and Node write byte-identical output on the Mac. This includes Node run with `--no-experimental-detect-module`, standing in for Node 18.
- **Done:** Code App's real Node 18.19: ▶ on the build ran the full build (2026-10-12).
- **Chosen:** keeping `Deno.*` code via an *exported* (not global) `Deno`: `import { Deno } from './deno.js'`. On Deno it's the real `Deno`; on Node it's a small `node:*` shim. Porting to plain `node:*` (option A, section 1) was also built and verified, and is the fallback if the shim gets annoying.
- **2026-10-13:** no more separate Node entry file. `build.js` registers the hooks itself (section 3).

**Why:**
- Deno's future is uncertain.
- Node is everywhere, including the iOS Code App (its ▶ button runs `node <file>`).
- Most of our Deno scripts barely use Deno-only features.

**The general idea, for any repo with Deno scripts:**
1. Use `node:` built-ins (`node:fs`, `node:process`, …) instead of `Deno.*`. Deno supports `node:` imports natively, so this is one code path with no `if (globalThis.Deno)` branches.
2. Keep importing ES modules from https URLs (eg: `https://esm.archive.org/js-yaml@4.1.0`), the same way browsers and Deno do. Node can't do that natively, so a small **loader hook** fetches them, with a **local cache** for repeat and offline runs.
3. The script **registers the hook itself**, on Node only, then loads its https imports with `await import()`. Same file for both.

Then `node bin/build.js` works from a Mac/Unix CLI, from CI, and from Code App's ▶. `deno run … bin/build.js` keeps working unchanged.


## 1. `Deno.*` → `node:*`

| Deno | Node (also works in Deno) |
|---|---|
| `Deno.readTextFileSync(p)` | `readFileSync(p, 'utf8')` from `node:fs` |
| `Deno.writeTextFileSync(p, s)` | `writeFileSync(p, s)` |
| `Deno.statSync(p)` | `statSync(p)` |
| `Deno.readDirSync(d)` | `readdirSync(d, { withFileTypes: true })` (**note:** `e.isDirectory()` is a *method* here, not a property) |
| `Deno.env.get(k)` | `process.env[k]` from `node:process` |
| `Deno.args` | `process.argv.slice(2)` |
| `Deno.exit(n)` | `process.exit(n)` |

Deno's `--allow-read` / `--allow-write` / `--allow-env` flags still apply when Deno runs the script. Node simply doesn't check them.


## 2. The loader hook, with a cache: `bin/https-hooks.js`

Node's [module customization hooks](https://nodejs.org/api/module.html#customization-hooks) (`module.register()`) are available in Node 20.6+ and were backported to 18.19, which is the version Code App ships. They replace the removed `--experimental-network-imports` flag, and Node's docs include an import-from-HTTPS example.

**The hooks:** [bin/https-hooks.js](bin/https-hooks.js), about 50 lines with no dependencies, so it can be copied into other repos as-is.
- `resolve`: passes `https://` imports through. Relative imports inside an https module (eg: esm.sh-style `/js-yaml@4.1.0/es2022/js-yaml.mjs`) resolve against that module's URL.
- `load`: fetches https modules through the cache.

**Cache policy:**
- An exact-version URL (`pkg@1.2.3`) never changes, so it's cached forever.
- Anything else (`pkg`, `pkg@1`) is re-fetched after `MAX_AGE_DAYS` (30).
- If a fetch fails (eg: offline), a stale cached copy is used.

**Try it:** `node bin/build.js` (or ▶ in Code App). It loads the real `js/text.js`, which imports js-yaml and showdown over https. A second run should work offline.

**Cache location:** `~/.cache/denode/`, shared by every repo on the machine. Works in Code App, too: the build
there succeeds, and the hooks fail if they can't write the cache. (If it ever doesn't, the fallback would be a
repo-local `.cache/denode/`, gitignored.)


## 3. One file for both: the script registers the hooks itself

The catch: **static** imports resolve before any code in the file runs. So on Node, a static https import
(or a static import of a local file that has one) fails before the script could register the hooks.

The rule: **static imports only for files Node resolves natively** (`node:*`, and local files whose own
imports are only `node:*`). Everything else comes via `await import()`, *after* the guard:

```js
import { Deno } from './deno.js'               // only node:* inside -- fine statically, on both

if (!globalThis.Deno) {                         // Node (deno.js never sets the global)
  const { register } = await import('node:module')
  register('./https-hooks.js', import.meta.url)
}
const { default: yml } = await import('https://esm.archive.org/js-yaml@4.1.0')
const { markdown_parse, markdown_to_html } = await import('../js/text.js')   // has https imports
```

- **Detecting Node:** `globalThis.Deno` alone is enough. `deno.js` deliberately doesn't set the global, and inside
  the script the name `Deno` is the *imported* binding, so test `globalThis` explicitly.
- **Deno is unchanged:** top-level `await import()` works there, `--allow-import=…` covers dynamic imports too, and
  the register branch never runs.
- **Mac/Unix/CI:** `node bin/build.js`, with no flags. **Code App:** open `bin/build.js`, press ▶.
- **Cost:** a couple of static imports become dynamic, which linters and editors' jump-to-definition handle less nicely.
- **Alternative:** keep the script pristine, and run it via a small Node entry file (below).

### Alternative: keep a Deno script pristine, w/ a Node entry file
For a script whose top you'd rather not touch, eg: a Deno tool w/ 10–20 static imports (https ones included).
The script stays as-is (except, eventually, `import { Deno } from './deno.js'` — see below). A tiny entry file
registers the hooks *first*, then dynamically imports the script, so its static imports go through the hooks:

```js
// bin/tool-node.js -- Node entry for tool.js.  `deno run … tool.js` doesn't need this.
import { register } from 'node:module'

register('./https-hooks.js', import.meta.url)
await import('./tool.js')
```
(This is how `bin/build.js` first ran on Node, as `bin/build-node.js`, before it registered the hooks itself.)

- run: `node bin/tool-node.js [args]` — the script sees the args as usual (`Deno.args` / `process.argv.slice(2)`)
- Code App: open the entry file, press ▶ — so it needs one entry file per script (▶ can't pass args)
- `Deno.*` in the script: it still needs a `Deno` on Node. Either `import { Deno } from './deno.js'` (the one-line
  change), or have the entry file set the global before importing:
  `globalThis.Deno ??= (await import('./deno.js')).Deno` — but then `globalThis.Deno` checks anywhere (the
  script, its libs) think they're on Deno. Check `Deno.denode` to tell.
- on a CLI only, no entry file at all: `node --import ./bin/https-hooks-register.js script.js`, where that file is
  just the `register()` line (impossible with ▶)

**Someday: one generic runner** for any script, instead of an entry file per script:
```js
// bin/denode-run.js -- eg:  node bin/denode-run.js bin/build.js --seo
import { register } from 'node:module'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

register('./https-hooks.js', import.meta.url)
const [script] = process.argv.splice(2, 1) // drop it, so the script sees just its own args at argv[2…]
await import(pathToFileURL(script).href)
```
Untested sketch. Do the `splice()` before anything imports `deno.js`: its `args` is read once, when it loads.


## Gotchas

- **`.js` must load as an ES module.** Node 18 treats a `.js` file as CommonJS unless the nearest `package.json` says `"type": "module"`. Newer Node detects ESM syntax automatically, but Code App's 18.19 doesn't. Fix: a top-level `package.json` containing `{ "type": "module" }`. Use `.js`, not `.mjs`, for every file, because Code App's ▶ wants `.js`.
- **No `fetch()` on iOS Node.** Node 18's `fetch` is undici, whose HTTP parser is WebAssembly. iOS apps have no JIT, so Code App's Node has no `WebAssembly`. `typeof fetch` still says `function`, but the first call throws or crashes Node, silently when it happens in the hooks' worker thread. So the hooks use `node:https` instead. To test on a Mac: `node --jitless …`, which also turns WebAssembly off.
- **`module.register()` is deprecated in Node 26** (DEP0205, a runtime warning) in favor of `module.registerHooks()`. But `registerHooks()` hooks are synchronous, so they can't `await fetch()`, and Node 18 doesn't have `registerHooks()`. Keep `register()` for now. Before it's removed, a sync fetch is needed, eg: a worker plus `Atomics.wait`, or `execFileSync('curl')`.
- **Shebang lines are fine.** `#!/usr/bin/env -S deno run …` at the top of `build.js` is valid in Node, since ESM allows a hashbang first line.
- **Redirects:** if an https module URL redirects, its relative imports should resolve against the *final* URL (`res.url`), not the requested one. esm.sh-style mirrors mostly use stub modules rather than redirects, but `load` should handle redirects if they come up.
- **Only ES modules come over https.** `format: 'module'` is assumed. JSON, wasm and CommonJS over https aren't handled, and esm.sh-style mirrors serve ESM anyway.


## What this does *not* cover, when porting other repos

- **`npm:` and `jsr:` specifiers** (Deno-only). Swap them for an esm.sh-style https URL, or use `package.json` + `node_modules`.
- **Deno-only APIs** like `Deno.serve`, `Deno.Command` and `Deno.Kv`. These need real equivalents (`node:http`, `node:child_process`, …), not a one-line swap.
- **TypeScript.** Node 22.6+ can strip types (on by default in 23.6+), but Node 18 can't. Plain JS with JSDoc is the portable choice.
- **Bun.** It has no https imports, and its plugin API is different. "Isomorphic" here means Deno + Node.


## Future: a general `denode.js`

A reusable file for any repo, which could grow into its own small project. It would hold:
- **The https hooks with cache** (today's [bin/https-hooks.js](bin/https-hooks.js)).
- **An optional `Deno` shim for Node:** `globalThis.Deno ??= { readTextFileSync, writeTextFileSync, readDirSync, statSync, env, args, exit, … }`, each a few lines over `node:fs` / `node:process`. It grows one call at a time, as scripts need them.
- **A `run(script)` helper:** registers the hooks, installs the shim, then `await import(script)`.

**Two ways to handle `Deno.*`, which mix well:**
- **A. Port to `node:*`** (sections 1–3 above). The code runs natively on both, with no shim to keep in sync. Prefer this for code we own and touch anyway.
- **B. Shim the `Deno` global.** Existing scripts run on Node unchanged. Use this for scripts we don't want to touch yet.

**Shim gotchas:**
- **Environment checks get fooled.** Code that detects Deno via `globalThis.Deno` gets the wrong answer: blogtini's `index.js` does this in `fetcher()`, `main()`, etc. So the shim should mark itself (eg: `Deno.denode = true`), and such checks should test for the feature they need.
- **No sandbox.** `--allow-read` etc don't exist on Node, so it's harmless but unprotected.
- **Prior art:** Deno's own `@deno/shim-deno` (npm, from their `dnt` tool) implements much of the `Deno` namespace on Node. Worth reading, or using, even if ours stays small. It's unknown whether it loads cleanly through an esm.sh-style mirror.

**Self-loading from a URL** (eg: `https://esm.archive.org/…/denode.js`):
- **Chicken-and-egg:** Node can't import the hooks over https until the hooks are installed.
- **The way around it:** `module.register()` accepts a `data:` URL. A tiny local bootstrap `fetch()`es the hooks' source and registers it as `data:text/javascript,…`. Everything after that (the shim, the script's imports) comes over https through the cache.
- **First run needs the network.** The bootstrap's own fetch has no cache until it keeps one.
- **Host the hooks as a plain static file.** esm.sh-style mirrors may rewrite the module.
- **Pin it to an exact version.** Every Node run executes code from that URL.

**Package idea: `deno-polyfill` (or `denode`)**
- **Names:** `deno-polyfill` was free on npm (2026-10-13). `denode` is taken by an old 2017 debugger
  (steelbrain, v1.10.5), but still a fine *project* name — esp. w/ the extras (https imports + cache).
- **It's really a "ponyfill":** it *exports* `Deno` instead of setting the global, so libs' `globalThis.Deno`
  checks don't get fooled. `deno-polyfill` is what people search for, though. A `deno-polyfill/global` entry
  could set the global, for the classic polyfill behavior.
- **Ship the hooks in it, too:** `deno-polyfill/register` registers `https-hooks.js`, the same pattern as `tsx`:
  `node --import deno-polyfill/register script.js`, or in-script (section 3): `await import('deno-polyfill/register')`.
- **Node gets it from npm**, not over https: `npm i deno-polyfill`, then `import { Deno } from 'deno-polyfill'`.
  An https import of it would need the very hooks it ships (chicken-and-egg, above).
- **Deno side:** esm.sh-style mirrors build npm packages for *browsers* by default, so a package of `node:fs`
  imports may not load cleanly from `esm.archive.org`. Serve its files raw (`?raw`) or as plain static files.
- **Why another one?** Small and grows as needed; https imports w/ a cache; runs on iOS Node (no WebAssembly,
  so `node:https`, not `fetch()`).
- **Prior art to read first:** Deno's own `@deno/shim-deno` (repo `denoland/node_deno_shims`, MIT; latest 0.19.2,
  2024-06-06; deps `which` + `@deno/shim-deno-test`; ESM + CJS builds). Its supported-API list is the generated
  `packages/shim-deno/PROGRESS.md`. Its readme doesn't say global vs. export.

**Each repo then needs** only its scripts, each starting with the 4-line register guard (section 3) — or the `data:` URL bootstrap.


## blogtini specifics

- **`bin/build.js`:** about 7 `Deno.*` calls (`readTextFileSync`, `writeTextFileSync`, `readDirSync`, `statSync`, `env.get`, `args`, `exit`).
- **https imports:** js-yaml (in `build.js`), plus js-yaml and showdown in the shared `js/text.js`. The browser and Deno are unaffected by the hooks.
- **CI:** could keep `denoland/deno:alpine`, or switch to the Node that's preinstalled on GitHub's ubuntu runners.
- **Optional: a ▶-able `index.txt` maker.** If it imports nothing over https, it needs no hooks at all. That means moving `SKIP_DIRS` out of `js/text.js` into its own dependency-free module.
