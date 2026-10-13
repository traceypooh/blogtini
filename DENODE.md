# DENODE: one JS codebase that runs on Deno *and* Node

**Status:**
- **Done:** [bin/https-hooks.js](bin/https-hooks.js) works on Node from the Mac CLI (2026-10-11, via `test/denode.js`).
- **Done:** `bin/build.js` runs on both Deno and Node (2026-10-12), via [bin/deno.js](bin/deno.js) (option B below) and the Node entry file [bin/build-node.js](bin/build-node.js). Deno and Node write byte-identical output on the Mac. This includes Node run with `--no-experimental-detect-module`, standing in for Node 18.
- **Trying out:** keeping `Deno.*` code via an *exported* (not global) `Deno`: `import { Deno } from './deno.js'`. On Deno it's the real `Deno`; on Node it's a small `node:*` shim. Porting to plain `node:*` (option A, section 1) was also built and verified, and is the fallback if the shim gets annoying.
- **Still to test:** Code App's real Node 18 (▶ on `bin/build-node.js`).

**Why:**
- Deno's future is uncertain.
- Node is everywhere, including the iOS Code App (its ▶ button runs `node <file>`).
- Most of our Deno scripts barely use Deno-only features.

**The general idea, for any repo with Deno scripts:**
1. Use `node:` built-ins (`node:fs`, `node:process`, …) instead of `Deno.*`. Deno supports `node:` imports natively, so this is one code path with no `if (globalThis.Deno)` branches.
2. Keep importing ES modules from https URLs (eg: `https://esm.ext.archive.org/js-yaml@4.1.0`), the same way browsers and Deno do. Node can't do that natively, so a small **loader hook** fetches them, with a **local cache** for repeat and offline runs.
3. Node gets one tiny **entry file** that registers the hook, then dynamically imports the real script. Deno keeps running the script directly.

Then `node bin/build-node.js` works from a Mac/Unix CLI, from CI, and from Code App's ▶. `deno run … bin/build.js` keeps working unchanged.


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

**Try it:** `node test/denode.js` (or ▶ in Code App). It loads the real `js/text.js`, which imports js-yaml and showdown over https. A second run should work offline.

**Cache location:**
- Default: `~/.cache/denode/`, shared by every repo on the machine.
- Code App: its home dir may not be writable or may not persist. The fallback would be a repo-local `.cache/denode/`, gitignored. Needs testing.


## 3. The Node entry file: `bin/build-node.js`

```js
// Node entry for `build.js` -- `deno run … build.js` doesn't need this.
// Static imports resolve before any code runs, so: register the hooks first, then import dynamically.
import { register } from 'node:module'

register('./https-hooks.js', import.meta.url)
await import('./build.js')
```

- **Mac/Unix/CI:** `node bin/build-node.js`, with no flags.
- **Code App:** open `bin/build-node.js`, press ▶.
- **Alternative to an entry file:** `node --import ./bin/https-hooks-register.js bin/build.js`. That's fine on a CLI but impossible with ▶, so the entry file is the general solution.


## Gotchas

- **`.js` must load as an ES module.** Node 18 treats a `.js` file as CommonJS unless the nearest `package.json` says `"type": "module"`. Newer Node detects ESM syntax automatically, but Code App's 18.19 doesn't. Fix: a top-level `package.json` containing `{ "type": "module" }`. Use `.js`, not `.mjs`, for every file, because Code App's ▶ wants `.js`.
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

**Self-loading from a URL** (eg: `https://esm.ext.archive.org/…/denode.js`):
- **Chicken-and-egg:** Node can't import the hooks over https until the hooks are installed.
- **The way around it:** `module.register()` accepts a `data:` URL. A tiny local bootstrap `fetch()`es the hooks' source and registers it as `data:text/javascript,…`. Everything after that (the shim, the script's imports) comes over https through the cache.
- **First run needs the network.** The bootstrap's own fetch has no cache until it keeps one.
- **Host the hooks as a plain static file.** esm.sh-style mirrors may rewrite the module.
- **Pin it to an exact version.** Every Node run executes code from that URL.

**Each repo then needs** only its scripts, plus a 3–4 line Node entry file (or the `data:` URL bootstrap).


## blogtini specifics

- **`bin/build.js`:** about 7 `Deno.*` calls (`readTextFileSync`, `writeTextFileSync`, `readDirSync`, `statSync`, `env.get`, `args`, `exit`).
- **https imports:** js-yaml (in `build.js`), plus js-yaml and showdown in the shared `js/text.js`. The browser and Deno are unaffected by the hooks.
- **CI:** could keep `denoland/deno:alpine`, or switch to the Node that's preinstalled on GitHub's ubuntu runners.
- **Optional: a ▶-able `index.txt` maker.** If it imports nothing over https, it needs no hooks at all. That means moving `SKIP_DIRS` out of `js/text.js` into its own dependency-free module.
