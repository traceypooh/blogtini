/*

xxx make /?tags work
xxx make /?categories work
xxx nav uses /categories (which fails, too)
xxx nav home link wrong
xxx socnet icons hover should blue color


add storj, codepen, etc.

xxx move <style> to bottom to avoid leaks:    fgrep '<style>' $(finddot html)
xxx autogen rss
xxx mobile size tables
xxx .newest only defined 2nd request / when localStorage is read from prior 1st request as of now

Your posts or directories of posts, should ideally natural sort in time order, examples:
  2022-11-03-a-birthday.md
  2020-10-31-halloween-fun.md

  2022/11/03/a-birthday.md
  2020/10/31/halloween-fun.md


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

xxx go to blogtini.com -> enter in your username and repo and show them how it looks!

nav search box that prefills google search site:xxx AND ..


xxx gist: either: public GH repo w/ dir of .md files *or* WP/private and parse atom feed..
xxx pagination
xxx JS/CSS versioning..

github.com cookie: dotcom_user
https://jekyll.github.io/github-metadata/site.github/

minimum:
setup GH account
visit: https://github.com/traceypooh/blogtini
press [Y Fork] button in upper right
(fork to your account)
hit [⚙️ Settings] in upper right
[🗂️ Pages] left menu
enable GH actions xxx

[pipeline will start..]

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


[layout]
posts
img

pages
css
js


- 15y, 112 posts, 500k txt, 60k gzip (twitter tp cold load 2.7MB)
- xxx SEO!?
- xxx presently assumes posts list has filenames that are reverse sorted by date/time YYYY-MM-DD-..
- import xxx from 'https://esm.archive.org/blogtini'
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


jekyll (GitHub Pages) plugins:
  https://pages.github.com/versions/
  https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll#plugins

   could be useful vv, but not in accept list ^^ :(
  https://github.com/jekyll/jekyll-sitemap
  https://github.com/jekyll/jekyll-feed

  https://jekyll.github.io/github-metadata/site.github/
*/

/* eslint-disable no-continue */
import yml from 'https://esm.archive.org/js-yaml'
import dayjs from 'https://esm.archive.org/dayjs'
import showdown from 'https://esm.archive.org/showdown'

import { krsort } from 'https://av.prod.archive.org/js/util/strings.js'

// adds header click actions, etc.
// eslint-disable-next-line import/no-named-as-default
import search_setup from './future-imperfect.js'
import { markdown_to_html, summarize_markdown } from './text.js'
import init from './init.js'


export { init }

// eslint-disable-next-line no-console
const log = console.log.bind(console)


const state = {
  tags: {},
  cats: {},
  urls_filtered: [],
  use_github_api_for_files: null,
  try_github_api_tree: false,
  num_posts: 0,
  filedev: location.protocol === 'file:',
  localdev: location.hostname === 'localhost',
  pathrel: '',
  is_homepage: document.querySelector('body').classList.contains('homepage'),
}
const SEARCH = decodeURIComponent(location.search)
const filter_tag  = (SEARCH.match(/^\?tags\/([^&]+)/)        || ['', ''])[1]
const filter_cat  = (SEARCH.match(/^\?categories\/([^&]+)/)  || ['', ''])[1]
const filter_post = (state.is_homepage ? '' :
  `${location.origin}${location.pathname}`.replace(/\/index\.html$/, '/'))

// eslint-disable-next-line no-use-before-define
const STORAGE_KEY = url_to_base(location.href) ?? 'blogtini'

const STORAGE = SEARCH.match(/[&?]recache=1/i) ? {} :
  JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}

