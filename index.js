

import yml from 'https://esm.ext.archive.org/js-yaml@4.1.0'
import dayjs from 'https://esm.ext.archive.org/dayjs@1.11.13'
import showdown from 'https://esm.ext.archive.org/showdown@2.1.0'

// adds header click actions, etc.

import search_setup, { btbody_root } from './js/search-setup.js'
import {
  markdown_to_html, summarize_markdown, markdown_parse, krsort, SKIP_DIRS,
} from './js/text.js'


// eslint-disable-next-line no-console
const log = console.log.bind(console)

// log(new URLSearchParams(location?.search))
const SEARCH = decodeURIComponent(location?.search)
const filter_tag  = (SEARCH.match(/^\?tags\/([^&/]+)/)        || ['', ''])[1]
const filter_cat  = (SEARCH.match(/^\?categories\/([^&/]+)/)  || ['', ''])[1]
const state = {
  tags: {},
  cats: {},
  urls_filtered: [],
  num_posts: 0,
  filedev: location?.protocol === 'file:',
  localdev: location?.hostname === 'localhost',
  pathrel: '',
  is_homepage: globalThis.document?.querySelector('body').classList.contains('homepage'),
  filter_post_url: null,
  page: Number((SEARCH.match(/[?/]page\/(\d+)/) || [1, 1])[1]) - 1,
  list_tags: !filter_tag && SEARCH.match(/[?&]tags/),
  list_cats: !filter_cat && SEARCH.match(/[?&]categories/),
  filter_tag,
  filter_cat,
}
const filter_post = (state.is_homepage
  ? '' :
  `${location?.origin}${location?.pathname}`.replace(/\/index\.html$/, '/'))


const STORAGE_KEY = url_to_base(location?.href ?? '') ?? 'blogtini'

// how many posts to fetch at once, when there's no index.xml w/ every post in it
const FETCH_BATCH = 10

const STORAGE = SEARCH.match(/[&?]recache=1/i)
  ? {} :
  JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}

/**
 * The themes shipped alongside this `index.js` (dirs under `theme/`) -- eg: for a theme's theme picker.
 * Picker links show them w/ spaces, eg: 'future imperfect' -- and map back w/ dashes.
 */
const THEMES = [
  'future-imperfect',
  'editorial',
  'massively',
  'phantom',
  'striped',
  'forty',
  'grid',
]

/**
 * Returns the absolute url of a theme shipped alongside *this* `index.js` --
 * so a site pinning a blogtini version (eg: `blogtini@1.0.5/index.js`) gets that version's theme, too.
 *
 * esm.sh-style mirrors (eg: esm.ext.archive.org/gh/) run us from a rebuilt `.../es2022/index.nobundle.mjs`,
 * so map back to the repo url, w/ `?bundle=false` -- so theme and `index.js` share one `cfg` & `state`.
 *
 * @param {string} theme eg: 'future-imperfect'
 */
function theme_url(theme) {
  const esm = import.meta.url.match(/^(https:\/\/.*\/gh\/[^/]+\/[^/]+@[^/]+)\/es20\d\d\/index\.nobundle\.mjs$/)
  if (esm)
    return `${esm[1]}/theme/${theme}/index.js?bundle=false`
  return new URL(`theme/${theme}/index.js`, import.meta.url).href
}

// defaults

let cfg = {
  user: '',
  repo: '',
  branch: 'main', // xxxx autodetect or 'master'
  site_url: 'https://example.com/',
  theme: theme_url('future-imperfect'),
  title: 'welcome to my blog',
  attribution: "Theme: <a href='https://github.com/pacollins/hugo-future-imperfect-slim' target='_blank' rel='noopener'>Hugo Future Imperfect Slim</a><br>A <a href='https://html5up.net/future-imperfect' target='_blank' rel='noopener'>HTML5 UP port</a> | Powered by <a href='https://blogtini.com/'  target='_blank' rel='noopener'>blogtini.com</a>",
  img_site: '',
  // Masks site image in a certain shape. Supported are: circle, triangle, diamond, and hexagon.
  img_site_shape: 'hexagon',
  posts_per_page: 10,
  site_header: 'https://traceypooh.github.io/blogtini/img/blogtini.png', // xxx
  reading_time: true,
  summary_length: 500,
  menu: {
    main: [], // xxx add some defaults
  },
  header: {
    share: true,
    search: true,
    language: false,
    theme: true,
  },
  // sidebar "See More" button.  default: homepage, scrolled to the post after the sidebar's recent posts
  view_more_posts_link: '',
  sidebar: {
    post_amount: 5,
    categories: true,
    categories_by_count: true,
  },
  social: {},
  social_share: ['twitter', 'facebook', 'pinterest', 'email'],
  remove_blur: true,
  contact: {
    answer_time: 24,
  },
}


function PR(str, val) {
  return val === '' || val === undefined || val === null ? '' : `${str[0]}${val}${str[1]}`
}

