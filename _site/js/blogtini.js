/*

Any markdown file can contain multiple posts.
Set off each post with its own front-matter YAML section.

Your posts or directories of posts, should be *names* that can be sorted in time, examples:
  2022-11-03-a-birthday.md
  2020-10-31-halloween-fun.md

  2022/
  2021/
  2018/


terminal / self-hosted (top-level dir options):
- /README.md      (contains all your posts)
- /markdowns.txt
  - list of .md/.markdown files
  - dirname(s) of .md/.markdown files  (**)
- /posts/*.md     (**)
  - you can also symlink /posts/ to whatever subdirectory that your posts live in ;-)
(**) required: webserver w/ dir listings


GitHub Pages (top-level dir options):
- /README.md      (contains all your posts)
- /markdowns.txt
  - list of .md/.markdown files
  - dirname(s) of .md/.markdown files  (**)
- /posts/*.md     (**)
Uses GH API to retrieve *each* markdown file unless your repo has required:
  - top-level `/_config.yml` file with our setting: `markdown_ext: "nope"`
  - each markdown file has a top extra dummy/sacrificial front-matter
       @see top 3 lines: https://raw.githubusercontent.com/traceypooh/test1/main/README.md
       (due to limitations w/ `jekyll` in GitHub Pages)
(**) uses GH trees API single call to list all files in repo

goals: 0 config/0 build; pull in info from multiple blogs; parents can do it


xxx ignore markdown files w/o frontmatter

wgeto 'https://api.github.com/repos/traceypooh/blogtini/git/trees/main?recursive=true'

tech terminal try-out:
  wget https://raw.githubusercontent.com/traceypooh/test1/main/index.html
  wget https://raw.githubusercontent.com/traceypooh/test1/main/README.md
  [edit 1st real post in README.md]
  [open in Safari; Developer Menu; [check] Disable Local File Restrictions]
  open index.html
  [when you are done]
  [Developer Menu; [uncheck] Disable Local File Restrictions]


existing GH repo try-out: /?preview=github/repo-name    (we'll use GH API to find .md files)
existing WP try-out: /?preview=URL/feed (atom or RSS)

huge number of posts solve: find . -type f -name '*.md' >| markdowns.txt

could host entire thing in codepen, etc.?!

xxx go to blogtini.com -> enter in your username and repo and show them how it looks!

nav search box that prefills google search site:xxx AND ..

soft 404
https://developers.google.com/search/docs/advanced/javascript/javascript-seo-basics#avoid-soft-404s
Use JS redirect to a URL that server responds w/ 404 HTTP status (for example /not-found).


xxx gist: either: public GH repo w/ dir of .md files *or* WP/private and parse atom feed..
xxx pagination
xxx body formatting: highlightjs
xxx body formatting: bold, ital, lists, links...
xxx --- hr, table headers disambiguate for multi-post single file...
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
https://github.com/xxx/blogtini/new/main/_site/posts
---
title: first test post
date: xxx
tags: blogging, testing, blogtini
---
# scroll down, hit [Commit new file]

https://github.com/xxx/blogtini/edit/main/_site/posts/2022-02-02.md
[<> Code] upper left tab
[📁  _site]
[📁  posts]
click 2022-02-02.md
upper-mid right [✏️] (hover shows "Edit this file")

change, to taste:
title:
date:
tags:

(scroll down, find [Commit changes] button and press)

https://github.com/xxx/blogtini/edit/main/_site/config.json
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
import { friendly_truncate } from 'https://av.prod.archive.org/js/util/strings.js'


// eslint-disable-next-line no-console
const log = console.log.bind(console)
const blogtini = 'https://traceypooh.github.io/blogtini/img/blogtini.png' // xxx
const state = {
  tags: {},
  cats: {},
  file_prefix: '',
  use_github_api_for_files: null,
  try_github_api_tree: false,
  num_posts: 0,
}
const search = decodeURIComponent(location.search)
const filter_tag  = (search.match(/^\?tags\/([^&]+)/)        || ['', ''])[1]
const filter_cat  = (search.match(/^\?categories\/([^&]+)/)  || ['', ''])[1]
const filter_post = (location.pathname.match(/(20\d\d\/.*)/) || ['', ''])[1] // xxx generalize

// defaults
let cfg = {
  user: '',
  repo: '',
  title: 'welcome to my blog',
  img_site: '',
  posts_per_page: 10,
  branch: 'main', // xxxx autodetect or 'master'
}


/*
return JSON.parse(localStorage.getItem('playset'))
www/js/playset/playset.js:    localStorage.setItem('playset', JSON.stringify(item))
*/