// defaults
// eslint-disable-next-line import/no-mutable-exports
let cfg = {
  user: '',
  repo: '',
  branch: 'main', // xxxx autodetect or 'master'
  theme: '../theme/future-imperfect/index.js',
  title: 'welcome to my blog',
  attribution: "Theme: <a href='https://github.com/pacollins/hugo-future-imperfect-slim' target='_blank' rel='noopener'>Hugo Future Imperfect Slim</a><br>A <a href='https://html5up.net/future-imperfect' target='_blank' rel='noopener'>HTML5 UP port</a> | Powered by <a href='https://blogtini.com/'  target='_blank' rel='noopener'>blogtini.com</a>",
  img_site: '',
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
  view_more_posts_link: '/post/', // xxx
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


async function fetcher(url)  {
  const text = !url.match(/\.(json)$/i) || url.endsWith('/')

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


function bt_body(main_section = '') {
  document.querySelector('body').innerHTML =
    `<bt-body>${main_section}</bt-body>`
}


async function main() {
  let tmp

  // see if this is an (atypical) "off site" page/post, compared to the main site
  const body_contents = document.querySelector('body').innerHTML.trim()
  // eslint-disable-next-line no-use-before-define
  const [my_frontmatter] = markdown_parse(body_contents)
  const base = my_frontmatter?.base

  state.pathrel = state.is_homepage ? '' : '../' // xxxx generalize
  state.top_dir = base ?? state.pathrel
  state.top_page = state.top_dir.concat(state.filedev ? 'index.html' : '')

  // eslint-disable-next-line no-use-before-define
  dark_mode()

  // eslint-disable-next-line no-use-before-define
  head_insert_generics()

  if (state.is_homepage) {
    if (SEARCH.match(/^\?20\d\d-\d\d-\d\d-/)) {
      // prior SPA type blogtini method.  so now do a soft 404
      // https://developers.google.com/search/docs/advanced/javascript/javascript-seo-basics#avoid-soft-404s
      window.location.href = '/not-found' // redirect to 404 page on the server
      return
    }

    // eslint-disable-next-line no-use-before-define
    head_insert_titles('Blogtini') // xxx
  }


  // default expect github pages hostname - user can override via their own `config.yml` file
  [tmp, cfg.user, cfg.repo] = location.href.match(/^https:\/\/(.*)\.github\.io\/([^/]+)/) || ['', '', '']


  if (!STORAGE.base)
    STORAGE.base = base

  tmp = yml.load(await fetcher(`${state.top_dir}config.yml`))
  if (tmp)
    cfg = { ...cfg, ...tmp } // xxx deep merge `sidebar` value hashmap, too


  log({
    filter_post, base: STORAGE.base, STORAGE_KEY, cfg, state,
  })
  // log('STORAGE', JSON.parse(localStorage.getItem(STORAGE_KEY)))

  const prefix = cfg.repo === 'blogtini' ? state.pathrel : 'https://blogtini.com/'
  // eslint-disable-next-line no-use-before-define
  add_css(`${prefix}css/blogtini.css`) // xxxx theme.css

  const show_top_content = state.is_homepage && body_contents && !location.search
  if (show_top_content) {
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

  if (!filter_post) {
    bt_body(`
      ${show_top_content ? '<bt-post-full url="homepage/"></bt-post-full> <hr>' : ''}

      <bt-posts>
        ${state.urls_filtered.map((url) => `<bt-post url="${urlify(url)}"></bt-post>`).join('')}
      </bt-posts>
    `)
  }

  // eslint-disable-next-line no-use-before-define
  finish()

  // if (state.filedev || state.localdev) // xxx ideally use normal customElements for production
  await import('https://esm.archive.org/redefine-custom-elements')

  import(cfg.theme)
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
    log('not parseable', { url, markdown })
  }

  log({ json })

  const title      = json.title?.trim() ?? ''
  const tags       = (json.tags       ?? []).map((e) => e.trim().replace(/ /g, '-').toLowerCase())
  const categories = (json.categories ?? []).map((e) => e.trim().replace(/ /g, '-').toLowerCase())
  const date       = json.date || json.created_at || '' // xxx any more possibilities should do?

  if (!date) {
    log('no date', { url, json })
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

  for (const post of STORAGE.docs) {
    for (const tag of post.tags) {
      state.tags[tag] = state.tags[tag] || []
      state.tags[tag].push(post.url)
    }
    for (const cat of post.categories) {
      state.cats[cat] = state.cats[cat] || []
      state.cats[cat].push(post.url)
    }

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
      head_insert_titles(post.title)
      bt_body(`<bt-post-full url="${urlify(post.url)}"></bt-post-full>`)
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


async function comments_markup(path) {
  let posts_with_comments
  try {
    posts_with_comments = (await fetcher(`${state.top_dir}comments/index.txt`))?.split('\n')
    /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
  } catch {}
  if (!posts_with_comments?.includes(path)) return null

  const comments = (await fetcher(`${state.top_dir}comments/${path}/index.json`))?.filter((e) => Object.keys(e).length)

  const refId = 'xxx'

  return comments.map((e) => `
<article id="${refId}" class="comment" data-reply-thread="${refId}">
  <header>
    <img class="comment-avatar circle" src="https://www.gravatar.com/avatar/${e.email}?s=100" alt="${e.name}'s Gravatar">
    <div>
      <div class="comment-author-container">
        <h3 class="comment-author">${e.name}</h3>
        <a class="comment-date" href="#${refId}" title="Permalink to this comment">
          ${'' /* eslint-disable-next-line no-use-before-define */}
          <bt-time
            datetime="${e.date /* xxx 2022-01-23T04:44:06.937Z */}"
          ></bt-time>
        </a>
      </div>
      <a class="comment-reply-btn" href="#say-something">Reply</a>
    </div>
  </header>
  <div class="comment-content">
    ${e.body}
  </div>
</article>`).join('')
}


function create_comment_form(entryId, comments) {
  if (!cfg.staticman?.enabled)
    return ''

  window.cfg = cfg // xxx

  const xxx = '' // reply stuff
  return `
  <div class="post">
    <div>
      <h2 id="say-something">Say Something (* THIS IS NOT WORKING YET *)</h2>
      <form id="comment-form" class="new-comment" method="POST">
        <h3 class="reply-notice hidden">
          <span class="reply-name"></span>
          <a class="reply-close-btn button"><i class="fas fa-times"></i></a>
        </h3>

        <input type="hidden" name="options[entryId]"    value="${entryId}">
        <input type="hidden" name="fields[replyThread]" value="${xxx}">
        <input type="hidden" name="fields[replyID]"     value="${xxx}">
        <input type="hidden" name="fields[replyName]"   value="${xxx}">

        <input required="" name="fields[name]" type="text" placeholder="Your Name">
        <input name="fields[website]" type="text" placeholder="Your Website">
        <input required="" name="fields[email]" type="email" placeholder="Your Email">
        <textarea required="" name="fields[body]" placeholder="Your Message" rows="10"></textarea>

        <div class="submit-notice">
          <strong class="submit-notice-text submit-success hidden">Thanks for your comment! It will be shown on the site once it has been approved.</strong>
          <strong class="submit-notice-text submit-failed hidden">Sorry, there was an error with your submission. Please make sure all required fields have been completed and try again.</strong>
        </div>

        <button type="button" id="comment-form-submit" class="button">Submit</button>
        <button type="button" id="comment-form-submitted" class="hidden button" disabled="">Submitted</button>
        <button type="reset"  id="comment-form-reset" class="button">Reset</button>
      </form>
    </div>


    <div class="comments-container">
      <h2>Comments</h2>
      ${comments ?? '<p>Nothing yet.</p>'}
    </div>

  </div>`
}

function share_buttons(post) { // xxxxx
  if (!post) {
    // if no post, parse url for ?tags etc and fake
    // post = markdown_to_post(document.querySelector('body').innerHTML, 'xxx')
  }
  if (!post)
    return ''

  const permalink = post.permalink || post.url // fqdn
  return cfg.social_share.map((social) => {
    switch (social) {
    case 'twitter':
      return `
        <a href="//twitter.com/share?text=${post.title}&amp;url=${permalink}"
            target="_blank" rel="noopener" class="nav share-btn twitter">
          <p>Twitter</p>
        </a>`
    case 'facebook':
      return `
        <a href="//www.facebook.com/sharer/sharer.php?u=${permalink}"
            target="_blank" rel="noopener" class="nav share-btn facebook">
          <p>Facebook</p>
        </a>`
    case 'pinterest':
      return `
        <a href="//www.pinterest.com/pin/create/button/?url=${permalink}&amp;description=${post.title}"
            target="_blank" rel="noopener" class="nav share-btn pinterest">
          <p>Pinterest</p>
        </a>`
    default:
      return ''
    /*
    {{ else if eq . "reddit" }}
    <a href="//www.reddit.com/submit?url={{ $permalink }}&amp;title={{ $title }}" target="_blank" rel="noopener" class="nav share-btn reddit">
          <p>Reddit</p>
        </a>
  {{ else if eq . "linkedin" }}
        <a href="//www.linkedin.com/shareArticle?url={{ $permalink }}&amp;title={{ $title }}" target="_blank" rel="noopener" class="nav share-btn linkedin">
            <p>LinkedIn</p>
          </a>
   {{ else if eq . "vk" }}
        <a href="//vk.com/share.php?url={{ $permalink }}&amp;title={{ $title }}" target="_blank" rel="noopener" class="nav share-btn vk">
          <p>VK</p>
        </a>
  {{ else if eq . "email" }}
        <a href="mailto:?subject={{ i18n "check_out" }} ${post.author}&amp;body={{ $permalink }}" target="_blank" class="nav share-btn email" data-proofer-ignore>
          <p>Email</p>
        </a>
  {{ end }}
{{ end }}
*/
    }
  }).join('')
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
  const dark = (hour < 7 || hour > 17) && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  if (dark)
    document.querySelector('body').classList.add('dark')
  return dark
}

function finish() {
  const btpage = document.querySelector('bt-body')?.shadowRoot
  if (!btpage) {
    setTimeout(finish, 250) // xxxxxxxxxxxxxxxxxxxx
    return
  }

  // eslint-disable-next-line no-use-before-define
  update_sidebar(btpage)

  state.theme_change_number = 0
  btpage.querySelectorAll('#theme-menu a').forEach((e) => {
    e.addEventListener('click', async (evt) => {
      const theme = evt.target.innerText.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '')
      evt.preventDefault()
      if (!theme)
        return false

      log({ theme })

      state.theme_change_number += 1
      await import(`../theme/${theme}/index.js?${state.theme_change_number}`)

      // eslint-disable-next-line no-use-before-define
      storage_loop()

      return false
    })
  })

  import('./staticman.js')

  search_setup(STORAGE.docs, cfg)
}


function update_sidebar(btpage) {
  const sidebar = btpage.querySelector('bt-sidebar')

  if (cfg.sidebar.post_amount) {
    sidebar.setAttribute(
      'recent_posts',
      JSON.stringify(STORAGE.docs.slice(0, cfg.sidebar.post_amount).map((e) => e.url)),
    )
  }

  if (cfg.sidebar.categories) {
    const histogram = {}
    for (const cat of Object.keys(state.cats).sort())
      histogram[cat] = state.cats[cat].length

    sidebar.setAttribute(
      'categories',
      JSON.stringify(histogram),
    )
  }

  {
    const histogram = {}
    for (const tag of Object.keys(state.tags).sort())
      histogram[tag] = state.tags[tag].length

    sidebar.setAttribute(
      'tags',
      JSON.stringify(histogram),
    )
  }
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

function head_insert_titles(title) {
  document.title = title // xxx &gt; &lt;

  {
    const e = document.createElement('title') // chexxx
    e.textContent = title // xxx &gt; &lt;
    document.head.appendChild(e)
  }
  {
    const e = document.createElement('meta') // chexxx
    e.setAttribute('name', 'twitter:title')
    e.setAttribute('content', title) // xxx quote escape, etc.
    document.head.appendChild(e)
  }
  {
    const e = document.createElement('meta') // chexxx
    e.setAttribute('property', 'og:title')
    e.setAttribute('content', title) // xxx quote escape, etc.
    document.head.appendChild(e)
  }
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


if (!window.blogtini_imported) {
  window.blogtini_imported = true // avoid any inadvertent double import
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
  comments_markup,
  create_comment_form,
  share_buttons,
  dark_mode,
  PR,
}
