# Fail-open tests

If blogtini's JS never loads, a page should still show its text -- not stay blank.  The build's head line does it
w/ CSS alone: hide the body briefly, then show it regardless:
```html
<style>body{white-space:pre-wrap;animation:h 3s}@keyframes h{0%,to{visibility:hidden}}</style>
```
- the animation *is* the hiding: hidden at both ends for 3s, no `forwards` -- so when it ends, `body` is
  `visible` again.  JS stops it early (`style.animation = 'none'`) as soon as it renders, so visitors never wait.
- `white-space:pre-wrap` keeps the raw markdown's line breaks for no-JS readers (JS resets it when it renders).
- hidden at first on purpose: no flash of raw markdown, and no layout shift (CLS only counts *visible* content,
  so `visibility: hidden` is as good as `display: none` there).

Who the 3s reveal is for: browsers that apply CSS but never run our JS -- JS off, NoScript, a blocking proxy,
esm.archive.org or blogtini.com down, a browser too old for ES modules.  Crawlers & text browsers don't apply
CSS, so they see the text regardless; screen readers ride along in normal JS browsers.


## Running them
Serve the repo, open `test/fail-open/`, and click through (also w/ JS disabled in DevTools: Cmd-Shift-P →
"Disable JavaScript").  CLS for every page, JS on & off (headless Chrome, 1280×800, Chrome's own layout-shift
events, no npm deps):
```sh
test/fail-open/cls.js
CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' test/fail-open/cls.js   # on a Mac
```


## Results (2026-10-03 Chrome; 2026-10-11 Safari, visual only)
- `<!DOCTYPE html>` alone (no html/head/body tags): still standards mode; `title`, `meta`, `style` land in `<head>`
- no JS: blank ~3s, then the raw markdown (`nojs-prewrap/` keeps line breaks)
- JS at 1s: blank, then rendered -- the markdown is never seen
- JS at 5s: raw markdown at 3s, swapped at 5s

| page | CLS, JS on | JS off |
|---|---|---|
| `shift-control/` (JS pushes visible text down 300px -- proves the measuring works) | 0.1222 | 0 |
| `nojs/`, `nojs-prewrap/` | 0 | 0 |
| `js-fast/` (renders at 1s, while hidden) | 0.0006 * | 0 |
| `js-slow/` (raw markdown visible at 3s, whole body replaced at 5s) | 0.0006 * | 0 |

\* the test's own `reveal.js` updating its "CLS: …" text -- identical for both, not the hiding.

So even the slow-JS swap scores 0: replacing all of `body.innerHTML` makes new elements, and a shift only counts
for an element that exists before *and* after.  Real themes still get CLS from fonts, images, web component layout.


## Other ways to hide the body (considered)
| option | no flash | people w/o JS | why not |
|---|---|---|---|
| nothing hidden | ✗ | ✓ | raw markdown flashes, then swaps, on every visit |
| `body{display:none}` (pre-v2) | ✓ | ✗ blank forever | |
| **`visibility:hidden` + 3s reveal** | ✓ if JS < 3s | ✓ after 3s | **chosen** |
| `opacity:0` + 3s reveal | ✓ if JS < 3s | ✓ after 3s | invisible text stays in the a11y tree: screen readers read it, Tab/click hit its links |
| `<body hidden>` | ✓ | ✗ | an author rule can override it -- then it's the chosen row, plus reader-mode skips the body |
| `<template>` wrapper | ✓ | ✗ never shown | spec parsers put it in a separate fragment, so crawlers may miss the text |
| `<template shadowrootmode>` | -- | ✓ | not a hiding tool: shows *server-rendered* components before JS (needs a build that renders `bt-*` to HTML -- someday?) |
| custom wrapper + `:not(:defined)` | ✓ if JS < 3s | only w/ the same reveal | breaks `markdown_parse()` (body would start w/ the wrapper tag) |
