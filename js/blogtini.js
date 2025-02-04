
/* eslint-disable no-continue */
import yml from 'https://esm.ext.archive.org/js-yaml@4.1.0'
import dayjs from 'https://esm.ext.archive.org/dayjs@1.11.13'
import showdown from 'https://esm.ext.archive.org/showdown@2.1.0'

import { krsort } from 'https://av.prod.archive.org/js/util/strings.js'

// adds header click actions, etc.
// eslint-disable-next-line import/no-named-as-default
import search_setup from './future-imperfect.js'
import { markdown_to_html, summarize_markdown } from './text.js'


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
  use_github_api_for_files: null,
  try_github_api_tree: false,
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
const filter_post = (state.is_homepage ? '' :
  `${location?.origin}${location?.pathname}`.replace(/\/index\.html$/, '/'))

// eslint-disable-next-line no-use-before-define
const STORAGE_KEY = url_to_base(location?.href ?? '') ?? 'blogtini'

const STORAGE = SEARCH.match(/[&?]recache=1/i) ? {} :
  JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}

const HEADLINE = '<!DOCTYPE html><html><head><style>body{display:none}</style>'

// defaults
// eslint-disable-next-line import/no-mutable-exports
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
  sidebar: {
    post_amount: 5,
    categories: true,
    categories_by_count: true,
  },
  social: {},
  social_share: ['twitter', 'facebook', 'pinterest', 'email'],
  remove_blur: true,
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
  xxx when state.filedev mode, change links like:  src="./"  src="../"  href="./"  href="../"
  that end in "/" to "/index.html".  use same method for emitting urls, eg: site header /favorites/, / home, etc..., recent posts, etc.

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
 * Example paths: css/index.css, index.js
 *
 * @param {string} path relative path to fetch. if starts with 'https://', path is returned as is
 */
