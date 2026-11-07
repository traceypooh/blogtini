# renoirb's open issue & PRs, vs. blogtini today

Notes to revisit before reconnecting. Checked 2026-10-11 against 1.0.9 + main.
All four were opened in 2023, before 1.0.0.

| # | what | opened | status today |
|---|---|---|---|
| [#4](https://github.com/traceypooh/blogtini/issues/4) | issue: comments not showing / Staticman failing | 2023-02-05 | **fixed**: close w/ thanks |
| [#5](https://github.com/traceypooh/blogtini/pull/5) | draft PR: "WIP: Suggestions in refactor" | 2023-02-17 | **mostly absorbed in spirit**: diff won't apply |
| [#6](https://github.com/traceypooh/blogtini/pull/6) | PR: date formatting outside of components | 2023-06-17 | **not merged**: partly addressed differently |
| [#7](https://github.com/traceypooh/blogtini/pull/7) | draft PR: configurable markup parsing/transformation | 2023-06-18 | **not done**: possible 2.x direction |


## #4 — "Bug report comments" (issue)

**He reported:**
- comments on blogtini.com weren't displaying
- Staticman submissions didn't go through
- side ask: a custom element for comments, instead of repeated `.innerHTML` in `js/blogtini.js`

**My reply then (2023-02-21):** a known fixme — move blogtini.com to the "Staticman small deploy" (each comment
a JSON file in a PR on the blog repo), and either allow-list domains or accept comment POSTs from any blogtini site.

**Since then:**
- new staticman deploy + threaded replies (2025-01)
- Netlify serverless setup (1.0.4)
- comments from 2025 in the repo
- the side ask became `<bt-comments>` / `<bt-comment>` web components (2025-01)

**→ close as fixed, w/ thanks.**


## #5 — "WIP: Suggestions in refactor" (draft PR)

Targets the old `js/blogtini.js`; he said himself it didn't work yet ("wrote in a hurry, will trim & port back").
Also points at his own fork (custom elements, perf, separated concerns, tests).

**Big picture we agreed on then:**
- two parts: JS that crawls a sitemap/RSS to build tag/category maps + a swappable `theme.js`
- browser-native only, no build step if possible, no `.ts`

**His suggestions → what landed since:**

| suggestion | today |
|---|---|
| separate crawling/indexing from rendering; pluggable themes | ✅ themes are web components (2023), theme picker |
| derive site base url from `import.meta.url` (in `theme.js`) | ✅ in spirit: `theme_url()` via `import.meta.url` (1.0.6) |
| parse front matter via `textContent`, **not** `innerHTML` (it turns `&` into `&amp;`) | ✅ **solved in 1.0.9** — pages `fetch()` their own file for exact bytes. **He spotted this in 2023 — tell him!** |
| hand-written HTML links between pages, for SEO / no-JS | ✅ in spirit: `index.txt`; planned homepage `bt:index` list (V2.md) |
| conditional requests (`Last-Modified` / 304) to keep indexes fresh | ~ partly: dev self-fetch uses `cache: 'no-cache'` (revalidates) |
| rename `top_dir` to something clearer | ❌ still `top_dir` |
| simplify `pathrel` (the `xxxx generalize` TODOs) | ❌ still there in `main()` |
| `<template>` + clone + `appendChild`, not `innerHTML` (avoids double-mounting custom elements) | ❌ `bt_body()` still sets `body.innerHTML` |
| keep initial markdown hidden instead of wiping the DOM | ✅ in spirit: fail-open head line hides body until render (1.0.5) |
| make it explicit that `parse_posts` gets `Response` objects | ~ comment says so; `fetch_post()` doc says text or `Response` |
| theme-level stylesheet instead of hardcoded `blogtini.css` | ✅ CSS lives in theme web components (1.0.2), `index.css` per theme |
| rename `.mjs` → `.js` | ✅ n/a now (all `.js`) |
| IndexedDB for search | ❌ still localStorage |
| lighter than Lit (Enhance-style `html` tag), progressive enhancement (`a[is=…]`, `pre[is=…]`) | ❌ still Lit |
| SSR (nginx njs / Cloudflare) | ~ different route: the build prepends a head line; 2024 lit-SSR experiment (`test/ssr.js`) |

**→ close w/ a short "here's what landed" note + credit for the `textContent` / `&amp;` catch.**


## #6 — "Separate concern date formatting outside of component"

**His idea:** format dates in *one* place, configurably:
- `<bt-time datetime="…" data-date-human-format="ddd MMM DD, YYYY">` element
- new `js/context-date.js`: a context event carries the date; a handler returns ISO / unix / human strings
- payload validation (`isValidObject_DateConversion`, which keys can't be empty), dayjs formats, multiple formats
- per-component "contract" checks (required slots/attributes) before `customElements.define`

**Today:**
- there's one shared `datetime()` helper in `index.js` that components use — so "one place", but not configurable
- theme files have moved/changed since; would need a rebase or rewrite

(Got *very* specific — he was really into it at the time. Hard to follow then; worth asking what the core want
was: configurable date formats? i18n? something else?)


## #7 — "Configurable Markup parsing and transformation" (draft; builds on #6)

**His idea:** bring-your-own markdown renderer, and swappable default components:
- new `<bt-un-markup>` component that only *applies* already-converted HTML — the conversion happens elsewhere
- `js/init.js` registers components from a list; a `context-request` listener handles date conversion + markup transform
- defaults are provided but **not** registered right away, so a site can supply its own (treat blogtini like
  any other site importing it)
- TODO (his): check a replacement component's "interface" (slots, attributes) before registering it;
  make the context handlers overridable
- uses the web-components community `context-request` protocol

**Today:** not done. A reasonable 2.x "pluggable renderer / components" direction — but big, and a fresh start
on 1.0.9 more than a rebase.


## Reconnecting — a possible framing
- close #4 as fixed, thanks!
- close #5 w/ the "what landed" table above, crediting the `textContent` / `&amp;` catch (fixed in 1.0.9)
- ask if he's still interested in the #6 / #7 direction — configurable dates, pluggable renderer & components
  via context events — as a 2.x track, built fresh on 1.0.9
