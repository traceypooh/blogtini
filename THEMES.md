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

- blogtini's `THEMES` export (in `index.js`) lists the shipped themes -- for each theme's theme picker.

Two styles so far:

| theme | DOM | notes |
|---|---|---|
| `future-imperfect` | lit, shadow DOM | the original.  css split into per-component chunks (`css.js`) |
| `grid` | lit, shadow DOM | imports future-imperfect; just redefines the list of posts |
| `editorial` | plain custom elements, light DOM | HTML5 UP's original `main.css`, as is |
| `massively` | plain custom elements, light DOM | HTML5 UP's original `main.css`, as is |
| `phantom` | plain custom elements, light DOM | HTML5 UP's original `main.css`, as is |
| `striped` | plain custom elements, light DOM | HTML5 UP's original `main.css`, as is |
| `forty` | plain custom elements, light DOM | HTML5 UP's original `main.css`, as is |

`theme/html5up/` (not a theme) has what the light DOM HTML5 UP ports share -- one copy, so the browser
fetches it once, eg: while flipping thru themes w/ the picker:
- `shared.js` -- helpers: escaping, menu & theme picker items, social icons, prior/next links, comments,
  tag cloud, contact form, code highlighting, etc.
- `fontawesome/` -- the Font Awesome 5 css & webfonts every HTML5 UP theme ships (all identical)
- `fonts.css` & `fonts/` -- self-hosted fonts, in place of their Google Fonts.
  (Browsers only download the ones a theme uses)

No symlinks: GitHub Pages & the esm.ext.archive.org mirror may not follow them, nor Windows checkouts.


## Adding an HTML5 UP theme
HTML5 UP themes are one global `main.css` + plain markup + a little jQuery.  So go light DOM, like `editorial`:

- Copy in its `assets/css/main.css` (+ `LICENSE.txt`) as is.  Plus any images its css uses
  (eg: massively's `images/` background, striped's `assets/css/images/` stripes).
  Skip its `fontawesome-all.min.css` & `webfonts/` (see `theme/html5up/`), and its jQuery js
  (`main.js`, `util.js`, `breakpoints`, `browser`, `scrollex`, ...) -- port what it does to vanilla js.
- In `main.css`, change just its two top `@import` lines:
  - Font Awesome => `@import url(../../../html5up/fontawesome/css/fontawesome-all.min.css);`
  - Google Fonts (third-party IP leak) => a comment.  Add any fonts `theme/html5up/fonts.css` doesn't have yet
    (eg: woff2s from the `@fontsource/*` npm packages).
- `index.js`: define each `bt-*` element as a plain `HTMLElement` that writes the theme's own markup.
  `<bt-body>` stays put (blogtini finds it by name) and moves the content it was given into the theme's main column.
  The others `replaceWith()` plain html -- HTML5 UP css uses child selectors (eg: `#main > .inner > section`),
  so a wrapper element in between breaks it.  (If the theme's `<body>` is a flex/grid container -- eg: striped --
  make `bt-body { display: contents }`)
  Use the helpers in `theme/html5up/shared.js`.