function path_to_theme_url(path) {
  if (path.startsWith('https://'))
    return path

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
  if (filter_post)
    return `<bt-post-full url="${state.filter_post_url}"></bt-post-full>`

  if (state.list_tags || state.list_cats)
    return `<bt-histogram histogram=${JSON.stringify(histogram)}></bt-histogram>`

  return `
    ${state.show_top_content ? '<bt-post-full url="homepage/"></bt-post-full> <hr>' : ''}

    <bt-posts>
      ${state.urls_filtered.map((url) => `<bt-post url="${urlify(url)}"></bt-post>`).join('')}
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

  // eslint-disable-next-line no-nested-ternary, max-len
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
  // eslint-disable-next-line no-use-before-define
  const [my_frontmatter] = markdown_parse(body_contents ?? '')
  const base = my_frontmatter?.base

  state.pathrel = state.is_homepage || globalThis.Deno ? '' : '../' // xxxx generalize
  state.top_dir = base ?? state.pathrel
  state.top_page = state.top_dir.concat(state.filedev ? 'index.html' : '')

  if (!globalThis.Deno) {
    // eslint-disable-next-line no-use-before-define
    dark_mode()

    // eslint-disable-next-line no-use-before-define
    head_insert_generics()
  }

  if (state.is_homepage) {
    if (SEARCH.match(/^\?20\d\d-\d\d-\d\d-/)) {
      // prior SPA type blogtini method.  so now do a soft 404
      // https://developers.google.com/search/docs/advanced/javascript/javascript-seo-basics#avoid-soft-404s
      window.location.href = '/not-found' // redirect to 404 page on the server
      return
    }

    // eslint-disable-next-line no-use-before-define
    head_insert_titles('Blogtini') // xxx
  } else if (state.list_tags) {
    // eslint-disable-next-line no-use-before-define
    head_insert_titles('Tags')
  } else if (state.list_cats) {
    // eslint-disable-next-line no-use-before-define
    head_insert_titles('Categories')
  }


  if (!globalThis.Deno) {
    // default expect github pages hostname - user can override via their own `config.yml` file
    [tmp, cfg.user, cfg.repo] = location.href.match(/^https:\/\/(.*)\.github\.io\/([^/]+)/) || ['', '', '']
  }


  if (!STORAGE.base)
    STORAGE.base = base

  tmp = yml.load(await fetcher(`${state.top_dir}config.yml`))
  if (tmp)
    cfg = { ...cfg, ...tmp } // xxx deep merge `sidebar` value hashmap, too


  if (globalThis.Deno) {
    /* eg:
      deno run -A  js/blogtini.js  index.html
    */
    if (!Deno.args.length) return
    const fi = Deno.args[0]
    const body = Deno.readTextFileSync(fi)
    if (!body.startsWith(HEADLINE)) {
      // eslint-disable-next-line no-use-before-define
      const [frontmatter] = markdown_parse(body)

      await import('./dom.js')
      // eslint-disable-next-line no-use-before-define
      head_insert_titles(frontmatter.title ?? 'blogtini', imgurl({ featured: frontmatter.featured }, true, false))

      const headline = `${HEADLINE}${document.head.innerHTML.trim()}</head><body>\n`
      Deno.writeTextFileSync(fi, `${headline}${body}`)
    }
    Deno.exit()
  }


  log({
    filter_post, base: STORAGE.base, STORAGE_KEY, cfg, state,
  })
  // log('STORAGE', JSON.parse(localStorage.getItem(STORAGE_KEY)))


  // eslint-disable-next-line no-use-before-define
  add_css(path_to_theme_url('css/index.css'))

  state.show_top_content = state.is_homepage && body_contents && !location.search
  if (state.show_top_content) {
    // NOTE: the front matter below wont get used -- but we need a title & date
    // eslint-disable-next-line no-use-before-define
    const date = date2ymd(new Date())
    // eslint-disable-next-line no-use-before-define
    state.homepage_post = markdown_to_post(`
---
title:
date: ${date}
type: homepage
---

${body_contents}
`.trimStart(), location.href)
  }


/*
cfg.repo = 'blogtini'
cfg.user = 'ajaquith'; cfg.repo = 'securitymetrics'; cfg.branch = 'master'
log('xxxx testitos', await find_posts_from_github_api_tree()); return
*/

  if (!Object.keys(STORAGE).length || STORAGE.created !== dayjs().format('MMM D, YYYY'))
    // eslint-disable-next-line no-use-before-define
    await storage_create()

  // eslint-disable-next-line no-use-before-define
  storage_loop()

  // eslint-disable-next-line no-use-before-define
  bt_body()

  // eslint-disable-next-line no-use-before-define
  add_interactivity()

  // if (state.filedev || state.localdev) // xxx ideally use normal customElements for production
  await import('https://esm.ext.archive.org/redefine-custom-elements@0.1.3')

  await import(path_to_theme_url(cfg.theme))


  window.onunhandledrejection = (unhandled_rejection) => {
    document.querySelector('body').style.display = 'block' // SSR step hides body until now
    // eslint-disable-next-line no-console
    console.error({ unhandled_rejection })
  }
}


async function storage_create() { // xxx
  STORAGE.created = dayjs().format('MMM D, YYYY')
  STORAGE.docs = STORAGE.docs || {}

  for (const pass of [1, 0]) {
    // eslint-disable-next-line no-use-before-define
    const latest = pass ? await find_posts() : await find_posts_from_github_api_tree()

    let proms = []
    let files = []
    for (let n = 0; n < latest.length; n++) {
      const url = latest[n]
      // NOTE: the final match is for a demo single page named /index.html => /
      const mat = url.match(/^(.*)\/([^/]+)$/) || url.match(/^()([^/]+)$/) || url.match(/^()(\/)$/)
      const file = state.sitemap_htm ? latest[n] : mat[2]

      // very first markdown file fetch -- let's autodetect if we can load markdown files directly
      // from the website or need to fallback to the github raw url
      let contents
      if (state.use_github_api_for_files === null) {
        contents = await fetcher(file)
        state.use_github_api_for_files = !contents
      }
      files.push(file)

      const url2 = (state.filedev || state.localdev) && STORAGE.base ? url.replace(RegExp(`^${STORAGE.base}`), '') : url

      const fetchee = // eslint-disable-next-line no-nested-ternary
      (state.use_github_api_for_files
        ? `https://raw.githubusercontent.com/${cfg.user}/${cfg.repo}/${cfg.branch}/`
        : (state.sitemap_htm && !url2.startsWith('https://') && !url2.startsWith('http://') ? state.pathrel : '')
      ).concat(url2).concat(state.filedev && url2.endsWith('/') ? 'index.html' : '')
      log({ file, url2, fetchee })

      proms.push(contents || fetch(fetchee))

      if (((n + 1) % cfg.posts_per_page) && n < latest.length - 1)
        continue // keep building up requests

      // now make the requests in parallel and wait for them all to answer.
      const vals = await Promise.all(proms)
      const file2markdown = files.reduce((obj, key, idx) => ({ ...obj, [key]: vals[idx] }), {})

      // eslint-disable-next-line no-use-before-define
      await parse_posts(file2markdown)

      files = []
      proms = []
    }
    log({ state })
    if (state.num_posts)
      break
  }

  STORAGE.docs = Object.values(krsort(STORAGE.docs))

  localStorage.setItem(STORAGE_KEY, JSON.stringify(STORAGE))
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


