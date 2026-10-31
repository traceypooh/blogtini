# Themes

A theme is a dir under `theme/` with an `index.js` (and optional `index.css`).
Pick one in `config.yml` (`theme: editorial`), or try them live from the theme picker.

## Share a theme preview
https://blogtini.com/#theme=librarian

## Screenshots (for the [Themes page](themes/index.html))
Each theme's card has a screenshot: `img/themes/<theme>.jpg`.  So they all match:
1. Open the previewer at a list of posts (not the homepage, whose own text is up top -- & changes):
   http://localhost:8888/preview/?start=?page/1#terminal
2. The browser window: **1440 wide**, as tall as your screen allows -- w/ DevTools *undocked* (its own window:
   DevTools ⋮ → Dock side → undock), so the frame is ~1440 × 700+.  The cards crop to 2:1, from the top -- so a
   frame a bit shorter than 720 just loses a sliver at the sides.  (Chrome: `osascript -e 'tell application
   "Google Chrome" to set bounds of front window to {0, 0, 1440, 900}'`)
   Not 1280 wide: HTML5 UP themes switch to their smaller layouts at <= 1280 (eg: hyperspace's sidebar,
   editorial's menu).  Future imperfect's widest breakpoint is 1024.
3. Capture *just the frame* -- no previewer bar, no browser chrome:
   - Chrome: DevTools → Elements → right-click the `<iframe id="frame">` → **Capture node screenshot**
   - Firefox: in the console: `:screenshot --selector #frame`
4. Save as `img/themes/<theme>.png`.  Then → for the next theme.
5. Shrink them for the web -- the cards show them at most ~500px wide, so 1000 covers retina screens -- & JPEG
   (screenshots are ~4x smaller than PNG), in `img/themes/` (macOS):
   `for f in *.png; do sips -Z 1000 -s format jpeg -s formatOptions 85 "$f" --out "${f%.png}.jpg"; done; rm *.png`

A new theme: add it to `THEMES` in `index.js`, a card on [themes/index.html](themes/index.html), & a screenshot.

## How a theme plugs in
blogtini's `index.js` finds and parses posts, then writes `<bt-body>` into `<body>`, with the page's main content
inside it: `<bt-posts>` (w/ `<bt-post>`s), `<bt-post-full>`, `<bt-histogram>` or `<bt-contact>`.
The theme defines those custom elements, and so decides what the page looks like.

- `index.css` is loaded into the page (light DOM) -- by `main()`, for the configured theme.
- `preview/` (theme previewer -- a stub page; it's all in `js/preview.js`, so any site can have one): its iframe's name, eg: `bt-preview:librarian`, sets the theme -- nothing saved;
  a pick inside it just renames the frame.  The framed page posts `{ bt_preview: { theme, themes, url, title } }`
  to it, each time it's drawn.
- A theme picker pick saves it (for that viewer, 24h) & reloads the page -- so each theme starts w/ a clean page:
  no prior theme's custom elements, css, listeners or flags.  (It used to swap themes in place -- but eg:
  future-imperfect's many files don't re-run on a 2nd visit, so its elements stayed the prior theme's.)
- The theme must call `reveal()` (from `index.js`) once it has rendered -- the body is hidden until then.
- The homepage (w/ its own text) also gets an `<h2 class="bt-posts-heading">` (`config.yml` `posts_heading:`,
  default "Latest posts"; `''` for none) between that text & `<bt-posts>` -- style it (eg: future-imperfect: a
  box like a post's; hyperspace: a band) or hide it, if the theme titles its posts itself (librarian's
  "Card catalog", editorial & helios' "Posts", strata's "Recent Posts", strongly typed's "Latest from ...").
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
| `librarian` | plain custom elements, light DOM | our own: Tufte CSS, as is, + `index.css` |
| `terminal` | plain custom elements, light DOM | panr's Hugo Terminal theme's original css, as is |

`theme/html5up/` (not a theme) has what the light DOM HTML5 UP ports share -- one copy, so the browser
fetches it once, eg: while flipping thru themes w/ the picker:
- `shared.js` -- helpers: escaping, menu & theme picker items, social links & icons, prior/next links, comments,
  tag cloud, contact form, code highlighting, etc.  And for the "classic" themes (helios, strongly typed, and
  dopetrope, zerofour, escape velocity, verti ... someday): vanilla js for their jQuery `dropotron` nav dropdowns
  (`dropdowns()`) and phone width nav panel (`nav_panel()`, `nav_panel_links()`).
- `fontawesome/` -- the Font Awesome 5 css & webfonts every HTML5 UP theme ships (all identical)
- `fonts.css` & `fonts/` -- self-hosted fonts, in place of their Google Fonts.
  (Browsers only download the ones a theme uses)

No symlinks: GitHub Pages & the esm.archive.org mirror may not follow them, nor Windows checkouts.


## Shadow DOM or light DOM?  Both -- by piece (2026-10-28)
Not one way for everything.  The plan was all lit & shadow DOM -- then the HTML5 UP ports showed how fast and
faithful light DOM is.  (Irony: future-imperfect *started* as an HTML5 UP theme -- years in poohbot getting it off
jQuery, then pulled apart into shadow DOM components.)

The question is: who owns the page-wide css?

| piece | DOM | why |
|---|---|---|
| an imported theme's page layout | light | its css is global (`#main > .inner > section`, `body.is-preload`) & selectors can't cross a shadow boundary.  Light DOM keeps it as is -- that's what makes ports fast |
| reusable widgets: comments, search results, share, calendar, ... | lit, shadow DOM, w/ `::part()`s | isolated, all js/css/markup in one file, works inside every theme |
| our own themes (eg: librarian) | either -- lit *in light DOM* is a nice middle | lit templates & reactive props, one file per component -- & global css still applies |

- `<bt-comments>` is the model widget: lit & shadow DOM, used by every light DOM theme, restyled per theme via
  its `::part()`s (librarian does).  New widgets: expose `::part()`s or css custom properties for theming.
- Lit in light DOM: `createRenderRoot() { return this }` -- no shadow root, so the page's css styles it.
  (No `static styles` then -- those need a shadow root.  No `<slot>`s either.)
- Next widget candidates, from `html5up/shared.js`'s html-string helpers: tag cloud, search box & results,
  contact form, pager -- once each is a widget, every theme gets it.


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


## Librarian
Our own theme (2026-10-28): a nerdy library.  Not an HTML5 UP port -- but built the same way (light DOM,
`shared.js` helpers).  See the [idea](#original-theme-idea-librarian--archival), below, and the
[blog post](2026-10-librarian-theme/index.html), for the card anatomy.
- `tufte.css`: [Tufte CSS](https://github.com/edwardtufte/tufte-css) (MIT), as is -- except its ET Book fonts are
  self-hosted in `fonts/`, and no `prefers-color-scheme` dark mode (blogtini's Scheme drives ours)
- `fonts/`: ET Book (MIT) & Courier Prime (OFL, from `@fontsource/courier-prime` 5.3.0) -- for the typed cards
- `index.css`: everything library, w/ colors as `:root` variables -- so the dark scheme ("the reading room after
  hours") just redefines them

Mapping:
- posts (homepage, tags, categories): a "Card catalog" -- each post a library catalog card, typed in Courier Prime:
  a "call number" (first subject, a Cutter-ish letter & 2 digits from the title, year), the author as main entry
  (if any), title & date, "collation" (`1,240 words : front., 3 ill.` -- the featured image is the frontispiece), a summary, "tracings" (numbered subjects, `I. Title.`),
  a punched hole -- and a red rubber "LOAN PERIOD" stamp: the reading time.  (Uneven ink: an SVG noise mask; each
  post's stamp lands at its own slight angle)
- single post: a Tufte article -- title, date, a "DATE DUE" slip in the right margin stamped w/ the reading time,
  featured image (caption as a margin note), body, "Subjects:", comments.  In the body: a picture alone in its
  paragraph becomes a figure, its alt text a margin caption; and a "See also" margin note about halfway down --
  up to 3 posts sharing the most subjects
- prior & next: "Previous / Next on the shelf" (posts), "Prior / Next drawer" (pages of posts)
- "Finding aids" (every page): card catalog drawers -- oak fronts, brass label holders & pulls -- for search,
  subjects (tags), categories, theme picker
- tags & categories lists: "Subject headings", like a book's index (`name ........ 12`); contact: "Ask a librarian"
- colophon (footer): site image, about, social links, credits
- `config.yml` `reading_time: false` drops the stamps & slip

Shared w/ every theme: `index.js` exports `word_count(post)` & `reading_time(post)` (minutes, at least 1) --
future imperfect & striped use it now, too.

### TODO / FIXME
- [ ] comments: future-imperfect's form & comments, on Tufte's paper.  (Its box & headings are restyled via the
      `::part()`s `bt-comments` now exposes: `comments`, `heading`, `say-something` -- "Shh! Quietly, please.")
- [ ] Tufte's sidenotes: a markdown way to write them (eg: footnotes => sidenotes)
- [ ] check phone widths & the dark scheme by eye; the stamp's noise mask in Safari & Firefox


## Terminal
Port of [panr/hugo-theme-terminal](https://github.com/panr/hugo-theme-terminal) v4.2.0 (MIT: `LICENSE.md`),
2026-10-29.  A Hugo theme, but its css is plain css (w/ css variables) -- so it ports like the HTML5 UP ones:
light DOM, `shared.js` helpers.

What changed from the original:
- `assets/css/`: its css files, as is.  (`fonts.css` self-hosts Fira Code, in `assets/fonts/`.)
  Left out: `syntax.css` & `gist.css` (Hugo code highlighting & gists) and its empty `terminal.css` placeholder.
  Code: the shared `highlight_code()` (highlight.js), recolored in `index.css` w/ a few shades of the accent --
  like the original's demo -- so it follows the light & dark schemes, too.
- `menu.js` (dropdowns) => vanilla js in `index.js` -- w/o its `stopPropagation()` in dropdowns
  (blogtini's theme picker listens on the document)
- `index.css`: our additions -- incl. a light scheme ("paper teletype": cream, ink, rust).  Dark is Terminal's own
  amber on near black, so it's the default: the Scheme toggle goes dark => light => dark.

Mapping:
- header: logo (site title, w/ a blinking cursor), the menu (names only -- no icons in a terminal), Scheme,
  a "Theme ▾" dropdown (the theme picker); phone widths: one "Menu ▾" w/ all of those
- search: a shell prompt -- `guest@blogtini.com:~$ grep -ri ▮`
- each page starts w/ a prompt & a command for what it shows: `ls -t posts/ | head -10` (homepage),
  `... | tail -n +11 | head -10` (later pages), `grep -l 'tags:.*x' posts/*` (a tag), `cat <slug>/index.md` (a post),
  `cut -d: -f2 tags | sort | uniq -c | sort -rn` (tags list), `mail -s 'hello' ...` (contact),
  `cat README.md` (the homepage's own content, framed)
- posts: Terminal's list -- title, date :: author :: reading time, `#tags`, cover (featured image), summary,
  `[Read more]`; `< [Newer posts] :: [Older posts] >`
- single post: same, w/ word count; featured caption as Terminal's figcaption bar; "Read other posts"; comments
- footer: copyright :: social links :: theme credit :: blogtini

### TODO / FIXME
- [ ] comments: future-imperfect's form, recolored via its css variables (`--color1` etc.) & `::part()`s
- [ ] check by eye: phone widths, the light scheme, the dropdowns


## HTML5 UP ports: shared TODO / FIXME
- [ ] the phone width nav panels (helios, strongly typed) have no search box yet
- [ ] `sidebar.position`: future-imperfect, editorial & striped could honor it, too (they're left only, so far)
- [ ] Share menu (`<bt-share>`) not ported
- [x] the theme picker's list was copied into each theme -- now blogtini's `THEMES` export (2026-10-18)
- [ ] comments reuse future-imperfect's `<bt-comments>` (lit, shadow DOM) -- so they look like future-imperfect.
      Keep it shadow DOM (see [Shadow DOM or light DOM?](#shadow-dom-or-light-dom--both----by-piece-2026-10-28));
      give each theme a look via more `::part()`s / css custom properties (eg: fonts, colors, buttons from its `main.css`)
- [ ] `html5up/shared.js` imports all of `future-imperfect/css.js` (~2400 lines, w/ lit) just for `css_hljs`
      (code highlight colors).  Move `css_hljs` somewhere shared
- [ ] social icons are a subset of future-imperfect's `socnet_icon()` list -- share one list
- [ ] self-hosted fonts are the latin subset only (other scripts fall back to system fonts)
- [ ] ignores `config.yml` `attribution` (its default credits future-imperfect); always credits HTML5 UP (CC BY 3.0)
- [ ] `cfg.site_header` image (blogtini logo) isn't used
- [ ] the themes' "page-wide listeners: once" guards (eg: `bt_hyperspace_listening`) were for in-place theme
      switches -- a pick reloads the page now, so they could go


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
| [Doks](https://github.com/thuliteio/doks) (or  [Docsy](https://github.com/google/docsy)) | documentation site: left nav tree, page TOC | a look we don't have: docs, manuals, project sites |
| [Terminal](https://github.com/panr/hugo-theme-terminal) -- **ported** | retro terminal, monospace, accent color | fun & distinctive; tiny |
| [Ananke](https://github.com/theNewDynamic/gohugo-theme-ananke) | Hugo's starter theme: hero image, clean cards | familiar, friendly default |
| [Clean White](https://github.com/zhaohuabing/hugo-theme-cleanwhite) | big header photo, clean centered posts, sidebar | very nice classic blog |

### Original theme idea: "Librarian" / "Archival"
(**Made**: [Librarian](#librarian), above.)  A nerdy-library look of our own -- nobody else has one.  Base: [Tufte CSS](https://github.com/edwardtufte/tufte-css)
(MIT; book typography, margin sidenotes, ET Book font -- there's also a
[classless](https://github.com/eobrain/classless-tufte-css) variant that styles plain semantic HTML, which is what
our markdown renders to).  Then: the post list as library catalog cards, "call numbers" from dates & tags, and a
red rubber "due-date" stamp that's really the estimated reading time ("LOAN PERIOD: 4 MIN").  Self-host the fonts
(no font CDNs).


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
