# Themes

A theme is a dir under `theme/` with an `index.js` (and optional `index.css`).
Pick one in `config.yml` (`theme: editorial`), or try them live from the theme picker.

## How a theme plugs in
blogtini's `index.js` finds and parses posts, then writes `<bt-body>` into `<body>`, with the page's main content
inside it: `<bt-posts>` (w/ `<bt-post>`s), `<bt-post-full>`, `<bt-histogram>` or `<bt-contact>`.
The theme defines those custom elements, and so decides what the page looks like.

- `index.css` is loaded into the page (light DOM) -- by `main()` for the configured theme,
  and swapped by the theme picker on a switch.  (Links get `data-theme-css`, so the old one gets removed.)
- The theme must call `reveal()` (from `index.js`) once it has rendered -- the body is hidden until then.
- blogtini looks for these ids in `<bt-body>` (its shadow root, or itself for a light DOM theme -- see `btbody_root()`):
  - `#theme-menu a` -- theme picker links.  The link text maps to the theme dir, eg: `future imperfect` => `future-imperfect`
  - `#search-input` and `#search-results` -- the sitewide search box (optional)

Two styles so far:

| theme | DOM | notes |
|---|---|---|
| `future-imperfect` | lit, shadow DOM | the original.  css split into per-component chunks (`css.js`) |
| `grid` | lit, shadow DOM | imports future-imperfect; just redefines the list of posts |
| `editorial` | plain custom elements, light DOM | HTML5 UP's original `main.css`, as is |


## Adding an HTML5 UP theme
HTML5 UP themes are one global `main.css` + plain markup + a little jQuery.  So go light DOM, like `editorial`:

- Copy in its `assets/css/` and `assets/webfonts/*.woff2` (+ `LICENSE.txt`) as is.
  Skip its jQuery js (`main.js`, `util.js`, `breakpoints`, `browser`) -- port what it does to vanilla js.
- Remove the Google Fonts `@import` at the top of `main.css` (third-party IP leak).  Self-host those fonts instead,
  w/ `@font-face` in the theme's `index.css`.  (eg: woff2s from the `@fontsource/*` npm packages)
- `index.js`: define each `bt-*` element as a plain `HTMLElement` that writes the theme's own markup.
  `<bt-body>` stays put (blogtini finds it by name) and moves the content it was given into the theme's main column.
  The others `replaceWith()` plain html -- HTML5 UP css uses child selectors (eg: `#main > .inner > section`),
  so a wrapper element in between breaks it.
- `index.css`: `@import` the original `main.css`, then any blogtini additions after it.
- Add the theme to each theme's picker list (see TODO below).

Other blog-ish HTML5 UP themes that would be natural next ports:
- Massively
- Striped
- Phantom
- Forty
- Strata


## Editorial
Port of https://html5up.net/editorial (2026-10-18).

What changed from the HTML5 UP download:
- `assets/css/main.css`: just its Google Fonts `@import` line, swapped for a comment.  Otherwise as is.
- jQuery `main.js` => vanilla js in `index.js`: sidebar toggle, collapsed by default at <= 1280px,
  menu openers (accordion), sidebar scroll lock, `is-preload`.

Mapping:
- home page: newest post as the big `#banner`, the rest as the `.posts` card grid
  (unless the home page has its own content -- then that, plus the card grid)
- sidebar: search, menu (+ Theme & Scheme), recent posts (`.mini-posts`), categories, tag cloud, about, footer
- single post: `header.main`, featured image, body, categories & tags, comments
- blogtini additions in `index.css`: self-hosted fonts, card dates, search results, tag cloud, dark scheme,
  and `#main { min-width: 0 }` (else a long line in a code block shoves the sidebar off screen)

### TODO / FIXME
- [ ] Share menu (`<bt-share>`) not ported
- [ ] the theme picker's list is copied into each theme (`future-imperfect/bt-body.js`, `editorial/index.js`) --
      have blogtini own the list (eg: a `THEMES` export, or `cfg.themes`)
- [ ] home page w/ its own content: no `#banner` then.  Maybe show the newest post as a banner below it, too?
- [ ] comments reuse future-imperfect's `<bt-comments>` (lit, shadow DOM) -- so they look like future-imperfect.
      Port to light DOM, styled by `main.css` forms & buttons
- [ ] imports all of `future-imperfect/css.js` (~2400 lines, w/ lit) just for `css_hljs` (code highlight colors).
      Move `css_hljs` somewhere shared, or into `editorial/index.css`
- [ ] dark scheme is partial -- `main.css` hardcodes colors in many places (borders, tables, buttons, inputs)
- [ ] social icons are a subset of future-imperfect's `socnet_icon()` list -- share one list
- [ ] self-hosted fonts are the latin subset only (other scripts fall back to system fonts)
- [ ] ignores `config.yml` `attribution` (its default credits future-imperfect); always credits HTML5 UP (CC BY 3.0)
- [ ] `cfg.site_header` image (blogtini logo) isn't used
- [ ] after switching away from Editorial w/ the picker, its page-wide scroll/click/resize listeners stay
      (they no-op w/o its `#sidebar`)
- [ ] check phone widths (<= 736px: the toggle button & sidebar overlay) and the 981-1280px collapsed sidebar


## Viewer picks & light/dark
A viewer's theme picker and "Scheme" lightbulb picks are kept for 24h, just for them (localStorage, per site) --
so people can try out themes and click around (eg: on blogtini.com).  The first pick shows a notice
(centered, over a dimmed page) that it's just for them -- at most once a day.  See `viewer_prefs()` in `index.js`.

Light/dark today: dark only if the viewer's OS prefers dark *and* it's nighttime (before 7am, from 6pm),
unless they picked one w/ the lightbulb.

### TODO
- [ ] `config.yml` setting for the site's light/dark, eg: `scheme: light | dark | auto` (default: `auto`, as now) --
      for an author who wants their site always light, or always dark.  Viewers can still override w/ the lightbulb
- [ ] lightbulb is only a light <=> dark toggle.  Once clicked, there's no way back to `auto` (until the 24h is up).
      Maybe a 3-way light / dark / auto picker -- where `auto` clears the viewer's pick
