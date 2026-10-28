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
  - `#theme-menu a` -- theme picker links.  The link text maps to the theme dir, eg: `future imperfect` => `future-imperfect`.
    (`.theme-menu a`, too -- for a 2nd picker, eg: in a phone width nav panel, since ids must be unique)
  - `#search-input` and `#search-results` -- the sitewide search box (optional)

- blogtini's `THEMES` export (in `index.js`) lists the shipped themes -- for each theme's theme picker.
- blogtini's `all_posts()` export returns every post & page it knows of, newest first (eg: striped's calendar).
- Sidebar side: each theme defaults to its own original layout (a `SIDEBAR_POSITION` const), unless
  `config.yml` `sidebar: { position: left | right | none }` pins it.  Defaults: future-imperfect, editorial,
  striped: left (fixed, so far); strongly-typed, helios: right (& they honor `position`).

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
| `strata` | plain custom elements, light DOM | HTML5 UP's original `main.css`, as is |
| `helios` | plain custom elements, light DOM | HTML5 UP's original `main.css`, as is |
| `strongly-typed` | plain custom elements, light DOM | HTML5 UP's original `main.css`, as is |
| `hyperspace` | plain custom elements, light DOM | HTML5 UP's original `main.css`, as is |

`theme/html5up/` (not a theme) has what the light DOM HTML5 UP ports share -- one copy, so the browser
fetches it once, eg: while flipping thru themes w/ the picker:
- `shared.js` -- helpers: escaping, menu & theme picker items, social links & icons, prior/next links, comments,
  tag cloud, contact form, code highlighting, etc.  And for the "classic" themes (helios, strongly typed, and
  dopetrope, zerofour, escape velocity, verti ... someday): vanilla js for their jQuery `dropotron` nav dropdowns
  (`dropdowns()`) and phone width nav panel (`nav_panel()`, `nav_panel_links()`).
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

