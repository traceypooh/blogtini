# blogtini

Anyone who posts to socials should be able to keep the highlights of their life as markdown, in a free git repo,
that lives forever.  Each post is a plain text file; one shared theme JS "paints" it in the browser.
No JS, no network, 1000 years from now?  It's still a readable text file.

**No build step is required.  An optional build step makes it better.**

- Live: https://blogtini.com (also https://traceypooh.github.io/blogtini/)
- Slides / talk: https://tracey.archive.org/dweb-2022 (at https://dwebcamp.org)
- Releases: https://github.com/traceypooh/blogtini/releases


## Setup
A post is a directory w/ an `index.html` that's really front matter + markdown, eg: `2022-01-i-baked-a-pie/index.html`:
```markdown
---
title: I baked a pie
date: 2022-01-15
tags:
  - baking
featured: pie.jpg
comment: <script src="../theme.js" type="module" charset="utf-8"></script>
---
It was *delicious*.
```
- The browser runs the `<script>` inside the front matter (YAML just sees a string) -- so you get the nice url
  `https://example.com/2022-01-i-baked-a-pie/`, rendered.
- `type: page` makes it a page (about, contact, ...): in the nav menu, not the timeline.  Otherwise it's a post.
- Optional: `description:` (a one-liner for feeds), `featuredcaption:`.  Images go in `img/`.
- Your top-level `theme.js` loads blogtini: `import 'https://blogtini.com/index.js'` (latest),
  or pin a version (see [Versions](#versions)).
- Your top-level `config.yml`: `title`, `user` & `repo` (eg: for comments), `theme`, `menu`, `sidebar`, ...
  (see [this repo's](config.yml); maps like `sidebar:` merge w/ the defaults).
  A contact page (`/?contact`) uses `contact: email_service:` (eg: https://formspree.io).
- Host it free w/ GitHub (or GitLab) Pages, eg: https://traceypooh.github.io/blogtini/ --
  optionally w/ your own domain (~$20 USD/year), like https://blogtini.com.

**Fail open:** if the JS never loads, a page still shows its text after ~3s, instead of staying blank.


## How a site finds its posts
A static host won't list its files, so the browser builds a post list (cached daily) from the first of:
1. `index.xml` -- from the [build](#build-optional): feed + sitemap + search index, in one request
2. `index.txt` -- a plain list, one post per line, eg: `find . -name index.html > index.txt` (or hand-edit it)
3. `sitemap.xml`
4. else: just the pages you've opened -- the cache grows as you browse.  Search, recent posts, tags & prev/next
   still work, w/ what that visitor's seen -- so a one-post try-out shows every feature.  (Crawlers start fresh on
   every page, so they need the build or an `index.txt`.)

A hand-made `index.xml` works too: each `<item>` needs `<title>`, `<link>`, `<pubDate>`, and the markdown body
in `<content:encoded>` (for summaries & search) -- see the build's output for the full shape.
The page you're on always renders from its own file, so edits show right away.


## Build (optional)
[bin/build.js](bin/build.js) runs on [deno](https://deno.com) *or* `node` 18.19+
(even the [iOS Code App](https://apps.apple.com/us/app/code-app/id1512938504)'s ▶ button).

It makes your site better for everything that doesn't run JS: link previews, crawlers, RSS readers, people w/o JS.
It writes:
- `index.xml` -- RSS feed & sitemap of every post & page (w/ summaries, images, full text).
  Also the client's post list & search index.
- with `--seo`: a tiny head line atop each post (title, image, and the fail-open style), and `robots.txt`

Our GitHub Action runs it on each push -- with `--seo`, for the live site.  Locally, the default (`index.xml`) is
usually all you want: no head lines to `git checkout` (revert) afterwards.  Rerunning it changes nothing.
From the top of your site repo:
```sh
deno run --reload=https://blogtini.com --allow-read=. --allow-write=. --allow-env=GITHUB_REPOSITORY \
  --allow-import=blogtini.com:443,esm.ext.archive.org:443  https://blogtini.com/bin/build.js
```
or, w/ a blogtini checkout next to your site repo:
```sh
../blogtini/bin/build            # deno
node ../blogtini/bin/build.js    # node
```
(In this repo itself: `./bin/build` or `node bin/build.js`.)  See [DENODE.md](DENODE.md) for running on Node.


## Themes
12 themes ship w/ blogtini: future imperfect (default), editorial, massively, phantom, striped, forty, strata,
helios, strongly typed, hyperspace, librarian, grid -- many ported from [HTML5 UP](https://html5up.net); librarian
is our own (a card catalog, on Tufte CSS).
Pick one in `config.yml` (`theme: editorial`), or try them live w/ the theme picker: a viewer's pick
(and light/dark choice) sticks for 24hr, just for them.  How themes plug in, & adding your own: [THEMES.md](THEMES.md).


## Comments
- Each new comment arrives as a pull request ([staticmin](https://github.com/traceypooh/staticmin), our tiny
  Staticman on Netlify) adding it to `comments.json` at the top of your repo -- merge it to publish it.
  No build step needed.
- `comments.json` is easy to read & hand-edit: each comment is a few lines, `path` (the post) first;
  delete those lines to remove a comment.
- No emails are stored -- not even as an md5.  Each commenter gets a private, site-specific `identity`.
  Their Gravatar (if any) comes in the same pull request, into `avatars/` -- so readers never
  call gravatar.com.  No Gravatar: an "identicon" (GitHub-style), drawn in the page.
- Replies nest under their parent, oldest first.

The format has 972 "slot" marker lines (`#0`..`#z`, `#a0`..`#zz`), never edited,
w/ each comment pretty-printed and *always* ending `},`
-- inserted right after a random marker.
So two pending pull requests only conflict if they pick the same slot (~1 in 972),
and GitHub's web "Merge" button just works.

Older comments (one file each, in `comments/<post>/`): convert once w/ staticmin's
[bin/convert-comments.js](https://github.com/traceypooh/staticmin/blob/master/bin/convert-comments.js).


## Versions
Use the latest (`https://blogtini.com/index.js`), or pin a release -- served from any git tag by the
Internet Archive's esm.sh mirror:
```js
import 'https://esm.ext.archive.org/gh/traceypooh/blogtini@2.0.0/index.js?bundle=false'
```
The default theme comes from that same version, so `theme:` in `config.yml` is optional.
Always use `?bundle=false`: otherwise the theme gets its own bundled copy of `index.js`, and the two don't share
settings.  (A brand new tag can take a little while to show up on the mirror.)


## Local development
Any static file webserver will do:
```sh
( sleep 3; open http://localhost:8000 ) &
python3 -m http.server
```
Or Safari, w/ no server: Develop menu → check `Disable Cross-Origin Restrictions`, open your `index.html` as a
`file:` url (uncheck it when done).

Run the [build](#build-optional) first if your post list looks wrong (it reads `index.xml`).
To rebuild the browser's post cache (eg: after adding or deleting a post), click the bottom ↻ button
(`localhost` & `file:` only), or add `?recache=1` to the url.

Fun: with the iOS Code App, you can open `bin/build.js` and hit its ▶ button to re/make `index.xml` anytime if you like to dev on your iPhone or iPad ;)


## Releases
Release notes live in the annotated git tags (1.0.6+), so you can read them from any clone:
```sh
bin/releases       # every release & its notes, newest first
git show 2.0.0     # one release's notes, atop its commits
```
Make a release in one shot (`;` as the comment char, so `#` markdown headers in the notes survive;
`-F notes.md` instead of the editor works too).  Drop the `gh` lines if you don't have it -- then use
the [Draft a new release] button on the releases page:
```sh
V=2.0.0 &&\
  which gh &&\
  git -c core.commentChar=';' tag -a ${V?} &&\
  git push --follow-tags &&\
  gh release create ${V?}  --verify-tag --title ${V?} --notes-from-tag
```


## Ideas / later
(Design notes for several of these: [TODO.md](TODO.md)).
- self-host the JS deps (eg: `js/vendor/`), so a copy of a site dir is complete & works offline
- find posts w/o any list: the GitHub (or GitLab) tree API, or crawl the homepage's local links
- the build bakes a plain list of every post into the homepage, for no-JS readers
- import your socials: turn a Mastodon / Bluesky / Instagram / X export into posts
- combo sites: interleave your & your friends' blogtini (or Mastodon) feeds on one page
- port forward from [hugo-future-imperfect-slim](https://github.com/traceypooh/hugo-future-imperfect-slim):
  eg: `loading="lazy"` on *every* rendered `<img>` (raw `<img>` tags in markdown, too)
- `draft: true` front matter.  (The build skips dirs named `test`, `theme`, `js`, `img`, `avatars`,
  `node_modules`, `.*`, `_*` -- so a real post can't use those names.)
- `config.yml` `scheme: light | dark | auto` for the site's light/dark
- staticmin: check `allowedOrigins` (not enforced yet -- PR review is the gate); move netlify to Node 22
- wishlist: browsers & crawlers that render front matter + markdown natively, w/ a `theme:` module to "paint" it
- Fail-open tests & findings: [test/fail-open/](test/fail-open/README.md).

To do / fixmes: `git grep xxxxx` (highest priority), `xxxx` (medium), `xxx` (low).
