# future-imperfect: porting forward from the Hugo theme

blogtini's house theme, `theme/future-imperfect/`, started as HTML5 UP's Future Imperfect -- by way of
[hugo-future-imperfect-slim](https://github.com/traceypooh/hugo-future-imperfect-slim), which still powers
https://traceypooh.com.  Fixes & features keep landing on the Hugo side first.
This doc collects what to bring over, & how -- so README.md & THEMES.md stay uncluttered.

Started 2026-11-08.


## Hugo theme changes, & where blogtini stands
Since Tracey took the theme over (2025-02).  Older upstream changes (2020-21): mostly i18n & config, skipped.

| Hugo commit | what | blogtini |
|---|---|---|
| `4ce0eee` `8f00ef6` (2026-09-16) | lazy loaded images, w/ width & height | done (2026-11-08), w/o sizes: a placeholder shape instead -- see [Lazy loading images](#lazy-loading-images) |
| `87f9120` (2026-09-20) | `![alt](x.jpg#half)` -- a display size: `half`, `two-thirds`, `third`, `quarter` | done (2026-11-08) -- see [Image sizes](#image-sizes-half--friends) |
| `5fe726f` (2026-09-17) | captions sit closer to their image: `p:has(+ figcaption) { margin-bottom: 0 }` | **to do** -- easy, css only |
| `ac2f2b0` (2026-09-26) | image urls: absolute `/img/x` & relative `../img/x` both work | check -- (the Hugo fix was about finding the file for its dimensions) |
| `91dedcc` (2025-04-27) | optional full-width homepage "banner" under the nav (`params.banner`) | maybe -- a `config.yml` `banner:` |
| `9f53fad` (2026-09-16) | absolute urls in `og:` tags | likely done -- the build's head line uses `imgurl(…, true, false)` (site url prefix).  Verify |
| `3c791e9` (2026-10-26) | comments overhaul: stored gravatars, identicons | done (blogtini did it first) |
| `d602517` (2026-04-26) | sidebar "See More" → `#postN`, not `page/2` | done (2026-10-03) |
| `001289e` (2026-05-04) | search tags & categories, too | done (lunr indexes both) |
| `9ae2534` (2025-02-23) | commenter website links always `http(s)://` | done (`bt-comment.js`) |
| `8e69013` (2025-02-19) | a page's comments keyed by its pathname | done (`comments_entryid()`) |
| `b5de41d` (2025-02-19) | no homepage preamble on `page/2` etc. | done (`show_top_content` needs no `?…`) |
| `4bc571b` `af36ec1` `56f7fbb` | `/index.json` & ESM loading | n/a -- blogtini is ESM, & uses `index.xml` |
| `67dfc62` (2021-11) | simple table of contents | maybe |


## Lazy loading images
The Hugo theme's best recent feature: a 55-image post is ~32 MB, & w/o `loading="lazy"` every image downloads on
page load, scrolled to or not.  The Hugo render hook reads each image file for its width & height, so the browser
can reserve the right shape before the bytes arrive.

blogtini has no required build -- & we don't want the build computing image sizes for later, either.  So:

**What actually causes layout shift (CLS)** is images w/o dimensions -- lazy or not.  (blogtini's images have none
today.)  And it only counts when *visible* content moves:
- **Ranking** uses real Chrome visitors' CLS (Chrome UX Report), as they really scroll.  An image landing *below*
  their screen doesn't count.  Browsers start loading lazy images well before they're visible (Chrome: a
  ~1250-2500px margin), so on a normal scroll most arrive unseen.  What does count: fast scrolls, slow networks, &
  jumps to a `#anchor` (or a restored scroll position) -- images above the spot load late & push it down.
- **Googlebot** (indexing) doesn't score CLS.  It renders w/ a very tall viewport, so native lazy images all load &
  get indexed.
- **PageSpeed / Lighthouse** (lab tests) measure page load in a fixed window, no scrolling: only above-the-fold
  shifts count.

**The plan** -- in the core (`markdown_to_html()` output, in `index.js`), so every theme gets it, & raw `<img>` tags
pasted into markdown, too (Hugo's markdown hook misses those):
- **done (2026-11-08)**: a post's first 4 pictures load normally -- they're usually near the top -- & the rest get
  `loading="lazy"`.  All get `decoding="async"`.  An `<img>` w/ its own `loading` is left as is
  (`js/text.js` `lazy()`, `EAGER_IMAGES`)
- **done (2026-11-08)**: a default placeholder shape -- see [Placeholder shapes](#placeholder-shapes-done) below
- **done (2026-11-08)**: images alone in their paragraph (photos) get `class="bt-photo"` & `width: 100%` -- so the
  placeholder has a width to work with.  Pictures in a line of text, & ones w/ their own `width` or `class`, stay as
  they are (`js/text.js` `photos()`).  A small picture shows full width (soft) unless it's `#half` etc (below), or a
  raw `<img>` w/ a `width` & `height`.  `deno task test:cls` (2026-11-08, before this): every ! & ✗ was a post
  page's body picture pushing the text below it down -- mostly on phones
- an author can still give `width` & `height` on a raw `<img>`: those win

### Placeholder shapes (done)
Two kinds of images, in every theme:
1. **crop boxes** -- lists' thumbnails & cards: a fixed shape, the image cropped to fit (`aspect-ratio` +
   `object-fit: cover`).  Never shift.  Each theme's own choice: future-imperfect's 2.35:1 cards (`47 / 20`, CinemaScope),
   editorial `2 / 1`, phantom & hyperspace `1 / 1`, strata `1 / 1` & `3 / 2`, helios & strongly typed `3 / 2`,
   dossier `4 / 5`.  (No box yet: massively, striped, forty & terminal list images)
2. **natural shape** -- a single post's featured image, & images in post bodies: their shape can't be known ahead.
   These get `aspect-ratio: auto var(--bt-img-ratio, 3 / 2)` -- `auto`: the placeholder until the image loads, then
   its real shape.  Likely the biggest CLS today: the featured image atop every post, on screen, loading at 0 height.

Done in `index.js` `img_ratio_css()`: `:where(img) { aspect-ratio: auto var(--bt-img-ratio, 3 / 2) }` for light DOM themes
(`:where()`: no specificity, so any theme rule wins), & in future-imperfect's shadow DOM (`featured-image.js`
`.image.single img`, `bt-post-full.js` `img`).  Only an image w/ a definite width (eg: `width: 100%`) gets space.

The shape: `config.yml` `img_ratio: 1 / 1` (inline on `<html>`, so it wins), else a theme's `:root { --bt-img-ratio: … }`,
else **3 / 2**:

| source | landscape | portrait |
|---|---|---|
| DSLR & mirrorless cameras (35mm) | 3:2 | 2:3 |
| phones (iPhone, most Android, by default) | 4:3 | 3:4 |
| video, screenshots | 16:9 | 9:16 |

3:2 sits between the landscape shapes (exact for cameras; a bit short for phones, a bit tall for video).  Portraits are
what it misses -- a 3:4 phone portrait is twice as tall.  A site of mostly portrait phone photos: `1 / 1` is never
exact but never far (a quarter off, either way).  On the wedding post, about a fifth of the images aren't 3:2 or 2:3
(crops, a 2.06:1 panorama, 4:3 phone shots).  CLS counts shifts both ways -- a placeholder too short or too tall.

Measure it before & after: `research/fail-open/cls.js` already records Chrome's layout-shift events.  A test page w/
~60 mixed-ratio images: eager vs. lazy w/o sizes vs. lazy + `aspect-ratio` -- w/ & w/o a fast scroll & an
`#anchor` jump.

Exact sizes someday (zero shift, even on a first visit): `#4x3` / `#1600x1200` hints in image urls -- by hand, or
an optional `--sizes` build step.  Not planned -- see TODO.md "Image shape hints".


## Image sizes: `#half` & friends
Markdown has no way to say "show this image smaller".  The Hugo theme reads a trailing url fragment:
`![alt](../img/x.avif#half)` -- `half`, `two-thirds`, `third`, `quarter` -- as a class, eg: `size-half`.
(Same idea as front matter's `featured: x.jpg#top30`.)  Anything else is ignored.

**Done (2026-11-08)**, in `js/text.js` `photos()`: for a photo (a picture alone in its paragraph), a known fragment
comes off the `src` & adds its class: `bt-photo size-half`.  `index.js` `img_ratio_css()` styles them (centered, 50% /
66.667% / 33.333% / 25% wide) -- & future-imperfect's shadow DOM styles, the same.  A theme can restyle the classes.
(The Hugo theme sets the class but styles it in the site's css, not the theme's)