Next HTML5 UP themes to port: see [Next ports](#next-ports) below.


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
- sidebar: logo (site title), menu + Scheme, search, about, recent posts, calendar, categories, tags,
  theme picker, social icons, copyright
- calendar: the month of the newest post (or, on a post, its month).  Days w/ posts link to them (hover: titles).
  Its caption's &lsaquo; &rsaquo; go to the prior/next month w/ posts, w/o a page load.  Weeks start Monday, like the original.
- single post: the same, w/ the whole body, categories & tags, comments
- pagination: previous / page number / next.  On a post: previous & next post

### TODO / FIXME
- [x] Striped's sidebar calendar (2026-10-18)
- [ ] calendar: a day w/ several posts links to the first (the rest are in its hover title)
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


## Strata
Port of https://html5up.net/strata (2026-10-18).

What changed from the HTML5 UP download:
- `assets/css/main.css`: just its two `@import` lines -- Font Awesome => the shared `theme/html5up/` copy,
  Google Fonts => a comment.  Otherwise as is.
  (`images/bg.jpg` & `assets/css/images/overlay.png` are the left panel's background)
- jQuery `main.js` => vanilla js in `index.js`: footer moves from the left panel to below `#main` (<= 980px),
  left panel background parallax (wide screens, not touch), `is-preload`.
  Left out: the image lightbox (poptrox) -- post thumbnails link to their posts instead.

Mapping:
- fixed left panel: site image as the avatar, site title, intro paragraph, our nav (Strata has none):
  menu + Scheme, search, theme picker -- then social icons & copyright
- home page (first page): newest post on top (title, image, summary, Read More), the rest as 2-column "work items"
  (thumbnail, title, date, summary)
- "About" section at the bottom, like Strata's "Get In Touch": about, Learn More & Contact | categories, tags
- single post: title, date, featured image, body, categories & tags, comments
- prior & next buttons below the posts, or a post

### TODO / FIXME
- [ ] a lightbox for images in posts (Strata's poptrox did one for its portfolio thumbnails)
- [ ] the left panel scrolls, if our nav makes it taller than the screen
- [ ] dark scheme is partial -- like editorial
- [ ] check phone widths: the panel becomes a top header, footer moves below the posts


## Helios
Port of https://html5up.net/helios (2026-10-18).

What changed from the HTML5 UP download:
- `assets/css/main.css`: just its two `@import` lines -- Font Awesome => the shared `theme/html5up/` copy,
  Google Fonts => a comment.  Otherwise as is.
  (`images/header.jpg` is its header background; `assets/css/images/arrow.svg` the carousel arrows.
  Its css also refers to an `assets/css/images/overlay.png` that isn't in HTML5 UP's download, either)
- jQuery `main.js` => vanilla js in `index.js` & `../html5up/shared.js`: carousel (hover its edge arrows to scroll;
  touch screens swipe), nav dropdowns (`dropotron`), phone width nav button & panel, smooth "Start" scroll, `is-preload`.
  Left out: the carousel's one-by-one fade in.
- Helios's full screen header is for `body.homepage` -- so blogtini's first homepage page keeps that class,
  & other pages (eg: `?page/2`, `?tags/x`) drop it.  (blogtini reads `homepage` just once, as it loads)

Mapping:
- header: site title, intro paragraph, "Start" (homepage) -- nav: menu, Theme & Search dropdowns, Scheme
- homepage (first page): banner (title & about), carousel of the newest posts, newest post featured,
  the rest in a 3-column grid
- single post: Helios's sidebar page -- the sidebar (about, recent posts, categories, tags) goes
  left, right or none: `config.yml` `sidebar: { position: left | right | none }` -- default: right
- footer: recent posts, categories, tags | about & social icons, copyright

### TODO / FIXME
- [ ] the carousel duplicates the homepage's posts (it's the newest 12 -- maybe the *older* ones?)
- [ ] dark scheme is partial -- like editorial
- [ ] check phone widths: nav button & panel (its theme picker & Scheme; no search in it yet)


## Strongly Typed
Port of https://html5up.net/strongly-typed (2026-10-18).

What changed from the HTML5 UP download:
- `assets/css/main.css`: just its two `@import` lines -- Font Awesome => the shared `theme/html5up/` copy,
  Google Fonts => a comment (Arvo is now in `theme/html5up/fonts/`, too).  Otherwise as is.
  (`images/banner.jpg` is its banner background; `assets/css/images/bracket.svg` a decoration)
- jQuery `main.js` => vanilla js in `../html5up/shared.js`: nav dropdowns (`dropotron`), phone width title bar & nav panel,
  `is-preload`.

Mapping:
- header: site title (Arvo), intro paragraph, nav w/ an icon per menu item -- from the `pre` icon in
  `config.yml` `menu.main` (else a file icon) -- plus Theme & Search dropdowns & Scheme
- homepage (first page): the 3 newest posts as "features", a banner (about), then the rest of the posts
- `#main`: posts (`.box.post`) & the sidebar -- recent post excerpts, about, categories, tags.
  The sidebar goes left, right or none: `config.yml` `sidebar: { position: left | right | none }` -- default: right
  (none: `body.no-sidebar`, as Strongly Typed's own no-sidebar page)
- footer: about, Learn More & Contact | social links w/ their names, copyright

### TODO / FIXME
- [ ] dark scheme is partial -- like editorial
- [ ] check phone widths: title bar & nav panel (its theme picker & Scheme; no search in it yet)


## Hyperspace
Port of https://html5up.net/hyperspace (2026-10-27).

What changed from the HTML5 UP download:
- `assets/css/main.css`: just its one `@import` line -- Font Awesome => the shared `theme/html5up/` copy.
  (No Google Fonts: it uses Arial & Courier New.)  Otherwise as is.  (`assets/css/images/intro.svg` is the intro's
  background; its demo `images/` aren't needed)
- jQuery `main.js` (scrollex & scrolly) => vanilla js in `index.js`, w/ `IntersectionObserver`: sections & the
  "features" fade up -- and each post's spotlight row slides in -- once they reach the middle of the screen;
  the sidebar link of the section in view lights up (a clicked one stays lit while scrolling to it); smooth scrolling
  for the sidebar & `.scrolly` links (offset by the sidebar, when it's a top bar); `is-preload`.
  Added: at the very bottom of the page, everything shows (a short last section may never reach the middle).
- `index.css` cycles Hyperspace's spotlight row tints (its demo has just 3 rows).

Mapping, like the original's two pages:
- homepage (first page): the fixed left `#sidebar` -- links to this page's Welcome, Posts, Explore & About
  sections, then our menu & Scheme (wide screens only: narrower, the sidebar is a one-line top bar) --
  & the full screen `#intro` (site title, intro paragraph, "Read")
- every other page: the original's generic page -- `#header` w/ the site title, menu & Scheme
- posts: each one a "spotlight" row -- its image (featured, else first, else the site's) as the row's background,
  title, date, summary, "Read more"
- "Explore" (every page): Hyperspace's "features" -- search, categories, tags, theme picker
- "About" (every page): like its "Get in touch" -- about, Learn More & Contact | site image, social icons
- single post: title, date, featured image, body, categories & tags, comments
- prior & next buttons after the posts, or a post

### TODO / FIXME
- [ ] Hyperspace is dark already -- its "dark" scheme just deepens the colors
- [ ] comments: future-imperfect's (light) look, on Hyperspace's purple
- [ ] check phone widths: the sidebar is hidden <= 736px -- so the homepage's only nav is in its sections
- [ ] the theme picker & search are down in "Explore" -- on a long page, that's a scroll


## HTML5 UP ports: shared TODO / FIXME
- [ ] the phone width nav panels (helios, strongly typed) have no search box yet
- [ ] `sidebar.position`: future-imperfect, editorial & striped could honor it, too (they're left only, so far)
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


## Next ports
Popularity = each template's **download count**, shown on its html5up.net page ("Download (511,929)")
-- all 44 templates, fetched 2026-10-18.  The counts are fairly flat: 293K (Highlights) to 770K (Massively).
A 2nd signal: GitHub stars of each template's ports to Hugo / Jekyll / Gatsby / etc.

Ours, by downloads: Massively 770K (#1 of 44), Editorial 601K (#7), Forty 512K, Phantom 511K,
Future Imperfect 473K, Strata 421K, Striped 412K.  (Forty is the most *ported* by far: a Jekyll port w/ 1109 stars)

"Blog fit": how naturally a list of posts & a post page map into it.  Many of the older "classic" templates
(Strongly Typed, Helios, Dopetrope, ZeroFour, Escape Velocity, Verti, Arcana, Twenty, Alpha ...) come w/
left-sidebar / right-sidebar / no-sidebar page variants -- could be a `config.yml` option.

Not yet ported, most downloaded first:

| downloads | template | layout | blog fit | most-starred ports |
|---:|---|---|---|---|
| 724K | [Dimension](https://html5up.net/dimension) | centered intro, each "page" opens as a modal card | landing | Gatsby 321, Hugo 108 |
| 705K | [Prologue](https://html5up.net/prologue) | fixed left sidebar w/ avatar & nav, one-page sections | ok | Jekyll 451 |
| 637K | [Big Picture](https://html5up.net/big-picture) | full-screen image sections, gallery | landing | |
| 627K | [Parallelism](https://html5up.net/parallelism) | horizontally scrolling photo grid | gallery | |
| 607K | [Paradigm Shift](https://html5up.net/paradigm-shift) | big type, alternating sections, gallery | landing | |
| 592K | [Helios](https://html5up.net/helios) -- **ported** | big header, post carousel, posts, sidebar pages | **good** | Jekyll 7 |
| 583K | [Hyperspace](https://html5up.net/hyperspace) -- **ported** | sidebar nav, scrolling sections, generic page | ok | Gatsby 28 |
| 561K | [Spectral](https://html5up.net/spectral) | big hero, alternating spotlight rows, generic page | ok | Jekyll 400, Hugo 81 |
| 550K | [Aerial](https://html5up.net/aerial) | one-screen personal splash | landing | |
| 543K | [ZeroFour](https://html5up.net/zerofour) | banner, features, posts + sidebar pages | **good** | |
| 525K | [Solid State](https://html5up.net/solid-state) | banner, alternating wrappers, article tiles | ok | Gatsby 31 |
| 524K | [Strongly Typed](https://html5up.net/strongly-typed) -- **ported** | posts on the homepage, left / right / no-sidebar pages | **good** | Jekyll 8 |
| 510K | [Arcana](https://html5up.net/arcana) | banner, features, sidebar pages | ok | |
| 507K | [Ethereal](https://html5up.net/ethereal) | horizontally scrolling panels | landing | |
| 504K | [Landed](https://html5up.net/landed) | product landing page | landing | |
| 503K | [Escape Velocity](https://html5up.net/escape-velocity) | features, posts + sidebar pages | **good** | |
| 495K | [Story](https://html5up.net/story) | full-screen spotlight banners, galleries | landing | Hugo 260 |
| 468K | [Stellar](https://html5up.net/stellar) | header, sticky in-page nav, feature sections | ok | Gatsby 134 |
| 465K | [Twenty](https://html5up.net/twenty) | landing + left / right / no-sidebar pages | ok | Pelican 116 |
| 451K | [Dopetrope](https://html5up.net/dopetrope) | features, blog section, sidebar pages | **good** | WordPress 4 |
| 449K | [Multiverse](https://html5up.net/multiverse) | masonry photo grid w/ lightbox | gallery | Astro 124 |
| 445K | [Lens](https://html5up.net/lens) | thumbnail sidebar + full-bleed photo viewer | photo | Jekyll 77 |
| 433K | [Verti](https://html5up.net/verti) | features, posts + sidebar pages | **good** | |
| 305K | [Read Only](https://html5up.net/read-only) | fixed profile sidebar, single-column long-form | **good** | Jekyll 28 |

(Also: Astral, Miniport, Alpha, Tessellate, Halcyonic, Eventually, Minimaxing, TXT, Telephasic, Fractal, Photon,
Directive, Highlights -- 293K-454K, mostly one-page / landing designs.)

Picks: ~~Helios & Strongly Typed~~ (ported 2026-10-18), then the top downloads, **Dimension** & **Prologue**.
ZeroFour, Escape Velocity, Dopetrope & Verti are good blog fits, too -- & "classic" ones, like helios &
strongly typed, so `shared.js`'s dropdowns & nav panel are ready for them.
2026-10-27: **Hyperspace** is a favorite -- its scroll fade-ins are lovely w/o being too showy.

### Beyond HTML5 UP
Lots of ideas in [Fifty of 2022's most popular Hugo themes](https://cloudcannon.com/blog/fifty-of-the-most-popular-hugo-themes/)
(CloudCannon).  Hugo themes are Go templates -- so a port reuses the CSS (& the look), and rewrites the markup as
our web components.  Check each license (these are MIT or Apache-2.0, afaik -- verify before porting).

| theme | look | why |
|---|---|---|
| [Docsy](https://github.com/google/docsy) / [Doks](https://github.com/thuliteio/doks) | documentation site: left nav tree, page TOC | a look we don't have: docs, manuals, project sites |
| [Terminal](https://github.com/panr/hugo-theme-terminal) | retro terminal, monospace, accent color | fun & distinctive; tiny |
| [Ananke](https://github.com/theNewDynamic/gohugo-theme-ananke) | Hugo's starter theme: hero image, clean cards | familiar, friendly default |
| [Clean White](https://github.com/zhaohuabing/hugo-theme-cleanwhite) | big header photo, clean centered posts, sidebar | very nice classic blog |

### Original theme idea: "Librarian" / "Archival"
A nerdy-library look of our own -- nobody else has one.  Base: [Tufte CSS](https://github.com/edwardtufte/tufte-css)
(MIT; book typography, margin sidenotes, ET Book font -- there's also a
[classless](https://github.com/eobrain/classless-tufte-css) variant that styles plain semantic HTML, which is what
our markdown renders to).  Then: the post list as library catalog cards, "call numbers" from dates & tags, maybe a
due-date stamp.  Self-host the fonts (no font CDNs).


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