async function fetcher(url)  {
  const text = !url.match(/\.(json)$/i) || url.endsWith('/')

  try {
    const ret = await fetch(url.concat(url.endsWith('/') ? 'index.html' : ''))

    if (!ret.ok) {
      // safari file:// doesnt set .ok properly...
      if (!location.protocol.startsWith('file') || url.startsWith('http'))
        return false
    }
    const tmp = (text ? await ret.text() : await ret.json())
    return tmp

    /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
  } catch {}
  return false
}

async function main() {
  let tmp

  const dirs = location.pathname.split('/').filter((e) => e !== '')
  state.filedev = location.protocol === 'file:'
  // eslint-disable-next-line no-nested-ternary
  state.is_topdir = location.protocol === 'file:'
    ? dirs.slice(-2, -1)[0] === '_site' // eg: .../_site/index.html
    : (location.hostname.endsWith('.github.io') ? dirs.length <= 1 : !dirs.length)
  state.pathrel = state.is_topdir ? './' : '../../../' // xxxx generalize
  state.toprel = state.pathrel.concat(state.filedev ? 'index.html' : '')

  // eslint-disable-next-line no-use-before-define
  head_inserts()

  document.getElementsByTagName('body')[0].innerHTML = `
  <div class="container">
    <div id="welcome" class="bg-light">
    </div>
    <div id="main-row" class="row">
      <div class="col-md-10 order-md-2">
        <div id="posts"></div>
        <div id="spa"></div>
      </div>
      <div class="nav-left col-md-2 order-md-1">
        <h5>Categories</h5>
        <div id="nav-cats">
        </div>
        <h5>Tags</h5>
        <div id="nav-tags">
        </div>
      </div>
    </div>
  </div>`;

  // default expect github pages hostname - user can override via their own `config.json` file
  [tmp, cfg.user, cfg.repo] = location.href.match(/^https:\/\/(.*)\.github\.io\/([^/]+)/) || ['', '', '']

  tmp = await fetcher(`${state.pathrel}config.json`)
  if (tmp)
    cfg = { ...cfg, ...tmp }

  document.getElementById('welcome').insertAdjacentHTML('afterbegin', `
    <img id="blogtini" src="${blogtini}">
    <h1>
      <a href="${state.toprel}">
        ${cfg.img_site ? `<img src="${state.pathrel}${cfg.img_site}">` : ''}
        ${cfg.title}
      </a>
    </h1>
  `)

  if (!filter_post)
    document.getElementById('main-row').classList.add('g-0')

/*
cfg.repo = 'blogtini'
cfg.user = 'ajaquith'; cfg.repo = 'securitymetrics'; cfg.branch = 'master'
log('xxxx testitos', await find_posts_from_github_api_tree()); return
*/

  for (const pass of [1, 0]) {
    // eslint-disable-next-line no-use-before-define
    const latest = pass ? await find_posts() : await find_posts_from_github_api_tree()

    let proms = []
    let files = []
    for (let n = 0; n < latest.length; n++) {
      const md = latest[n]
      const url = `${state.file_prefix}${md}`
      const mat = url.match(/^(.*)\/([^/]+)$/) || url.match(/^()([^/]+)$/)
      const file = state.sitemap_htm ? latest[n] : mat[2]

      // very first markdown file fetch -- let's autodetect if we can load markdown files directly
      // from the website or need to fallback to the github raw url
      let contents
      if (state.use_github_api_for_files === null) {
        contents = await fetcher(file)
        state.use_github_api_for_files = !contents
      }
      files.push(file)
      proms.push(contents || fetch(
        // eslint-disable-next-line no-nested-ternary
        (state.use_github_api_for_files
          ? `https://raw.githubusercontent.com/${cfg.user}/${cfg.repo}/${cfg.branch}/`
          : (state.sitemap_htm && !url.startsWith('https://') && !url.startsWith('http://') ? state.pathrel : '')
        ).concat(url),
      ))

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

  // eslint-disable-next-line no-use-before-define
  finish()
}


async function find_posts() {
  const FILES = []
  const DIRS = []

  if (!FILES.length && !DIRS.length) {
    const urls = (await fetcher(`${state.pathrel}sitemap.xml`)).split('<loc>').slice(1)
      .map((e) => e.split('</loc>').slice(0, 1).join(''))
      // eslint-disable-next-line no-confusing-arrow
      .map((e) => state.filedev ? e.replace('https://blogtini.com/', '') : e) // xxxx
      .filter((e) => e !== '')
      // eslint-disable-next-line no-confusing-arrow
      .map((e) => e.endsWith('/') ? e.concat('index.html') : e)
      // eslint-disable-next-line no-confusing-arrow
      .map((e) => state.filedev ? e.replace(/http:\/\/localhost:4000\//, '') : e) // xxxx
    log({ urls })
    FILES.push(...urls)
    state.try_github_api_tree = false
    state.use_github_api_for_files = false
    state.sitemap_htm = true
  }

  // Option for local dev or large repos.
  // Can be list of files *or* list of directory(/ies) with .md/.markdown files, eg:
  //   find . -type f -name '*.md' >| markdowns.txt
  if (!FILES.length && !DIRS.length) {
    const txt = await fetcher('markdowns.txt')
    if (txt) {
      const lines = txt.trim().replace(/\r/g, '').split('\n')
      FILES.push(...lines.filter((e) => e.match(/\.(md|markdown)$/i)))
      DIRS.push(...lines.filter((e) => !e.match(/\.(md|markdown)$/i)))
      // find_posts_in_dir(...)  // xxxx
    }
  }

  // check for simple dir of .md/.markdown files -- w/ webserver that responds w/ dir listings:
  if (!FILES.length && !DIRS.length) {
    const txt = await fetcher('posts/')
    if (txt) {
      // local dev or something that replies with a directory listing (yay)
      FILES.push(...[...txt.matchAll(/<a href="([^"]+.md)"/g)].map((e) => e[1])) // xxx .markdown too
      state.file_prefix = './posts' // chexxxx
    } else {
      state.try_github_api_tree = true
    }
  }

  // try 1+ post inside the main README.md
  if (!FILES.length && !DIRS.length) {
    FILES.push('README.md')
    state.try_github_api_tree = true
  }

  log({ cfg, state })

  const latest = FILES.filter((e) => e && e.match(/\.(md|markdown|html|htm)$/i)).sort().reverse() // xxx assumes file*names*, reverse sorted, is latest post first...
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


async function find_posts_in_dir() { return await [] } // xxxx


async function parse_posts(markdowns) {
  let htm = ''
  for (const [file, markdown] of Object.entries(markdowns)) {
    // the very first post might have been loaded into text if the webserver served the markdown
    // file directly.  the rest are fetch() results.
    const yaml = typeof markdown === 'string' ? markdown : await markdown.text()

    const chunks = yaml.split('\n---')

    const multiples = (file === 'README.md' && !(chunks.length % 2) && // xxx handle \n--- corner cases (hr, tables..)
        !(chunks.filter((_e, idx) => !(idx % 2)).filter((e) => !e.match(/\ntitle:/m)).length))
    const parts = multiples ? chunks : [chunks.shift(), chunks.join('\n---')]
    if (multiples) {
      if (parts.length > 2 && parts[1].trim() === '' && parts[0].match(/^---\ntitle:[^\n]+$/)) {
        // prolly doing local dev -- pull dummy front-matter that GH Pages deploy's jekyll removes..
        parts.shift()
        parts.shift()
      }
      log('looks like single file with', parts.length / 2, 'posts')
    }

    while (parts.length) {
      const front_matter = parts.shift()
      const body_raw = parts.shift()
      const body = body_raw.replace(/\n\n/g, '<br><br>')
      const preview = body_raw.replace(/</g, '&lt;')
      let parsed
      try {
        parsed = yml.load(front_matter)
      } catch {
        // no front-matter or not parseable -- skip
        log('not parseable', { file, front_matter })
        continue
      }
      const json = parsed
      log({ json })

      const title      = json.title?.trim() ?? ''
      const tags       = (json.tags       ?? []).map((e) => e.trim().replace(/ /g, '-'))
      const categories = (json.categories ?? []).map((e) => e.trim().replace(/ /g, '-'))
      const date       = json.date || json.created_at || '' // xxx any more possibilities should do?

      if (!date) {
        log('no date', { file, front_matter })
        continue
      }

      // hugo uses 'images' array
      // eslint-disable-next-line no-nested-ternary
      const featured   = json.featured?.trim() || json.featured_image?.trim() || (json.images
        ? (typeof json.images === 'object' ? json.images.shift() : json.images.trim())
        : '')
      log({ date, featured })
      // author xxx

      for (const tag of tags) {
        state.tags[tag] = state.tags[tag] || []
        state.tags[tag].push(file)
      }
      for (const cat of categories) {
        state.cats[cat] = state.cats[cat] || []
        state.cats[cat].push(file)
      }

      const ymd = [
        date.getUTCFullYear(),
        `${1 + date.getUTCMonth()}`.padStart(2, '0'),
        `${date.getUTCDate()}`.padStart(2, '0'),
      ].join('-')

      // eslint-disable-next-line no-use-before-define
      const url = multiples ? `${ymd}-${slugify(title)}` : file.replace(/\.md$/, '')

      state.num_posts += 1

      if (filter_tag.length  &&       !(tags.includes(filter_tag))) continue
      if (filter_cat.length  && !(categories.includes(filter_cat))) continue
      if (filter_post && url !== filter_post
        && !url.endsWith(`${filter_post}index.html`) // xxxx
      )
        continue

      // eslint-disable-next-line no-nested-ternary
      const img = featured === ''
        ? `${state.pathrel}${cfg.img_site}`
        : (featured.match(/\//) ? featured : `${state.pathrel}img/${featured}`)

      const taglinks =       tags.map((e) => `<a href="${state.toprel}?tags/${e}">${e}</a>`/*  */).join(' · ').trim()
      const catlinks = categories.map((e) => `<a href="${state.toprel}?categories/${e}">${e}</a>`).join(' · ').trim()

      const date_short = date.toString().split(' ').slice(0, 4).join(' ')
      htm += filter_post
        // eslint-disable-next-line no-use-before-define
        ? post_full(title, img, date_short, taglinks, catlinks, body)
        // eslint-disable-next-line no-use-before-define
        : post_card(title, img, date_short, taglinks, catlinks, preview, url)
    }
  }

  document.getElementById(filter_post ? 'spa' : 'posts').insertAdjacentHTML('beforeend', htm)
}


function post_full(title, img, date, taglinks, catlinks, body) {
  return `
    <h3 class="d-none d-md-block float-md-end">${date}</h3>
    <h1>${title}</h1>
    <h3 class="d-md-none" style="text-align:center">${date}</h3>
    <div class="float-none" style="clear:both">
      <img src="${img}" class="img-fluid rounded mx-auto d-block">
    </div>
    <div>
      ${body}
    </div>
    <hr>
    <div>
      ${catlinks ? '📁 Categories: ' : ''} ${catlinks} ${catlinks ? '<br>' : ''}
      ${taglinks ? '🏷️ Tags: ' : ''} ${taglinks}
    </div>
  `
}


function post_card(title, img, date, taglinks, catlinks, body, url) {
  return `
    <div class="card card-body bg-light">
      <a href="${location.protocol === 'file:' ? url : url.replace(/\/index.html*$/, '')}">
        ${img ? `<img src="${img}">` : ''}
        <h2>${title}</h2>
      </a>
      ${date}
      <div>
        ${friendly_truncate(body, 200)}
      </div>
      ${catlinks ? '📁 ' : ''}
      ${catlinks}
      ${taglinks ? '🏷️ ' : ''}
      ${taglinks}
    </div>`
}


function slugify(str) {
  return str.toLowerCase()
    .replace(/'s/g, 's')
    .replace(/[^a-z0-9-]/g, '-') // xxx i18l
    .replace(/--+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '')
}


function finish() {
  let htm

  htm = '<ul>'
  for (const cat of Object.keys(state.cats).sort())
    htm += `<li><a href="${state.toprel}?categories/${cat}">${cat.toLowerCase()}</a> ${state.cats[cat].length}</li>`
  htm += '</ul>'
  document.getElementById('nav-cats').insertAdjacentHTML('beforeend', htm)

  htm = ''
  const rem_min = 1
  const rem_max = 2.5

  const counts = Object.values(state.tags).map((e) => e.length)
  const cnt_min = Math.min(...counts)
  const cnt_max = 1 + Math.max(...counts)

  for (const tag of Object.keys(state.tags).sort()) {
    const count = state.tags[tag].length
    const weight = (Math.log(count) - Math.log(cnt_min)) / (Math.log(cnt_max) - Math.log(cnt_min))
    const size = (rem_min + ((rem_max - rem_min) * weight)).toFixed(1)
    htm += `<a href="${state.toprel}?tags/${tag}" style="font-size: ${size}rem">${tag.toLowerCase()}</a> `
  }
  document.getElementById('nav-tags').insertAdjacentHTML('beforeend', htm)
}


function add_css(file) {
  const { head } = document
  const e = document.createElement('link')
  e.type = 'text/css'
  e.rel = 'stylesheet'
  e.href = file
  head.appendChild(e)
}

function head_inserts() {
  add_css(`${state.pathrel}css/blogtini.css`) // xxxx theme.css

  const charsetMetaTag = document.createElement('meta') // xxxx no worky
  charsetMetaTag.setAttribute('charset', 'utf-8')
  document.head.appendChild(charsetMetaTag)
}


// eslint-disable-next-line no-void
void main()

// document.getElementsByTagName('meta')['keywords'].content = 'updated keywords xxx'
// document.getElementsByTagName('meta')['description'].content = 'updated description xxx'