function urlize(url) { // xxx only handles post or cgi; xxx assumes posts are 1-dir down from top
  if ((state.filedev || state.localdev) && STORAGE.base && url.startsWith('https://'))
    // eslint-disable-next-line no-param-reassign
    url = url.replace(RegExp(`^${STORAGE.base}`), '')

  // (http, too -- eg: a post's own url, from adding itself to the cache, in localhost dev)
  if (url.startsWith('https://') || url.startsWith('http://'))
    return url

  // eslint-disable-next-line no-param-reassign
  url = url.replace(/\/index\.html$/, '')

  const cgi = url.startsWith('?')
  if (state.filedev) {
    // eslint-disable-next-line no-param-reassign
    url = url.replace(/\/+$/, '')
    if (state.is_homepage)
      return (cgi ? `./index.html${url}` : `${url}/index.html`)
    return (cgi ? `../index.html${url}` : `../${url}/index.html`)
  }

  if (state.is_homepage)
    return (cgi ? `./${url}` : `${url}/`)
  return (cgi ? `../${url}` : `../${url}/`)

  /*
  xxx when state.filedev mode, change links like:  src="./"  src="../"  href="./"  href="../" that
  xxx .. end in "/" to "/index.html".  use same method for emitting urls, eg:
  xxx .. site header /favorites/, / home, etc..., recent posts, etc.

  xxx when in top page / tags / cats mode, change links like:  src="../"  href="../"  to  "./"
  */
}

function urlify(url, no_trail_slashes = false) {
  return urlize(url).replace(/\/+$/, no_trail_slashes ? '' : '/')
}

/**
 * Returns an absolute or relative url for a theme asset;
 * depending on the `config.yml` value of `theme`.
 *
 * Example paths: fonts/raleway-regular.woff2, index.js
 *
 * @param {string} path relative path to fetch. if an absolute url (eg: 'https://'), path is returned as is
 */
function path_to_theme_url(path) {
  const absolute = /^[a-z][a-z0-9+.-]*:\/\//i
  if (path.match(absolute))
    return path

  // (ignore any `?query` -- eg: `?bundle=false` from esm.sh-style mirrors)
  const theme_dir = cfg.theme.replace(/\?.*$/, '').replace(/\/[^/]+\.js$/, '/')

  if (theme_dir.match(absolute))
    return `${theme_dir}${path}`

  // compute paths from hostname
  const path_from_top = cfg.site_url.replace(/^https:\/\/[^/]+/, '')
  return `${path_from_top}${path.startsWith(theme_dir) ? '' : theme_dir}${path}`
}


async function fetcher(url)  {
  const text = !url.match(/\.(json)$/i) || url.endsWith('/')

  if (globalThis.Deno && !url.startsWith('http')) {
    const tmp = Deno.readTextFileSync(url)
    return text ? tmp : JSON.parse(tmp)
  }

  try {
    const ret = await fetch(url.concat(url.endsWith('/') ? 'index.html' : ''))
    if (!ret.ok) {
      // safari file:// doesnt set .ok properly...
      if (!state.filedev || url.startsWith('http'))
        return null
    }
    const tmp = (text ? await ret.text() : await ret.json())
    return tmp

    /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
  } catch {}
  return null
}


function main_section(histogram) {
  // NOTE: keep in mind, anything returned *not* in a web component "wrapper" below, will be in
  // the unstyled light DOM, for example the `<hr>` below
  if (state.list_tags || state.list_cats)
    return `<bt-histogram histogram=${JSON.stringify(histogram)}></bt-histogram>`

  if (state.is_homepage && location.search?.startsWith('?contact'))
    return '<bt-contact></bt-contact>'

  state.show_previous_and_next = true

  if (filter_post)
    return `<bt-post-full url="${state.filter_post_url}"></bt-post-full>`

  return `
    ${state.show_top_content
      ? '<bt-post-full url="homepage/"></bt-post-full> <hr style="height:1px;padding:0;border:0;border-bottom:1px solid #a1a1a166;margin:2em 0">'
      : ''}

    <bt-posts>
      ${state.urls_filtered.map((url, idx) => `<bt-post id="post${state.page * cfg.posts_per_page + idx}" url="${urlify(url)}"></bt-post>`).join('')}
    </bt-posts>`
}

function bt_body() {
  const categories_histogram = {}
  if (cfg.sidebar.categories) {
    for (const cat of Object.keys(state.cats).sort())
      categories_histogram[cat] = state.cats[cat].length
  }

  const tags_histogram = {}
  for (const tag of Object.keys(state.tags).sort())
    tags_histogram[tag] = state.tags[tag].length


  const histogram = state.list_tags
    ? tags_histogram
    : (state.list_cats ? categories_histogram : null)

  document.querySelector('body').innerHTML =
    `<bt-body
      recent_posts='${JSON.stringify(STORAGE.docs.slice(0, cfg.sidebar.post_amount).map((e) => e.url))}'
      tags='${JSON.stringify(tags_histogram)}'
      categories='${JSON.stringify(categories_histogram)}'
    >${main_section(histogram)}</bt-body>`
}