function setup_base(urls) { // xxx get more sophisticated than this!  eg: if all "starts" in sitemap.xml are the same, compute the post-to-top pathrel/top_page
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

  state.try_github_api_tree = false
  state.use_github_api_for_files = false

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


async function find_posts_from_github_api_tree() {
  const listing = await fetcher(
    `https://api.github.com/repos/${cfg.user}/${cfg.repo}/git/trees/${cfg.branch}?recursive=true`,
  )
  // xxx NOTE: tree listing has sha details on branch and each file and more. useful?
  const files = listing?.tree?.map((e) => e.path) ?? []
  log({ files })

  // prefer one of these, in this order:
  // - prefer posts/  (excluding any README.md)
  // - 2###.*.md/markdown files
  // - any .md/markdown files  (excluding any README.md)
  // - /README.md

  let mds = files.filter((e) => e.startsWith('posts/') && !e.endsWith('README.md'))
  mds = mds.length ? mds : files.filter((e) => `/${e}`.match(/\/2\d\d\d[^/]+\.(md|markdown)$/))
  mds = mds.length ? mds : files.filter((e) => e.match(/\.(md|markdown)$/) && !e.endsWith('README.md'))
  mds = mds.length ? mds : files.filter((e) => e === 'README.md')

  return mds.sort().reverse() // xxx assumes file*names*, reverse sorted, is latest post first...
}


function markdown_parse(markdown) {
  const chunks = markdown.split('\n---')

  // normally we are "headless" -- but the optional GH Action SSR step can add a <head> for SEO...
  if (chunks[0].trim().startsWith(HEADLINE)) chunks.shift()

  const front_matter = chunks.shift()
  const body_raw = chunks.join('\n---')

  try {
    const parsed = yml.load(front_matter)
    return [parsed, body_raw]
    /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
  } catch {}

  return [undefined, undefined]
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
  // eslint-disable-next-line no-nested-ternary
  const featured = json.featured?.trim() || json.featured_image?.trim() || (json.images
    ? (typeof json.images === 'object' ? json.images.shift() : json.images.trim())
    : '')
  log({ date, featured })
  // author xxx

  const post = {
    url, title, date, body_raw, tags, categories, featured,
  }
  for (const key of ['featuredcaption', 'class'])
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
      // eslint-disable-next-line no-use-before-define
      storage_add(post)
  }
}

function storage_loop() {
  showdown.setFlavor('github') // xxx?

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
      if (!match && STORAGE.docs.length !== 1)
        continue
    }

    if (filter_post) {
      // eslint-disable-next-line no-use-before-define
      head_insert_json_ld(post)
      // eslint-disable-next-line no-use-before-define
      head_insert_titles(post.title, imgurl(post, true, false))
      state.filter_post_url = urlify(post.url)
    } else if (filter_tag.length) {
      // eslint-disable-next-line no-use-before-define
      head_insert_titles(`posts tagged: ${filter_tag} - blogtini.com`) // xxx
    } else if (filter_cat.length) {
      // eslint-disable-next-line no-use-before-define
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

  // eslint-disable-next-line no-use-before-define
  const ymd = date2ymd(new Date(post.date))
  if (!STORAGE.newest || ymd > STORAGE.newest)
    STORAGE.newest = ymd
}


// deno-lint-ignore no-unused-vars
function slugify(str) {
  return str.toLowerCase()
    .replace(/'s/g, 's')
    .replace(/[^a-z0-9-]/g, '-') // xxx i18l
    .replace(/--+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '')
}

function date2ymd(date) {
  return [
    date.getUTCFullYear(),
    `${1 + date.getUTCMonth()}`.padStart(2, '0'),
    `${date.getUTCDate()}`.padStart(2, '0'),
  ].join('-')
}

function datetime(date) {
  const fmt = typeof date === 'string' && (date.length <= 10 || date.endsWith('T00:00:00.000Z'))
    ? 'MMMM D, YYYY'
    : 'dddd, MMM D, YYYY h:mm A'

  return dayjs(date).format(fmt)
}

/**
 * Sets dark theme if [7am .. 5pm] localtime and prefers dark mode
 */
function dark_mode() {
  const hour = new Date().getHours()
  const dark = (hour < 7 || hour > 17) && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches
  if (dark)
    document.querySelector('body').classList.add('dark')
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


// deno-lint-ignore no-unused-vars
function head_insert_specifics() {
  // document.getElementsByTagName('meta')['keywords'].content = 'updated keywords xxx'
  // document.getElementsByTagName('meta')['description'].content = 'updated description xxx'
}


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
  // eslint-disable-next-line no-void
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
  dark_mode,
  PR,
  imgurl,
  fetcher,
  path_to_theme_url,
}
