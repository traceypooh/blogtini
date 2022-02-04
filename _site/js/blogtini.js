/*

goals: 0 config/0 build; pull in info from multiple blogs; parents can do it

tech terminal: copy index.html, create single 20xx-...md file, open in safari
tech terminal: copy index.html, write post into README.md file, open in safari

could host entire thing in codepen, etc.?!

xxx go to blogtini.com -> enter in your username and repo and show them how it looks!

nav search box that prefills google search site:xxx AND ..

soft 404


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
  https://api.github.com/repos/traceypooh/blogzero/contents look for type: dir and dir with 20\d\d...md

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
  https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll#plugins

   could be useful vv, but not in accept list ^^ :(
  https://github.com/jekyll/jekyll-sitemap
  https://github.com/jekyll/jekyll-feed
*/

/* eslint-disable no-continue */
import yml from 'https://esm.archive.org/js-yaml'
import { friendly_truncate } from 'https://av.prod.archive.org/js/util/strings.js'


// eslint-disable-next-line no-console
const log = console.log.bind(console)
const blogtini = 'https://traceypooh.github.io/blogzero/img/blogtini.png' // xxx
const state = {
  tags: {},
  cats: {},
  file_prefix: '',
}
const search = decodeURIComponent(location.search)
const filter_tag  = (search.match(/^\?tags\/([^&]+)/)       || ['', ''])[1]
const filter_cat  = (search.match(/^\?categories\/([^&]+)/) || ['', ''])[1]
const filter_post = (search.match(/^\?(20\d\d[^&]+)/)       || ['', ''])[1]

// defaults
let cfg = {
  user: '',
  repo: '',
  title: 'welcome to my blog',
  img_site: '',
  posts_per_page: 10,
}


/*
return JSON.parse(localStorage.getItem('playset'))
www/js/playset/playset.js:    localStorage.setItem('playset', JSON.stringify(item))
*/