async function main() {
  let tmp

  // this page's own file -- in parallel w/ everything else, until we need it
  const self_prom = !globalThis.Deno && (filter_post || state.is_homepage)
    ? fetch_self()
    : Promise.resolve(null)

  // see if this is an (atypical) "off site" page/post, compared to the main site
  const body_contents = globalThis.document?.querySelector('body').innerHTML.trim()

  const [my_frontmatter] = markdown_parse(body_contents ?? '')
  const base = my_frontmatter?.base

  state.pathrel = state.is_homepage || globalThis.Deno ? '' : '../' // xxxx generalize
  state.top_dir = base ?? state.pathrel
  // './' not '' -- `href=""` (or `href="#post5"`) would stay on the current `?page/2` or `?tags/x` page
  state.top_page = state.top_dir.concat(state.filedev ? 'index.html' : '') || './'

  if (!globalThis.Deno) {
    dark_mode()


    head_insert_generics()
  }

  if (state.is_homepage) {
    head_insert_titles('Blogtini') // xxx
  } else if (state.list_tags) {
    head_insert_titles('Tags')
  } else if (state.list_cats) {
    head_insert_titles('Categories')
  }


  if (!globalThis.Deno) {
    // default expect github pages hostname - user can override via their own `config.yml` file
    [tmp, cfg.user, cfg.repo] = location.href.match(/^https:\/\/(.*)\.github\.io\/([^/]+)/) || ['', '', '']
  }


  STORAGE.base ||= base

  tmp = yml.load(await fetcher(`${state.top_dir}config.yml`))
  if (tmp)
    cfg = { ...cfg, ...tmp } // xxx deep merge `sidebar` value hashmap, too

  // a viewer trying out themes w/ the theme picker overrides the site's theme (for them, for 24h)
  if (!globalThis.Deno && viewer_prefs().theme)
    cfg.theme = viewer_prefs().theme

  // a bare theme name (eg: `grid`) is one shipped alongside this `index.js` -- so it follows a pinned version
  if (cfg.theme.match(/^[\w-]+$/))
    cfg.theme = theme_url(cfg.theme)


  if (globalThis.Deno)
    return // the build step's head lines, index.xml, etc. are now in `bin/build.js`


  log({
    filter_post, base: STORAGE.base, STORAGE_KEY, cfg, state,
  })
  // log('STORAGE', JSON.parse(localStorage.getItem(STORAGE_KEY)))


  add_css(path_to_theme_url('index.css'))

  state.show_top_content = state.is_homepage && body_contents && !location.search
  if (state.show_top_content) {
    // NOTE: the front matter below wont get used -- but we need a title & date

    const date = date2ymd(new Date())

    state.homepage_post = markdown_to_post(`
---
title:
date: ${date}
type: homepage
---

${homepage_markdown(await self_prom) || body_contents}
`.trimStart(), location.href)
  }


  if (!Object.keys(STORAGE).length || STORAGE.created !== dayjs().format('MMM D, YYYY'))

    await storage_create()

  // trust this post's own file over the (up to a day old) cache -- eg: it was just edited
  const self = filter_post ? await self_prom : null
  const self_post = self ? markdown_to_post(self, filter_post) : undefined
  if (self_post)
    storage_overlay(self_post)


  storage_loop()


  bt_body()

  if (state.filedev || state.localdev)
    add_recache_button()


  add_interactivity()

  // if (state.filedev || state.localdev) // xxx ideally use normal customElements for production
  await import('https://esm.ext.archive.org/redefine-custom-elements@0.1.3')

  await import(path_to_theme_url(cfg.theme))


  globalThis.onunhandledrejection = (unhandled_rejection) => {
    reveal()
    // eslint-disable-next-line no-console
    console.error({ unhandled_rejection })
  }
}


/**
 * Shows the body, now that we've rendered it.
 * The build's head line hides it with a 3s CSS animation (so it shows even w/o JS) and `pre-wrap`
 * (so raw markdown keeps its line breaks w/o JS) -- undo both.
 * Older built pages & homepages hide with `display:none` instead -- undo that, too.
 */
function reveal() {
  const { style } = document.querySelector('body')
  style.animation = 'none'
  style.whiteSpace = 'normal'

  // older pages: drop their hiding `<style>` -- rather than an inline `display: block`,
  // which would override a theme's own `body` display (eg: striped's `display: flex`)
  for (const e of document.querySelectorAll('head style')) {
    if (e.textContent?.trim() === 'body{display:none}')
      e.remove()
  }

  // eg: sidebar "See More" goes to `#post5`.  The browser looked for it before we rendered it -- so scroll now
  if (!state.scrolled_to_hash && location.hash.match(/^#post\d+$/)) {
    state.scrolled_to_hash = true
    document.getElementById(location.hash.slice(1))?.scrollIntoView()
  }
}


/**
 * Fetches this page's own file, exactly as written.  (Not the DOM: the browser has parsed our markdown
 * as html by then -- eg: `> quote` reads back as `&gt; quote`, and code like `a<b` turns into tags.)
 * Every page renders from its own file, over the (up to a day old) cache -- so edits always show,
 * and dev renders the same bytes as prod's index.xml.
 * Dev mode skips the HTTP cache, too, so a reload shows what you just saved.
 *
 * @returns {Promise<string|null>}
 */
async function fetch_self() {
  try {
    const res = await fetch(location.href.replace(/[?#].*$/, ''), {
      cache: state.filedev || state.localdev ? 'no-cache' : 'default',
    })
    if (res.ok) return await res.text()
    /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
  } catch {}
  log('could not fetch this page, using the cache', location.href)
  return null
}


/**
 * Dev mode: a small button to rebuild the post cache -- eg: after adding or deleting a post.
 * Same as adding `?recache=1` to the url -- for when you can't, eg: a phone editor's preview pane.
 * (Not in a theme, so every theme gets it.)
 */
function add_recache_button() {
  const btn = document.createElement('button')
  btn.textContent = '↻'
  btn.title = 'dev: rebuild the post cache (eg: after adding or deleting a post)'
  btn.setAttribute('aria-label', btn.title)
  // `all:initial` so no theme `button` styles leak in.
  // a button's width in from the right -- clear of the bottom-right "back to top" button many themes have
  btn.style.cssText = [
    'all:initial', 'position:fixed', 'z-index:9999', 'right:44px',
    'bottom:calc(12px + env(safe-area-inset-bottom))', 'width:44px', 'height:44px',
    'border-radius:50%', 'background:rgba(0,0,0,.6)', 'color:#fff', 'cursor:pointer',
    'font:22px/44px system-ui,sans-serif', 'text-align:center',
  ].join(';')
  btn.addEventListener('click', () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
    } catch {}
    location.reload()
  })
  document.body.appendChild(btn)
}


