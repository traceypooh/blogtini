# Contributing to blogtini

Welcome!  blogtini is markdown blogs & websites, painted in the browser -- each post a plain text file in a git
repo, & one theme JS that draws it.  It's small, & there's lots of fun to be had: especially **themes**.


## Try it (5 minutes)
```sh
git clone https://github.com/traceypooh/blogtini && cd blogtini
./bin/build               # (deno) -- or: node bin/build.js.  Writes index.xml: the list of posts
python3 -m http.server    # then open http://localhost:8000
```
- Flip thru every theme, live: http://localhost:8000/preview/
- Or try one on the whole site: http://localhost:8000/#theme=librarian
- Added or removed a post?  Click the bottom ↻ button (or add `?recache=1`).

Then skim [README.md](README.md) (how it all works) & [THEMES.md](THEMES.md) (how themes plug in).


## Ways to help -- small to big

### 1. File an issue
Found something off?  [Open an issue](https://github.com/traceypooh/blogtini/issues/new/choose) -- there are
short forms for a **theme bug**, a **theme request**, & an **idea**.  For a theme bug, the most useful bits:
which theme, a screenshot, your browser, the window width, & light or dark (the "Scheme" lightbulb).

### 2. Port a theme
blogtini has 15 themes; there are lots more good ones.  [THEMES.md "Next ports"](THEMES.md#next-ports) lists
HTML5 UP templates not done yet, most downloaded first -- good blog fits: **Prologue**, **Spectral**,
**ZeroFour**, **Escape Velocity**, **Dopetrope**, **Verti**, **Read Only**.  And beyond HTML5 UP: **Doks**,
**Ananke**, **Clean White**.

Follow [THEMES.md "Adding an HTML5 UP theme"](THEMES.md#adding-an-html5-up-theme), starting from a port that's
shaped like yours:
- classic layouts (banner, nav bar, sidebar pages): `theme/strongly-typed/` or `theme/helios/`
- one-page, scrolling sections: `theme/hyperspace/`
- tiles & cards: `theme/forty/` or `theme/phantom/`

### 3. Make an original theme
Three themes are blogtini's own, made from scratch -- each w/ a blog post on how it came to be:
[Librarian](2026-10-librarian-theme/) (a library card catalog, on Tufte CSS),
[Dossier](2026-11-dossier-theme/) (spy-movie case files), &
[Cosmos](2026-11-cosmos-theme/) (an 80s vector arcade game, in space -- see its "Genesis" section: a theme can
start from a casual idea).  What would *yours* be?

### 4. Fix a TODO
Each theme in THEMES.md has a **TODO / FIXME** list -- & `git grep xxxx` (highest priority) or `git grep xxx`
finds the rest.  Bigger ideas: [README "Ideas / later"](README.md#ideas--later).


## Working w/ an AI agent
[CLAUDE.md](CLAUDE.md) is the briefing for contributors *and* their AI agents: a map of the code, the house
rules, & the code style.  (It works for any agent -- point yours at it.)  A good first prompt:

> Read CLAUDE.md & THEMES.md.  Then port HTML5 UP's Spectral theme to blogtini, following "Adding an HTML5 UP
> theme" -- modeled on theme/hyperspace/.

Look at it in the browser as you go -- themes are visual, & an agent can't see what you see.
Screenshots of anything off help it a lot.


## The house rules (short version -- CLAUDE.md has them all)
- **No third-party CDNs** (Google Fonts, jsDelivr, unpkg, ...): they leak readers' IPs.  Self-host fonts &
  images; import JS from `https://esm.archive.org/`.
- **No required build**: raw markdown files + their one `<script>` line must keep working.
- **Fail open**: if the JS never loads, a page still shows its text.
- **Browser-native**: ES modules, no bundler, no TypeScript, no `npm install`.
- Changed behavior?  Update README.md / THEMES.md in the same change.


## Tests
```sh
deno task test                    # unit & build tests -- seconds
deno task test:themes             # every theme, in headless Chrome -- a few minutes
deno task test:themes dossier     # just one (or a few) themes
```
The theme test loads every theme on every kind of page -- the homepage, a list of posts, a post, a tag page,
contact, ... -- at desktop & phone widths, light & dark, on a tiny test site (`test/fixtures/site/`).  It
fails a page that doesn't draw, throws a JS error, calls any server but esm.archive.org (no CDNs!), or whose
theme picker won't open (or opens hidden under something) -- & warns when a page scrolls sideways.  Then **open `test/out/index.html`**: a screenshot of every page, problems
marked -- the quickest way to eyeball a theme everywhere at once.  (`--all`: every page at every size & scheme.)
It needs Chrome (or Chromium); set `CHROME=/path/to/it` if it's somewhere unusual.

```sh
deno task test:cls                # layout shift (Google's CLS), every theme -- a few minutes
deno task test:cls dossier        # just one (or a few) themes
```
The layout shift test loads the homepage, a list of posts, a post w/ pictures, & one w/o -- desktop & phone --
w/ the worst case: Chrome holds every image until the page has drawn, then lets them all arrive at once (like a
slow phone).  Then it scrolls down, like a reader.  For each page: its CLS score, & which elements moved most.
In the default theme, it also opens a post w/ 7 pictures: the first 4 must load right away, the last 3 lazily, &
all 7 must arrive once scrolled to.
✓ good (<= 0.1), ! needs improvement (<= 0.25), ✗ poor -- Google's thresholds.  See
[future-imperfect.md](future-imperfect.md#placeholder-shapes-done) for how blogtini keeps images from shifting.

Pull requests run `test` & `test:themes`, automatically (`.github/workflows/test.yml`).


## A theme pull request includes
- [ ] `theme/<name>/index.js` & `index.css` (+ the original's `LICENSE` file, & self-hosted fonts w/ theirs),
      its source credited in the theme's footer, & a row in [CREDITS.md](CREDITS.md)
- [ ] its name in `THEMES` in `index.js`
- [ ] a section in THEMES.md: what changed from the original, how blogtini maps into it, & its TODOs
- [ ] a card on [themes/index.html](themes/index.html), & a screenshot -- see THEMES.md "Screenshots"
- [ ] `deno lint` & `deno task test` pass
- [ ] `deno task test:themes <name>` passes -- & its screenshots (`test/out/index.html`) look right: a list of
      posts, a post, a tag page, contact, phone width, & dark
- [ ] `deno task test:cls <name>`: no ✗ (poor) -- see THEMES.md "Adding an HTML5 UP theme" on images

Not a theme?  Same idea: small focused changes, docs updated, `deno lint`, `deno task test` (+ a test for a
fix or feature, if you can), & a look in the browser.


## Licensing
blogtini's code is MIT; its own theme designs are CC BY 4.0 ([LICENSE](LICENSE)).
Contributions are under the same terms.
Bring in someone else's theme, font or library only if its license allows it
-- & credit it ([CREDITS.md](CREDITS.md)).


## Questions
Open an issue, or start one as a question -- happy to help you get going.

Thanks for helping build blogtini!
