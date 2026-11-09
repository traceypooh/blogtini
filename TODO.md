# Ideas: design notes

## Finding posts w/o any list (no build, no `index.txt`)
- **GitHub tree API**: `GET https://api.github.com/repos/OWNER/REPO/git/trees/main` (top level; `?recursive=1` for
  all) -- one CORS-open call.  Top level is usually enough: post dirs *are* the post list.
  OWNER/REPO come from `OWNER.github.io/REPO/`; a custom domain needs `repo:` in `config.yml`.  Public repos only.
  The catch (why it was pulled, `b04131a`): unauthenticated, it's 60 requests/hour *per client IP*, shared by every
  unauthenticated GitHub call from that IP (plane wifi, VPNs, iCloud Private Relay, carrier CGNAT).  If revived:
  cache the list ~1h keyed by OWNER/REPO (sites on one `*.github.io` origin share localStorage), read
  `x-ratelimit-remaining`, & on `403`/`429` wait for `x-ratelimit-reset`.
  GitLab's is similar: `gitlab.com/api/v4/projects/OWNER%2FREPO/repository/tree?per_page=100`.
- **Crawl local links**: a homepage that links to its posts already *is* a sitemap -- fetch it, follow its local
  links (a level or two), read each one's front matter.  So the docs could say "list your posts on your homepage".
- Use one or the other, never both (merging the lists is where duplicates & url normalizing get messy).

## Homepage post list for no-JS readers
The build could bake a plain markdown list of every post into the homepage, between markers -- the client skips
it when it renders the real list, & w/o a build a hand-written one is what a crawl would follow:
```markdown
<!-- bt:index -->
- [Blogtini Turns One!](2025-02-blogtini-turns-one/index.html) 2025-02-14
<!-- /bt:index -->
```