/*
  A viewer's own theme picker & light/dark picks -- kept for 24h, just for them (this browser, this site).
  So people can try out themes (eg: on blogtini.com) and click around, before changing their own `config.yml`.
  (localStorage, not a cookie -- so it never gets sent to any server)
*/
const VIEWER_PREFS_KEY = `${STORAGE_KEY}-viewer`
const VIEWER_PREFS_MS = 24 * 60 * 60 * 1000

/**
 * Returns the viewer's unexpired picks, eg: { theme: 'editorial', scheme: 'dark' }
 */
function viewer_prefs() {
  const ret = {}
  try {
    const prefs = JSON.parse(localStorage.getItem(VIEWER_PREFS_KEY)) ?? {}
    for (const [key, { val, until }] of Object.entries(prefs)) {
      if (until > Date.now())
        ret[key] = val
    }
    /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
  } catch {}
  return ret
}

/**
 * Remembers a viewer's pick for 24h -- even if it's the site's default (so the notice stays once-a-day).
 * Shows a notice about it, unless they already had a pick saved.
 *
 * @param {string} key  'theme' or 'scheme'
 * @param {string} val  eg: 'editorial' or 'dark'
 */
function viewer_prefs_set(key, val) {
  if (!val || !`${val}`.match(/^[\w-]+$/))
    return
  const had_prefs = Object.keys(viewer_prefs()).length
  try {
    const prefs = JSON.parse(localStorage.getItem(VIEWER_PREFS_KEY)) ?? {}
    prefs[key] = { val, until: Date.now() + VIEWER_PREFS_MS }
    localStorage.setItem(VIEWER_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    return
  }
  if (!had_prefs)
    viewer_prefs_notice()
}

/**
 * A closable notice, centered over a dimmed page: picks here are just for this viewer, for 24h.
 * Closes w/ its buttons, a click on the dimmed page, or Escape.
 * (Plain text & `all:initial` so no theme styles leak in.)
 */
function viewer_prefs_notice() {
  const screen = document.createElement('div')
  screen.style.cssText = [
    'all:initial', 'position:fixed', 'inset:0', 'z-index:10001', 'background:rgba(0,0,0,.55)',
    'display:flex', 'align-items:center', 'justify-content:center', 'padding:16px', 'box-sizing:border-box',
  ].join(';')

  const box = document.createElement('div')
  box.setAttribute('role', 'dialog')
  box.setAttribute('aria-modal', 'true')
  box.setAttribute('aria-label', 'Theme picks are just for you, for 24 hours')
  box.style.cssText = [
    'all:initial', 'position:relative', 'display:block', 'box-sizing:border-box', 'max-width:30em',
    'padding:24px 44px 20px 24px', 'border-radius:10px', 'background:#fff', 'color:#222',
    'font:16px/1.5 system-ui,sans-serif', 'box-shadow:0 10px 40px rgba(0,0,0,.4)',
  ].join(';')

  const text = document.createElement('div')
  text.style.cssText = 'all:initial;display:block;font:inherit;color:inherit'
  text.textContent = 'Your theme and light/dark picks are saved for 24 hours -- just for you, in this browser. ' +
    "To change the theme of your own site, for you and all your viewers, set `theme:` in your site's top config.yml file."

  const close = () => {
    screen.remove()
    // eslint-disable-next-line no-use-before-define
    document.removeEventListener('keydown', on_key)
  }

  const on_key = (evt) => {
    if (evt.key === 'Escape')
      close()
  }

  const button = (label, css) => {
    const btn = document.createElement('button')
    btn.textContent = label
    btn.style.cssText = `all:initial;cursor:pointer;font-family:system-ui,sans-serif;${css}`
    btn.addEventListener('click', () => close())
    return btn
  }
  const x = button('×', 'position:absolute;top:8px;right:10px;width:32px;height:32px;font-size:24px;line-height:32px;text-align:center;color:#666')
  x.setAttribute('aria-label', 'Close')
  const ok = button('OK', 'display:block;margin:16px 0 0 auto;padding:8px 22px;border-radius:6px;background:#222;color:#fff;font-size:15px')

  screen.addEventListener('click', (evt) => {
    if (evt.target === screen)
      close()
  })
  document.addEventListener('keydown', on_key)

  box.append(x, text, ok)
  screen.appendChild(box)
  document.body.appendChild(screen)
  ok.focus()
}


/** @returns {string|undefined} the markdown in a homepage file: everything inside its `<body>` */
function homepage_markdown(text) {
  return text?.match(/<body[^>]*>([\s\S]*?)(<\/body>|$)/i)?.[1].trim()
}


/**
 * Puts this page's post into the cache, replacing any older copy of it (keeping that copy's url).
 * Leaves the cache (and its localStorage write, of every post) alone when the copy is the same.
 *
 * NOTE: a copy from index.xml never compares the same -- eg: its `featured` is a full url (vs. `seo.jpg`)
 * and its body is trimmed.  So the first view of each post, after each (daily) rebuild from index.xml,
 * writes once -- harmlessly.  Later views compare the same, until the post's file changes.
 * (To skip even that write, compare just the fields that matter: body, title, date, tags, etc.)
 */
function storage_overlay(post) {
  const cached = STORAGE.docs.find((e) => is_filter_post(e.url))
  if (cached) {
    post.url = cached.url // eslint-disable-line no-param-reassign
    post.type ||= 'post' // eslint-disable-line no-param-reassign
    // (via JSON, so eg: a js-yaml `Date` matches the cached ISO string)
    if (JSON.stringify(post) === JSON.stringify(cached)) return
  }

  const docs = {}
  for (const doc of STORAGE.docs) {
    if (is_filter_post(doc.url))
      post.url = doc.url // eslint-disable-line no-param-reassign
    else
      docs[storage_key(doc)] = doc
  }
  STORAGE.docs = docs
  storage_add(post)
  STORAGE.docs = Object.values(krsort(STORAGE.docs))

  localStorage.setItem(STORAGE_KEY, JSON.stringify(STORAGE))
}


async function storage_create() {
  STORAGE.created = dayjs().format('MMM D, YYYY')
  // what we have so far (eg: posts opened while browsing) -- kept, unless we find a full list of posts
  const prior = Object.fromEntries(
    (Array.isArray(STORAGE.docs) ? STORAGE.docs : []).map((e) => [storage_key(e), e]),
  )
  STORAGE.docs = {}

  // the build step's index.xml has every post already -- else find & fetch each post
  const from_feed = await posts_from_feed()
  const latest = from_feed ? [] : await find_posts()

  /** @returns {array} [file, promise of its contents (text, or a fetch() Response)] */
  const fetch_post = (url) => {
    // NOTE: the final match is for a demo single page in a dir (eg: /index.html => /, /test/post/)
    const mat = url.match(/^(.*)\/([^/]+)$/) || url.match(/^()([^/]+)$/) || url.match(/^()(.*\/)$/)
    const file = state.sitemap_htm ? url : mat[2]

    const url2 = (state.filedev || state.localdev) && STORAGE.base ? url.replace(RegExp(`^${STORAGE.base}`), '') : url

    const fetchee = ((state.sitemap_htm && !url2.startsWith('https://') && !url2.startsWith('http://')
      ? state.pathrel
      : '')).concat(url2).concat(state.filedev && url2.endsWith('/') ? 'index.html' : '')
    log({ file, url2, fetchee })

    return [file, fetcher(file).then((contents) => contents || fetch(fetchee))]
  }

  // fetch the posts in parallel, a batch at a time
  for (let n = 0; n < latest.length; n += FETCH_BATCH) {
    const batch = latest.slice(n, n + FETCH_BATCH).map(fetch_post)
    const vals = await Promise.all(batch.map(([, prom]) => prom))

    await parse_posts(Object.fromEntries(batch.map(([file], idx) => [file, vals[idx]])))
  }
  if (!from_feed && !state.sitemap_htm)
    STORAGE.docs = { ...prior, ...STORAGE.docs }
  log({ state })

  STORAGE.docs = Object.values(krsort(STORAGE.docs))

  localStorage.setItem(STORAGE_KEY, JSON.stringify(STORAGE))
}


/**
 * Loads every post & page from the build step's `index.xml` feed (see `bin/build.js`):
 * one request, no per-post fetches.
 *
 * @returns {boolean} true if the feed was found and loaded
 */
async function posts_from_feed() {
  const xml = await fetcher(`${state.top_dir}index.xml`)
  if (!xml) return false

  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const items = [...doc.querySelectorAll('item')]
  if (doc.querySelector('parsererror') || !items.length) return false

  // a feed w/o markdown bodies (eg: our pre-v2 `bin/rss`, or another tool's) can't drive summaries & search,
  // so find & fetch each post instead
  const CONTENT = 'http://purl.org/rss/1.0/modules/content/'
  if (!items.some((e) => e.getElementsByTagNameNS(CONTENT, 'encoded').length)) {
    log('index.xml has no <content:encoded> bodies, ignoring it')
    return false
  }

  if (!STORAGE.base)
    setup_base(items.map((e) => e.querySelector('link')?.textContent ?? ''))

  for (const item of items) {
    const text = (tag) => item.querySelector(tag)?.textContent.trim() ?? ''
    const cats = (domain) => [...item.querySelectorAll(`category[domain="${domain}"]`)]
      .map((e) => e.textContent.trim().replace(/ /g, '-').toLowerCase())
    // namespaced elements, eg: <content:encoded>
    const ns = (uri, tag) => item.getElementsByTagNameNS(uri, tag)[0]
    const MEDIA = 'http://search.yahoo.com/mrss/'

    const date = new Date(text('pubDate'))
    if (isNaN(date)) continue

    // same shape as `markdown_to_post()` makes
    const post = {
      url: text('link'),
      title: text('title'),
      date: date.toISOString(),
      body_raw: ns(CONTENT, 'encoded')?.textContent ?? '',
      tags: cats('tag'),
      categories: cats('category'),
      featured: ns(MEDIA, 'content')?.getAttribute('url') ?? '',
      featuredcaption: ns(MEDIA, 'description')?.textContent.trim() ?? '',
    }
    const [type] = cats('type')
    if (type) post.type = type
    // (keep `body_raw` even when empty -- eg: a photo-only post -- like `markdown_to_post()` does)
    for (const key of Object.keys(post))
      if (post[key] === '' && key !== 'body_raw') delete post[key]


    storage_add(post)
  }
  log('loaded posts from index.xml', items.length)
  return true
}


function url_to_base(url) {
  // eg: https://traceypooh.github.io/dwebtini/
  // eg: https://ipfs.io/ipfs/QmZ2AkWMBq3eqr34GtFV2ut62TM6iQe5DRQHwr1XNhY2M6/
  const mat =
    url.match(/^https:\/\/[^.]+\.(github|gitlab)\.io\/[^/]+\//) ||
    url.match(/^https:\/\/ipfs\.io\/ipfs\/[^/]+\//) ||
    url.match(/^https:\/\/blogtini\.com\//)
  return (mat ? mat[0] : undefined)
}


function setup_base(urls) { // xxx get more sophisticated than this!  eg: if all "starts" in
  /*                           sitemap.xml are the same, compute the post-to-top pathrel/top_page */
  for (const url of urls) {
    const base = url_to_base(url)
    if (base) {
      STORAGE.base = base
      log('BASE', STORAGE.base)
      return
    }
  }
}


async function find_posts() {
  const FILES = []

  // a plain list of posts, eg: made via:  find . -name index.html > index.txt  (or hand-edited)
  // -- ahead of sitemap.xml: it's easier to write & keep up, so likelier the one someone means
  const list_urls = index_txt_urls(await fetcher(`${state.top_dir}index.txt`))

  // else a sitemap (eg: pre-v2 blogtini sites, hand-made)
  const urls = list_urls.length
    ? list_urls
    : (await fetcher(`${state.top_dir}sitemap.xml`))?.split('<loc>')
      .slice(1)
      .map((e) => e.split('</loc>').slice(0, 1).join(''))
      .filter((e) => e !== '')

  if (urls?.length) {
    log({ urls })
    FILES.push(...urls)
    state.sitemap_htm = true
    if (!STORAGE.base)
      setup_base(urls)
  } else {
    // handles the "i'm just trying it out" / no list of posts case:
    // the page itself gets added by `storage_overlay()` -- and the cache grows as you browse
    state.sitemap_htm = false
  }
  log({ cfg, state })

  const latest = FILES.filter((e) => e.endsWith('/') || e.match(/\.(md|markdown|html|htm)$/i)).sort().reverse() // xxx assumes file*names*, reverse sorted, is latest post first...
  log(latest.slice(0, cfg.posts_per_page))

  return latest
}


/**
 * Parses a plain list of posts, one per line -- eg: made via:  find . -name index.html > index.txt
 * Lines can be like `./2024-07-my-post/index.html`, `2024-07-my-post/` or `2024-07-my-post`.
 * Skips blank lines, `#` comments, the homepage, and dirs that are never posts (eg: `test/`).
 *
 * @param {string|null} text  index.txt contents
 * @returns {string[]} absolute urls (same form as a post's own url, so the two match)
 */
function index_txt_urls(text) {
  const top = new URL(state.top_dir || './', location.href)
  const skip = (path) => path.split('/')
    .some((dir) => dir.startsWith('.') || dir.startsWith('_') || SKIP_DIRS.has(dir))

  return (text ?? '').split('\n')
    .map((e) => e.trim().replace(/^\.\//, '').replace(/(^|\/)index\.html$/, '$1'))
    .filter((e) => e && !e.startsWith('#') && !skip(e))
    .map((e) => new URL(e.endsWith('/') || e.match(/\.\w+$/) ? e : `${e}/`, top).href)
}


function markdown_to_post(markdown, url = location.pathname) {
  const [json, body_raw] = markdown_parse(markdown)
  if (!json) {
    // no front-matter or not parseable -- skip
    // eslint-disable-next-line no-console
    console.error('not parseable', { url, markdown })
    return undefined
  }

  log({ json })

  const title      = json.title?.trim() ?? ''
  const tags       = (json.tags       ?? []).map((e) => e.trim().replace(/ /g, '-').toLowerCase())
  const categories = (json.categories ?? []).map((e) => e.trim().replace(/ /g, '-').toLowerCase())
  const date       = json.date || json.created_at || '' // xxx any more possibilities should do?  // xxx try to parse date from start of path/url!

  if (!date) {
    // eslint-disable-next-line no-console
    console.error('no date', { url, json })
    return undefined
  }

  // hugo uses 'images' array - xxx reconcile & copy over related 0th element featuredalt, etc.

  const featured = json.featured?.trim() || json.featured_image?.trim() || (json.images
    ? (typeof json.images === 'object' ? json.images.shift() : json.images.trim())
    : '')
  log({ date, featured })
  // author xxx

  const post = {
    url, title, date, body_raw, tags, categories, featured,
  }
  for (const key of ['featuredcaption'])
    if (key in json) post[key] = json[key]
  // keep stored hashmap small as possible - delete key/val where val is empty
  for (const key of Object.keys(post))
    if (post[key] === '' || post[key] === undefined || post[key] === null) delete post[key]

  if ('type' in json && json.type !== 'post') post.type = json.type

  return post
}


async function parse_posts(markdowns) {
  for (const [file, markdown] of Object.entries(markdowns)) {
    const url = file.replace(/\.md$/, '')

    // the very first post might have been loaded into text if the webserver served the markdown
    // file directly.  the rest are fetch() results.
    const post = markdown_to_post(
      typeof markdown === 'string' ? markdown : await markdown.text(),
      url,
    )
    if (post)

      storage_add(post)
  }
}

function storage_loop() {
  showdown.setFlavor('github')

  state.newest = STORAGE.newest

  for (const post of STORAGE.docs) {
    for (const tag of post.tags) {
      state.tags[tag] ||= []
      state.tags[tag].push(post.url)
    }
    for (const cat of post.categories) {
      state.cats[cat] ||= []
      state.cats[cat].push(post.url)
    }

    if (state.list_tags || state.list_cats)
      continue

    if (filter_tag.length  &&       !(post.tags.includes(filter_tag))) continue
    if (filter_cat.length  && !(post.categories.includes(filter_cat))) continue
    if (filter_post) {
      if (!is_filter_post(post.url) && STORAGE.docs.length !== 1) {
        // note prior and next posts
        if (!state.filter_post_url)
          state.filter_post_url_prior = urlify(post.url)
        if (state.filter_post_url && !state.filter_post_url_next)
          state.filter_post_url_next = urlify(post.url)

        continue
      }
      state.filter_post_url = urlify(post.url)
    }

    if (filter_post) {
      head_insert_json_ld(post)

      head_insert_titles(post.title, imgurl(post, true, false))
    } else if (filter_tag.length) {
      head_insert_titles(`posts tagged: ${filter_tag} - blogtini.com`) // xxx
    } else if (filter_cat.length) {
      head_insert_titles(`posts in category: ${filter_cat} - blogtini.com`) // xxx
    }

    if (!filter_post)
      state.urls_filtered.push(post.url)
  }

  const postL = state.page * cfg.posts_per_page
  const postR = postL + cfg.posts_per_page
  state.page_more = postR < state.urls_filtered.length
  state.urls_filtered = state.urls_filtered.slice(postL, postR)
}


/** @returns {boolean} true if `url` is this (single post/page) page's post */
function is_filter_post(url) {
  const url_no_args = url.replace(/\?.*$/, '').replace(/&.*$/, '')
  return Boolean(
    url_no_args === filter_post ||
    url_no_args === `${filter_post}/` ||
    // deal with IPFS immutable (and unknowable a priori) CID
    (filter_post.startsWith('https://ipfs.io/ipfs/') && !url_no_args.startsWith('https://') &&
      filter_post.replace(/^https:\/\/ipfs\.io\/ipfs\/[^/]+\//, '') === url_no_args) ||
    // local file:// dev
      ((state.filedev || state.localdev) && STORAGE.base && filter_post.endsWith(url_no_args.replace(RegExp(`^${STORAGE.base}`), ''))), // xxxx endsWith() lame
  )
}


/** @returns {string} key for `STORAGE.docs` -- newest first, when reverse sorted */
function storage_key(post) {
  const ts = Math.round(new Date(post.date) / 1000)
  return `p${isNaN(ts) ? '' : ts} ${post.url}`
}


function storage_add(post) { // xxx use snippet
  if (!('type' in post))
    // eslint-disable-next-line no-param-reassign
    post.type = 'post'

  STORAGE.docs[storage_key(post)] = post

  state.num_posts += 1


  const ymd = date2ymd(new Date(post.date))
  if (!STORAGE.newest || ymd > STORAGE.newest)
    STORAGE.newest = ymd
}


function date2ymd(date) {
  return [
    date.getUTCFullYear(),
    `${1 + date.getUTCMonth()}`.padStart(2, '0'),
    `${date.getUTCDate()}`.padStart(2, '0'),
  ].join('-')
}

function datetime(date) {
  // front matter dates w/o a time, eg: `date: 2023-06-15`, arrive as UTC midnight.  Show that day --
  // not "Wednesday, Jun 14, 2023 5:00 PM", which is what UTC midnight is in local time west of UTC.
  // (They arrive as a `Date` from js-yaml, or an ISO string from index.xml or localStorage)
  const d = new Date(date)
  if (isNaN(d)) return String(date ?? '')
  if ((typeof date === 'string' && date.length <= 10) || d.toISOString().endsWith('T00:00:00.000Z'))
    return dayjs(date2ymd(d)).format('MMMM D, YYYY') // dayjs reads 'YYYY-MM-DD' as local midnight

  return dayjs(d).format('dddd, MMM D, YYYY h:mm A')
}

/**
 * Sets dark theme if prefers dark mode *and* it's nighttime: before 7am or from 6pm, localtime.
 * Unless the viewer picked light or dark (w/ a theme's "Scheme" lightbulb) in the last 24h.
 */
function dark_mode() {
  const { scheme } = viewer_prefs()
  if (scheme) {
    document.documentElement.setAttribute('scheme', scheme)
    return scheme === 'dark'
  }

  const hour = new Date().getHours()
  const dark = (hour < 7 || hour > 17) && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches
  if (dark)
    document.documentElement.setAttribute('scheme', 'dark')
  return dark
}

function add_interactivity() {
  if (!btbody_root()) {
    setTimeout(add_interactivity, 250) // xxx
    return
  }

  // one listener for the page -- so the theme menu keeps working after each theme switch re-renders it
  state.theme_change_number = 0
  document.addEventListener('click', async (evt) => {
    const path = evt.composedPath()

    // a theme's "Scheme" lightbulb.  (Its own click handler already toggled the scheme -- remember it)
    if (path.some((e) => e.matches?.('.scheme-toggle'))) {
      viewer_prefs_set('scheme', document.documentElement.getAttribute('scheme'))
      return
    }

    const link = path.find((e) => e.matches?.('#theme-menu a'))
    if (!link)
      return

    evt.preventDefault()
    const theme = link.textContent.trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '')
    if (!theme)
      return

    log({ theme })

    state.theme_change_number += 1
    // (a variable, not an inline template, so bundlers (eg: esm.ext.archive.org/gh/) dont try to resolve it)
    const url = theme_url(theme)

    // swap in the new theme's light DOM css
    document.querySelectorAll('link[data-theme-css]').forEach((e) => e.remove())
    add_css(url.replace(/\?.*$/, '').replace(/[^/]+\.js$/, 'index.css'))

    await import(`${url}${url.includes('?') ? '&' : '?'}${state.theme_change_number}`)

    bt_body()

    search_setup(STORAGE.docs, cfg) // the new theme's search box
    if (state.filedev || state.localdev)
      add_recache_button() // (`bt_body()` replaced the whole `<body>`)

    viewer_prefs_set('theme', theme)
  })

  search_setup(STORAGE.docs, cfg)
}


function add_css(file) {
  const { head } = document
  const e = document.createElement('link')
  e.type = 'text/css'
  e.rel = 'stylesheet'
  e.href = file
  e.dataset.themeCss = '' // so a theme switch can swap it out
  head.appendChild(e)
}

function head_insert_generics() {
  {
    const e = document.createElement('meta') // xxxx no worky
    e.setAttribute('charset', 'utf-8')
    document.head.appendChild(e)
  }
  {
    const e = document.createElement('meta')
    e.setAttribute('name', 'viewport')
    e.setAttribute('content', 'width=device-width, initial-scale=1')
    document.head.appendChild(e)
  }
}

function imgurl(post, nohash = true, relative = false) {
  const prefix = relative ? state.top_dir : cfg.site_url

  if (!post.featured)
    return `${prefix}${cfg.img_site}`

  const img = post.featured.startsWith('https://')
    ? post.featured
    : `${prefix}img/${post.featured}` // xxxcc /img/

  return nohash ? img.replace(/#(bottom|top)$/, '') : img
}

function head_insert_titles(title, img) {
  document.title = title // xxx &gt; &lt;

  // document.getElementsByTagName('meta')['description'].content = 'New meta description'
  // document.getElementsByTagName('meta')['viewport']
  // <meta name="description" content="SPA metadata is not so fun"/>

  if (img) {
    const e = document.createElement('meta') // chexxx
    e.setAttribute('property', 'og:image')
    e.setAttribute('content', img) // xxx quote escape, etc.
    document.head.appendChild(e)
  }
}

function head_insert_json_ld(post) {
  // https://schema.org/BlogPosting#Examples

  const { head } = document
  const e = document.createElement('script')
  e.type = 'application/ld+json'

  const img = imgurl(post)
  const data = {
    '@context': 'https://schema.org/',
    '@type': 'BlogPosting',
    '@id': `${post.url}#BlogPosting`,
    url: post.url,
    mainEntityOfPage: post.url,
    headline: post.title,
    name: post.title,
    datePublished: date2ymd(new Date(post.date ?? new Date().getTime())),
    wordCount: post.body_raw.trim().split(/\s+/).length,
    keywords: [...new Set([...post.tags, ...post.categories])], // unique array(s); preserve order
    image: {
      '@type': 'ImageObject',
      '@id': img,
      url: img,
      // height: '362', // xxxcc
      // width: '388', // xxxcc
    },
    // dateModified: '2019-05-14', // xxxcc
    // "description": "xxxcc",
  }
  log('JSONLD', { post, data })

  e.innerHTML = JSON.stringify(data)
  head.appendChild(e)
}


/*
function head_insert_specifics() {
  // document.getElementsByTagName('meta')['keywords'].content = 'updated keywords xxx'
  // document.getElementsByTagName('meta')['description'].content = 'updated description xxx'
} */

/*
function slugify(str) {
  return str.toLowerCase()
    .replace(/'s/g, 's')
    .replace(/[^a-z0-9-]/g, '-') // xxx i18l
    .replace(/--+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '')
} */


const url2post_map = {}
function url2post(url = '') {
  if (url === 'homepage/')
    return state.homepage_post

  if (!Object.keys(url2post_map).length) {
    for (const [idx, post] of Object.entries(STORAGE.docs)) {
      // in localdev/filedev mode, make so we can find post with "short" urls
      url2post_map[urlify(post.url)] = idx
      url2post_map[post.url] = idx
    }
    // log({ url2post_map })
  }
  return STORAGE.docs[url2post_map[url]]
}


if (!globalThis.blogtini_imported) {
  globalThis.blogtini_imported = true // avoid any inadvertent double import

  void main()
}


export {
  cfg,
  state,
  url2post,
  summarize_markdown,
  urlify,
  datetime,
  markdown_to_html,
  PR,
  imgurl,
  fetcher,
  path_to_theme_url,
  reveal,
  btbody_root,
  THEMES,
}