- `index.css`: `@import` the original `main.css` & `../html5up/fonts.css`, then any blogtini additions after them.
  Always add `#main { min-width: 0 }` (or the theme's main column) & `#main pre { overflow-x: auto }` --
  else a long line in a code block widens the page.
- Add its dir name to `THEMES` in blogtini's `index.js` (the theme pickers).

Other HTML5 UP themes that could be next ports:
- Strata


## Editorial
Port of https://html5up.net/editorial (2026-10-18).

What changed from the HTML5 UP download:
- `assets/css/main.css`: just its two `@import` lines -- Font Awesome => the shared `theme/html5up/` copy,
  Google Fonts => a comment.  Otherwise as is.
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
- [ ] home page w/ its own content: no `#banner` then.  Maybe show the newest post as a banner below it, too?
- [ ] dark scheme is partial -- `main.css` hardcodes colors in many places (borders, tables, buttons, inputs)
- [ ] check phone widths (<= 736px: the toggle button & sidebar overlay) and the 981-1280px collapsed sidebar


## Massively
Port of https://html5up.net/massively (2026-10-18).

What changed from the HTML5 UP download:
- `assets/css/main.css`: just its two `@import` lines -- Font Awesome => the shared `theme/html5up/` copy,
  Google Fonts => a comment.  Otherwise as is.
  (`images/bg.jpg` & `overlay.png` are its background)
- jQuery `main.js` => vanilla js in `index.js`: nav panel at phone widths (<= 980px) & its toggle button,
  intro fades out as you scroll, smooth "Continue" scroll, `is-preload`.
  Left out: the background parallax -- it stays fixed (as the original does on hi-dpi screens & phones).

Mapping:
- home page (first page): the big `#intro` (site title & intro paragraph), then newest post as the `.post.featured`,
  the rest as the 2-column `.posts` grid
- nav bar: menu, plus dropdowns for the theme picker & search (Massively has none) -- and the lightbulb & RSS icons.
  (The other social icons are in the footer -- a dozen+ icons won't fit in the nav bar)
- footer: about & recent posts | categories, tags, contact, social
- single post: `.post` w/ `header.major`, featured image, body, categories & tags, comments
- pagination: prior / page number / next.  On a post: the prior & next posts' titles

### TODO / FIXME
- [ ] pagination shows just the current page number (blogtini doesn't know the number of pages, before the last)
- [ ] dark scheme is partial -- like editorial
- [ ] check phone widths: the nav panel, & our dropdowns inside it
- [ ] no `#intro` on pages other than the first homepage page (the original has it only on its index, too)


## Phantom
Port of https://html5up.net/phantom (2026-10-18).

What changed from the HTML5 UP download:
- `assets/css/main.css`: just its two `@import` lines -- Font Awesome => the shared `theme/html5up/` copy,
  Google Fonts => a comment.  Otherwise as is.
- jQuery `main.js` => vanilla js in `index.js`: slide-out menu, auto-growing textareas, `is-touch`, `is-preload`.

Mapping:
- header: site image as the logo's "symbol" (instead of Phantom's `logo.svg`), site title, "Menu"
- slide-out menu: search, menu links, Scheme, theme picker
- home page (first page): intro (site title & intro paragraph), then every post as a colored tile
  (style1-6, in turn; title & a short summary show on hover)
- footer: about, contact & recent posts | social icons, categories, tags
- single post: title, date, featured image, body, categories & tags, comments
- prior & next buttons below the tiles, or a post

### TODO / FIXME
- [ ] posts w/o a featured image (or other image) all get the site image -- so their tiles look alike,
      but for the color
- [ ] dark scheme is partial -- like editorial
- [ ] check phone widths & touch (tiles show their summaries on hover only)


## Striped
Port of https://html5up.net/striped (2026-10-18).

What changed from the HTML5 UP download:
- `assets/css/main.css`: just its two `@import` lines -- Font Awesome => the shared `theme/html5up/` copy,
  Google Fonts => a comment.  Otherwise as is.
  (`assets/css/images/bg01.png` & `bg02.png` are its stripes)
- jQuery `main.js` => vanilla js in `index.js`: title bar & slide-out sidebar (<= 1000px), `is-preload`.
- Striped's `<body>` is the flex container for `#content` & `#sidebar` -- so `<bt-body>` is `display: contents`.
- Striped has no `ul.icons` -- `index.css` adds a little css for the social icons row.

Mapping:
- `#content`: each post as a `.post-excerpt` -- title, categories as the subtitle, Striped's date & "stats"
  (reading minutes, number of tags), featured image, summary, "Continue Reading"
- sidebar: logo (site title), menu + Scheme, search, about, recent posts, categories, tags, theme picker,
  social icons, copyright
- single post: the same, w/ the whole body, categories & tags, comments
- pagination: previous / page number / next.  On a post: previous & next post

### TODO / FIXME
- [ ] Striped's sidebar calendar isn't ported -- could show the posts in the month of the newest post
- [ ] dark scheme is partial -- like editorial
- [ ] check phone widths: title bar & slide-out sidebar


## Forty
Port of https://html5up.net/forty (2026-10-18).

What changed from the HTML5 UP download:
- `assets/css/main.css`: just its two `@import` lines -- Font Awesome => the shared `theme/html5up/` copy,
  Google Fonts => a comment.  Otherwise as is.
  (`images/banner.jpg` is its banner background)
- jQuery `main.js` => vanilla js in `index.js`: tiles (image as background, whole tile a link, fade out on click),
  header see-through over the banner, menu overlay, smooth "Get Started" scroll, `is-preload`.
  Left out: the banner parallax.

Mapping:
- home page (first page): `#banner` (site title & intro paragraph, over Forty's `banner.jpg`), then every post
  as an image tile w/ its title & a short summary
- menu overlay: search, menu links, Scheme, theme picker
- contact area: about, Learn More & Contact | recent posts, categories, tags
- footer: social icons, copyright
- single post: title, date, featured image, body, categories & tags, comments
- prior & next buttons below the tiles, or a post

### TODO / FIXME
- [ ] banner background is Forty's own `banner.jpg` -- maybe a `config.yml` option for the site's own
- [ ] Forty is dark already -- its "dark" scheme just deepens the background
- [ ] check phone widths & the menu overlay


## HTML5 UP ports: shared TODO / FIXME
- [ ] Share menu (`<bt-share>`) not ported
- [x] the theme picker's list was copied into each theme -- now blogtini's `THEMES` export (2026-10-18)
- [ ] comments reuse future-imperfect's `<bt-comments>` (lit, shadow DOM) -- so they look like future-imperfect.
      Port to light DOM, styled by `main.css` forms & buttons
- [ ] `html5up/shared.js` imports all of `future-imperfect/css.js` (~2400 lines, w/ lit) just for `css_hljs`
      (code highlight colors).  Move `css_hljs` somewhere shared
- [ ] social icons are a subset of future-imperfect's `socnet_icon()` list -- share one list
- [ ] self-hosted fonts are the latin subset only (other scripts fall back to system fonts)
- [ ] ignores `config.yml` `attribution` (its default credits future-imperfect); always credits HTML5 UP (CC BY 3.0)
- [ ] `cfg.site_header` image (blogtini logo) isn't used
- [ ] after switching away w/ the picker, a theme's page-wide scroll/click/resize listeners stay
      (they no-op w/o its elements)


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