## Combo sites: you + your friends, one page
Interleave several people's posts, newest first, w/ one shared tag cloud & search (like old "Planet" sites).
Every blogtini `index.xml` has the same rich items, and GitHub Pages serves it CORS-open -- so it works live, no
build (~60 KB gzipped per feed):
```yaml
combo:
  - https://blogtini.com/index.xml
  - https://friend1.github.io/blog/index.xml
  - https://mastodon.social/@friend3.rss   # same parser, thinner data
```
Merge the items (keeping each one's site), sort by date; post links go to the original sites (nothing copied).
CORS, checked 2026-10-02: GitHub Pages `*`, Mastodon `*`, Bluesky *none* -- feeds w/o CORS (Bluesky, many
WordPress sites) need the build to fetch & merge them.  Other feeds need defaults: Mastodon items have no
`<title>`; neither has our `<category domain=…>` tags (title = first line, tags from `#hashtags`?).

## Image shape hints: zero layout shift, even on a first visit
Today (2026-11-08) a photo w/o a width & height gets a placeholder shape (3:2, or `img_ratio`) until it loads -- exact
for 3:2 photos, a small shift for others (eg: 3:4 phone portraits).  See future-imperfect.md "Placeholder shapes".
Only worth doing if layout shift ever really costs us w/ Google (CLS) -- `deno task test:cls` is the check.

A hint in the image's url fragment, read by `js/text.js` `photos()` (which already reads `#half` etc):

| hint | meaning | result |
|---|---|---|
| `![x](a.jpg#4x3)` | a shape: small numbers | still full width; its placeholder is `4 / 3` (inline `aspect-ratio: auto 4 / 3`) |
| `![x](a.jpg#1600x1200)` | exact pixels: numbers >= 100 | `width` & `height` attributes: zero shift, & shown at its natural size -- never stretched past it |
| `![x](a.jpg#half,4x3)` | combined, comma separated | half width, 4:3 |

- only images *not* 3:2 need one (3:2 is already exact)
- `4x3` over `4/3`: reads like a size, matches the pixel form (both are legal in a url fragment -- could take both)
- an author can write them by hand -- or an optional build step can: `--sizes`, alongside `--seo`.  `--seo` already
  edits posts *only in the CI checkout* (its head lines are never committed), so `--sizes` could too: read each local
  image's header (PNG: 24 bytes, GIF: 10, WebP: ~30, AVIF: its `ispe` box, JPEG: after its EXIF -- no decoding) &
  append `#1600x1200`.  Authors' files stay clean; the live site gets exact sizes; the build stays optional.
  Images on other hosts: no hint (as today)
- unlike remembering sizes after a first view (below), this helps first visits -- & so Lighthouse's lab scores

Smaller, no build: remember each image's natural size (on its `load`) in the post cache (localStorage).  A
visitor's later views -- returning, or the next page (eg: a featured image on the homepage, then on its post) --
get exact `width` & `height`.  First views still get the placeholder (& Lighthouse always tests a first view).

Ruled out: holding the page until images load (blank page: worse for readers & Google's LCP); fetching each
image's first bytes from js first (the browser already lays an image out as soon as its header arrives -- a
separate fetch can't beat that w/o holding the page; & other hosts' images can't be read from js w/o CORS).

## Wishlist: browsers & crawlers that understand this natively
If a `text/html` response starts w/ `---\n`, treat it as YAML front matter + markdown, & honor one key:
`theme: ../theme.js` (one ES module that "paints" the page).  No theme?  Render the markdown plainly.
We get this today w/o browser help: the HTML parser runs the `<script>` in the front matter; YAML sees a string.


# Older notes

add storj, codepen, etc.

xxx add either:
```html
<meta property="og:type" content="website">
<meta property="og:type" content="article">
```

xxx mobile size tables


goals: 0 config/0 build; pull in info from multiple blogs; parents can do it

wget -qO- 'https://api.github.com/repos/traceypooh/blogtini/git/trees/main?recursive=true'

tech terminal try-out:
  wget https://raw.githubusercontent.com/traceypooh/test1/main/index.html
  wget https://raw.githubusercontent.com/traceypooh/test1/main/README.md
  [edit 1st real post in README.md]
  [open in Safari; Developer Menu; check `Disable Cross-Origin Restrictions` during development
  open index.html
  [Developer Menu; uncheck `Disable Cross-Origin Restrictions` when done


existing GH repo try-out: /?preview=github/repo-name    (we'll use GH API to find .md files)
existing WP try-out: /?preview=URL/feed (atom or RSS)

could host entire thing in codepen, etc.?!

xxx go to blogtini.com -> enter in your username and repo and show them how it looks.

nav search box that prefills google search site:xxx AND ..


xxx gist: either: public GH repo w/ dir of .md files *or* WP/private and parse atom feed..

github.com cookie: dotcom_user


wait a few minutes, visit your site at:
https://[YOUR-GITHUB-USERNAME].github.io/blogtini/?setup


# parse username from location.host/name ;-)


# make a new file, 'Name your file....' like YYYY-MM-DD-first-test-post.md
https://github.com/xxx/blogtini/new/main/posts
---
title: first test post
date: xxx
tags: blogging, testing, blogtini
---
# scroll down, hit [Commit new file]

https://github.com/xxx/blogtini/edit/main/posts/2022-02-02.md
[<> Code] upper left tab
[📁  posts]
click 2022-02-02.md
upper-mid right [✏️] (hover shows "Edit this file")

change, to taste:
title:
date:
tags:

(scroll down, find [Commit changes] button and press)

https://github.com/xxx/blogtini/edit/main/config.yml
change, to taste:
`title`
`user`
(scroll down, find [Commit changes] button and press)
---

PAT / tokens for ~30/hr => ~5k/hr rate limits
- https://github.com/settings/tokens
- https://api.github.com/repos/traceypooh/blogtini/git/trees/main?recursive=true&token=TOKEN
- https://raw.githubusercontent.com/traceypooh/blogtini/main/README.md?token=TOKEN


---
- 15y, 112 posts, 500k txt, 60k gzip (twitter tp cold load 2.7MB)
- xxx can still use site w/o .md copied into webroot via api
  https://api.github.com/repos/traceypooh/blogtini/contents look for type: dir and dir with 20\d\d...md

- fill out nav & sidebar
- parse 10 most recent posts, fill out main page
- parse front-matter from remaining posts for tag cloud, category list (fills-in later) (cache)
  - consider range requests for ~just front-matter retrieval & parsing?
  - GH pages serves over http2 at least

- put into local storage (cache <= 24h): each post's: title, date, tags, cats, img
  - ... but we only need to parse most recent 2-10 posts from each subscriber
- top page: show most recent 10 posts' summaries
  - page 2: posts 10..20, etc.
- open followers' websites /posts dir to parse their 2-10 most recent .md, eg:
  - https://api.github.com/repos/ajaquith/securitymetrics/contents/source/_posts
  - https://hunterleebrown.com/blog/feed
  - https://blog.archive.org/feed/
  - https://hugo-fresh.vercel.app/blog/index.xml
  - https://feeds.feedburner.com/securitymetrics-org

  xxx posts w/o dates examples
  - eg: https://api.github.com/repos/stefma/hugo-fresh/contents/exampleSite/content/blog
        https://github.com/StefMa/hugo-fresh/tree/master/exampleSite/content/blog
        https://hugo-fresh.vercel.app/blog/index.xml   ** BUT! :) **