async function fetcher(url)  {
  const text = url.match(/\.(txt|md)$/)
  try {
    const ret = await fetch(url)
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

  tmp = await fetcher('config.json')
  if (tmp)
    cfg = { ...cfg, ...tmp }

  document.getElementById('welcome').insertAdjacentHTML('afterbegin', `
    <img id="blogtini" src="${blogtini}">
    <h1>
      <a href="?">
        ${cfg.img_site ? `<img src="${cfg.img_site}">` : ''}
        ${cfg.title}
      </a>
    </h1>
  `)

  if (!filter_post)
    document.getElementById('main-row').classList.add('g-0')

  const { user, repo } = cfg
  // const user = 'ajaquith', repo = 'securitymetrics'
  const API = `https://api.github.com/repos/${user}/${repo}/contents`
  const tries = [
    'posts/',   // option A for local dev
    'list.txt', // option B for local dev:  find * -type f >| list.txt
    `${API}/_site/posts/`, // blogtini
    `${API}/source/_posts/`, // ajaquith hugo
    'README.md', // try 1+ post inside the main README.md
    `${API}/`, // final attempt, minimal repo, top dir == web dir
  ]

  let filter_out = 'README.md'
  let mds = [] // xxx cache
  tmp = await fetcher(tries.shift())
  if (tmp) {
    // local dev or something that replies with a directory listing (yay)
    const dir = tmp
    mds = [...dir.matchAll(/<a href="([^"]+.md)"/g)].map((e) => e[1])
    state.file_prefix = './posts'
  } else {
    tmp = (
      // try local dev alt option
      await fetcher(tries.shift()) ||
      // try GitHub API urls to find a dir of posts
      await fetcher(tries.shift()) ||
      await fetcher(tries.shift()) ||
      // 2nd-to-last README.md attempt
      await fetcher(tries.shift()) ||
      // final GitHub API last try
      await fetcher(tries.shift())
    )

    if (typeof tmp === 'string') {
      if (tries.length === 1) { // xxx way too fragile traytray...
        mds = ['README.md'] // we'll parse it twice for now...
        filter_out = 'nothing-should-match-this'
      } else {
        mds = [...tmp.matchAll(/^(.*\.md)$/gm)].map((e) => e[0])
      }
    } else {
      // parse GitHub API listing
      mds = tmp.map((e) => e.download_url)
    }
  }
  log({ tmp, cfg, state })

  const latest = mds.filter((e) => e && e.match(/\.(md|markdown)$/i) && e !== filter_out && !e.match(RegExp(`/${filter_out}$`))).sort().reverse()
  log(latest.slice(0, cfg.posts_per_page))


  let proms = []
  let files = []
  for (let n = 0; n < latest.length; n++) {
    const md = latest[n]
    const url = `${state.file_prefix}${md}`
    const mat = url.match(/^(.*)\/([^/]+)$/) || url.match(/^()([^/]+)$/)
    const file = mat[2]

    files.push(file)
    proms.push(fetch(url))

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

  // eslint-disable-next-line no-use-before-define
  finish()
}


async function parse_posts(markdowns) {
  let htm = ''
  for (const [file, markdown] of Object.entries(markdowns)) {
    const yaml = await markdown.text()

    const chunks = yaml.split('\n---')

    const multiples = (file === 'README.md' && !(chunks.length % 2) && // xxx handle \n--- corner cases (hr, tables..)
        !(chunks.filter((_e, idx) => !(idx % 2)).filter((e) => !e.match(/\ntitle:/m)).length))
    if (multiples)
      log('looks like single file with', chunks.length / 2, 'posts')
    const parts = multiples ? chunks : [chunks.shift(), chunks.join('\n---')]

    while (parts.length) {
      const front_matter = parts.shift()
      const body_raw = parts.shift()
      const body = body_raw.replace(/\n\n/g, '<br><br>')
      const preview = body_raw.replace(/</g, '&lt;')
      const json = yml.load(front_matter)
      log({ json })

      const title      = json.title?.trim() ?? ''
      const tags       = (json.tags       ?? []).map((e) => e.trim().replace(/ /g, '-'))
      const categories = (json.categories ?? []).map((e) => e.trim().replace(/ /g, '-'))
      const date       = json.date || json.created_at || new Date() // xxx reality?

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

      if (filter_tag.length  &&       !(tags.includes(filter_tag))) continue
      if (filter_cat.length  && !(categories.includes(filter_cat))) continue
      if (filter_post && url !== filter_post) continue

      // eslint-disable-next-line no-nested-ternary
      const img = featured === ''
        ? cfg.img_site
        : (featured.match(/\//) ? featured : `./img/${featured}`)

      const taglinks = tags.map((e) => `<a href="?tags/${e}">${e}</a>`).join(' ').trim()

      const date_short = date.toString().split(' ').slice(0, 4).join(' ')
      htm += filter_post
        // eslint-disable-next-line no-use-before-define
        ? post_full(title, img, date_short, taglinks, body)
        // eslint-disable-next-line no-use-before-define
        : post_card(title, img, date_short, taglinks, preview, url)
    }
  }

  document.getElementById(filter_post ? 'spa' : 'posts').insertAdjacentHTML('beforeend', htm)
}


function post_full(title, img, date, taglinks, body) {
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
    <div>
      ${taglinks ? 'Tagged: ' : ''} ${taglinks}
    </div>
  `
}


function post_card(title, img, date, taglinks, body, url) {
  return `
    <div class="card card-body bg-light">
      <a href="?${url}">
        <img src="${img}">
        <h2>${title}</h2>
      </a>
      ${date}
      <div>
        ${friendly_truncate(body, 200)}
      </div>
      ${taglinks ? '<div>Tags:' : ''}
        ${taglinks}
      ${taglinks ? '</div>' : ''}
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
    htm += `<li><a href="?categories/${cat}">${cat.toLowerCase()}</a> ${state.cats[cat].length}</li>`
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
    htm += `<a href="?tags/${tag}" style="font-size: ${size}rem">${tag.toLowerCase()}</a> `
  }
  document.getElementById('nav-tags').insertAdjacentHTML('beforeend', htm)
}

// eslint-disable-next-line no-void
void main()

// document.getElementsByTagName('meta')['keywords'].content = 'updated keywords xxx'
// document.getElementsByTagName('meta')['description'].content = 'updated description xxx'
