

import yml from 'https://esm.ext.archive.org/js-yaml@4.1.0'
import dayjs from 'https://esm.ext.archive.org/dayjs@1.11.13'
import showdown from 'https://esm.ext.archive.org/showdown@2.1.0'

// adds header click actions, etc.

import search_setup from './js/search-setup.js'
import {
  markdown_to_html, summarize_markdown, markdown_parse, krsort,
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

const STORAGE = SEARCH.match(/[&?]recache=1/i)
  ? {} :
  JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}

// defaults

let cfg = {
  user: '',
  repo: '',
  branch: 'main', // xxxx autodetect or 'master'
  site_url: 'https://example.com/',
  theme: 'https://blogtini.com/theme/future-imperfect/index.js',
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

  if (url.startsWith('https://'))
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
 * @param {string} path relative path to fetch. if starts with 'https://', path is returned as is
 */
function path_to_theme_url(path) {
  if (path.startsWith('https://'))
    return path

  if (path === 'index.css') {
    // OK so IFF someone is using https://deno.land/x/blogtini theme urls for versioning/semver,
    // the main problem there is it won't serve CSS files due to CORS blocking.
    // We only have minimal CSS that rarely changes in the only `.css` file in use for main theme,
    // so (for now at least), just load it from the main deploy location that is CORS open.
    const mat = cfg.theme.match(/https:\/\/deno\.land\/x\/blogtini[^/]+\/(.*)\/index\.js$/)
    if (mat) {
      // eg: https://deno.land/x/blogtini@1.0.2/theme/future-imperfect/index.js
      return `https://blogtini.com/${mat[1]}/index.css`
    }
  }

  const theme_dir = cfg.theme.replace(/\/[^/]+\.js$/, '/')

  if (theme_dir.startsWith('https://'))
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


  const histogram = state.list_tags ? tags_histogram : (state.list_cats ? categories_histogram : null)

  document.querySelector('body').innerHTML =
    `<bt-body
      recent_posts='${JSON.stringify(STORAGE.docs.slice(0, cfg.sidebar.post_amount).map((e) => e.url))}'
      tags='${JSON.stringify(tags_histogram)}'
      categories='${JSON.stringify(categories_histogram)}'
    >${main_section(histogram)}</bt-body>`
}


async function main() {
  let tmp

  // see if this is an (atypical) "off site" page/post, compared to the main site
  const body_contents = globalThis.document?.querySelector('body').innerHTML.trim()

  const [my_frontmatter] = markdown_parse(body_contents ?? '')
  const base = my_frontmatter?.base

  state.pathrel = state.is_homepage || globalThis.Deno ? '' : '../' // xxxx generalize
  state.top_dir = base ?? state.pathrel
  state.top_page = state.top_dir.concat(state.filedev ? 'index.html' : '')

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

${body_contents}
`.trimStart(), location.href)
  }


  if (!Object.keys(STORAGE).length || STORAGE.created !== dayjs().format('MMM D, YYYY'))

    await storage_create()


  storage_loop()


  bt_body()


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
  style.display = 'block'

  // eg: sidebar "See More" goes to `#post5`.  The browser looked for it before we rendered it -- so scroll now
  if (!state.scrolled_to_hash && location.hash.match(/^#post\d+$/)) {
    state.scrolled_to_hash = true
    document.getElementById(location.hash.slice(1))?.scrollIntoView()
  }
}


async function storage_create() {
  STORAGE.created = dayjs().format('MMM D, YYYY')
  STORAGE.docs = STORAGE.docs || {}

  // the build step's index.xml has every post already -- else find & fetch each post

  const latest = await posts_from_feed() ? [] : await find_posts()

  let proms = []
  let files = []
  for (let n = 0; n < latest.length; n++) {
    const url = latest[n]
    // NOTE: the final match is for a demo single page named /index.html => /
    const mat = url.match(/^(.*)\/([^/]+)$/) || url.match(/^()([^/]+)$/) || url.match(/^()(\/)$/)
    const file = state.sitemap_htm ? latest[n] : mat[2]

    const contents = await fetcher(file)
    files.push(file)

    const url2 = (state.filedev || state.localdev) && STORAGE.base ? url.replace(RegExp(`^${STORAGE.base}`), '') : url

    const fetchee = ((state.sitemap_htm && !url2.startsWith('https://') && !url2.startsWith('http://')
      ? state.pathrel
      : '')).concat(url2).concat(state.filedev && url2.endsWith('/') ? 'index.html' : '')
    log({ file, url2, fetchee })

    proms.push(contents || fetch(fetchee))

    if (((n + 1) % cfg.posts_per_page) && n < latest.length - 1)
      continue // keep building up requests

    // now make the requests in parallel and wait for them all to answer.
    const vals = await Promise.all(proms)
    const file2markdown = files.reduce((obj, key, idx) => ({ ...obj, [key]: vals[idx] }), {})


    await parse_posts(file2markdown)

    files = []
    proms = []
  }
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
      body_raw: ns('http://purl.org/rss/1.0/modules/content/', 'encoded')?.textContent ?? '',
      tags: cats('tag'),
      categories: cats('category'),
      featured: ns(MEDIA, 'content')?.getAttribute('url') ?? '',
      featuredcaption: ns(MEDIA, 'description')?.textContent.trim() ?? '',
    }
    const [type] = cats('type')
    if (type) post.type = type
    for (const key of Object.keys(post))
      if (post[key] === '') delete post[key]


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

  const sitemap_urls = (await fetcher(`${state.top_dir}sitemap.xml`))?.split('<loc>')
    .slice(1)
    .map((e) => e.split('</loc>').slice(0, 1).join(''))
    .filter((e) => e !== '')

  if (sitemap_urls) {
    log({ sitemap_urls })
    FILES.push(...sitemap_urls)
    state.sitemap_htm = true
    if (!STORAGE.base)
      setup_base(sitemap_urls)
  } else {
    // handles the "i'm just trying it out" / no sitemap case
    FILES.push(location.pathname) // xxx
    state.sitemap_htm = false
  }
  log({ cfg, state })

  const latest = FILES.filter((e) => e.endsWith('/') || e.match(/\.(md|markdown|html|htm)$/i)).sort().reverse() // xxx assumes file*names*, reverse sorted, is latest post first...
  log(latest.slice(0, cfg.posts_per_page))

  return latest
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
      state.tags[tag] = state.tags[tag] || []
      state.tags[tag].push(post.url)
    }
    for (const cat of post.categories) {
      state.cats[cat] = state.cats[cat] || []
      state.cats[cat].push(post.url)
    }

    if (state.list_tags || state.list_cats)
      continue

    if (filter_tag.length  &&       !(post.tags.includes(filter_tag))) continue
    if (filter_cat.length  && !(post.categories.includes(filter_cat))) continue
    if (filter_post) {
      const url_no_args = post.url.replace(/\?.*$/, '').replace(/&.*$/, '')
      const match = (
        url_no_args === filter_post ||
        url_no_args === `${filter_post}/` ||
        // deal with IPFS immutable (and unknowable a priori) CID
        (filter_post.startsWith('https://ipfs.io/ipfs/') && !url_no_args.startsWith('https://') &&
          filter_post.replace(/^https:\/\/ipfs\.io\/ipfs\/[^/]+\//, '') === url_no_args) ||
        // local file:// dev
          ((state.filedev || state.localdev) && STORAGE.base && filter_post.endsWith(url_no_args.replace(RegExp(`^${STORAGE.base}`), ''))) // xxxx endsWith() lame
      )
      if (!match && STORAGE.docs.length !== 1) {
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


function storage_add(post) { // xxx use snippet
  const ts = Math.round(new Date(post.date) / 1000)
  const key = `p${isNaN(ts) ? '' : ts} ${post.url}`

  if (!('type' in post))
    // eslint-disable-next-line no-param-reassign
    post.type = 'post'

  STORAGE.docs[key] = post

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
 * Sets dark theme if [7am .. 5pm] localtime and prefers dark mode
 */
function dark_mode() {
  const hour = new Date().getHours()
  const dark = (hour < 7 || hour > 17) && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches
  if (dark)
    document.documentElement.setAttribute('scheme', 'dark')
  return dark
}

function add_interactivity() {
  const btbody = document.querySelector('bt-body')?.shadowRoot
  if (!btbody) {
    setTimeout(add_interactivity, 250) // xxx
    return
  }

  state.theme_change_number = 0
  btbody.querySelectorAll('#theme-menu a').forEach((e) => {
    e.addEventListener('click', async (evt) => {
      const theme = evt.target.innerText.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '')
      evt.preventDefault()
      if (!theme)
        return false

      log({ theme })

      state.theme_change_number += 1
      await import(`../theme/${theme}/index.js?${state.theme_change_number}`)

      bt_body()

      return false
    })
  })

  search_setup(STORAGE.docs, cfg)
}


function add_css(file) {
  const { head } = document
  const e = document.createElement('link')
  e.type = 'text/css'
  e.rel = 'stylesheet'
  e.href = file
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
}
