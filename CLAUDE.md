# blogtini -- notes for contributors & their AI agents

Markdown blogs & websites, rendered in the browser.  Each post is a plain text file (front matter + markdown);
one shared theme JS "paints" it.  **No build step is required; an optional build step makes it better.**

## Read first
- [README.md](README.md) -- what it is, setup, how a site finds its posts, the build, comments, versions, releases
- [THEMES.md](THEMES.md) -- how a theme plugs in (the `bt-*` elements, `reveal()`, ids blogtini looks for),
  adding a theme, & each theme's TODO / FIXMEs
- skim [TODO.md](TODO.md) -- design notes for ideas not built yet
- as needed: [DENODE.md](DENODE.md) (one build script for Deno *and* Node),
  [test/fail-open/README.md](test/fail-open/README.md) (no-JS / slow-JS findings)
- [design.md](design.md) is the early (2022) sketch of the web component idea -- the gist, not today's api.
  THEMES.md has the real contract.

## Map
- `index.js` -- the core: finds & parses posts, caches them (localStorage, daily), writes `<bt-body>`, loads the theme.
  Its exports are the theme api (`cfg`, `state`, `url2post`, `all_posts`, `reveal`, `THEMES`, ...)
- `js/` -- search (lunr), text helpers, a tiny DOM for Deno
- `theme/<name>/index.js` (+ `index.css`) -- 12 themes.  `future-imperfect` (default) & `grid`: lit, shadow DOM.
  The rest: plain custom elements, light DOM, sharing `theme/html5up/shared.js`, fonts & Font Awesome
- `bin/build.js` -- the optional build: writes `index.xml` (feed + sitemap + search index); `--seo` adds post head lines.
  `bin/build` is the GitHub Action's entry point (other sites' workflows call it -- keep it working)
- `YYYY-MM-slug/index.html` -- posts (this repo is also blogtini.com).  `about/` etc: pages (`type: page`)
- `comments.json` -- comments; arrive as PRs from staticmin.  Keep its format exactly (see README "Comments")
- `index.xml` -- build output; regenerate it (`./bin/build`), don't hand-edit

## House rules
- **No third-party CDNs** (Google Fonts, jsDelivr, unpkg, cdnjs, gravatar.com, ...): they leak readers' IPs.
  Self-host (fonts, images), or import from `https://esm.ext.archive.org/` (the Internet Archive's esm.sh mirror).
  Every runtime import host must also allow crawlers in its `robots.txt` -- a blocked import blanks the page for Google.
- **No required build.**  Raw markdown files + the `<script>` line must keep working, w/o `index.xml`.
- **Fail open.**  If the JS never loads, a page still shows its text.  Don't add `display:none`-forever styles.
- **Browser-native**: ES modules, no bundler, no TypeScript, no `npm install` (libraries are pinned esm.ext.archive.org urls).
- No symlinks in what ships (GitHub Pages, the esm mirror & Windows checkouts may not follow them).
- New theme?  Add it to `THEMES` in `index.js`, a section in THEMES.md, & keep HTML5 UP `main.css` files as is
  (only their `@import` lines change).
- Change behavior => update README.md / THEMES.md in the same change.  Date new notes, eg: `(2026-10-28)`.

## Code style
Match the surrounding code: 2-space indent, no semicolons, `snake_case` functions & vars, terse comments (`w/`, `--`).
To do / fixmes: `xxxxx` (highest), `xxxx`, `xxx` (lowest).
Lint runs in CI (`.github/workflows/cicd.yml`: [dyno](https://github.com/internetarchive/dyno)'s `deno lint` + eslint).
Locally, `deno lint` catches most of it.

## Try it
```sh
./bin/build                 # or: node bin/build.js -- regenerates index.xml
python3 -m http.server      # then http://localhost:8000 -- add ?recache=1 after adding/removing posts
```
Try a theme w/o editing `config.yml`: http://localhost:8000/#theme=librarian

Releases (annotated git tags, `bin/releases`) are made by the maintainer.
