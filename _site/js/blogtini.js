/*

xxx gist: either: public GH repo w/ dir of .md files *or* WP/private and parse atom feed..
xxx pagination
xxx body formatting: highlightjs
xxx body formatting: bold, ital, lists, links...

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
  prefix: './posts/',
}
const search = decodeURIComponent(location.search)
const filter_tag  = (search.match(/^\?tags\/([^&]+)/)       || ['', ''])[1]
const filter_cat  = (search.match(/^\?categories\/([^&]+)/) || ['', ''])[1]
const filter_post = (search.match(/^\?(20\d\d[^&]+)/)       || ['', ''])[1]

// defaults
let cfg = {
  posts_per_page: 10,
  title: 'welcome to my blog',
}


/*
return JSON.parse(localStorage.getItem('playset'))
www/js/playset/playset.js:    localStorage.setItem('playset', JSON.stringify(item))
*/

async function main() {
  let tmp;
  // default expect github pages hostname - user can override via their own `config.json` file
  [, cfg.user, cfg.repo] = location.href.match(/^https:\/\/(.*)\.github\.io\/([^/]+)/) || ['', '', '']

  tmp = await fetch('config.json')
  if (tmp.ok)
    cfg = await tmp.json()

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
  const tries = [
    './posts',
    `https://api.github.com/repos/${user}/${repo}/contents/_site/posts`, // blogtini
    `https://api.github.com/repos/${user}/${repo}/contents/source/_posts`, // ajaquith hugo
    `https://api.github.com/repos/${user}/${repo}/contents`, // minimal repo, top dir == web dir
  ]

  let mds = [] // xxx cache
  tmp = await fetch(tries[0])
  if (tmp.ok) {
    // local dev or something that replies with a directory listing (yay)
    const dir = await tmp.text()
    mds = [...dir.matchAll(/<a href="([^"]+.md)"/g)].map((e) => e[1])
  } else {
    // use GitHub API to get a list of the posts
    tmp = await fetch(tries[1])
    if (!tmp.ok)
      tmp = await fetch(tries[2])
    if (!tmp.ok)
      tmp = await fetch(tries[3])
    const json = await tmp.json()
    mds = json.map((e) => e.download_url)
  }
  const latest = mds.filter((e) => e !== 'README.md' && !e.match(/\/README.md$/)).sort().reverse()
  log(latest.slice(0, cfg.posts_per_page))


  let proms = []
  let files = []
  for (let n = 0; n < latest.length; n++) {
    const md = latest[n]
    const url = md.match(/\//) ? md : `./posts/${md}`
    const mat = url.match(/^(.*)\/([^/]+)$/)
    // eslint-disable-next-line prefer-destructuring
    if (!n) state.prefix = mat[1]
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

    const parts = yaml.split('\n---')

    const front_matter = parts.shift()
    const body = parts.join('\n---').replace(/\n\n/g, '<br><br>').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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

    if (filter_tag.length  &&       !(tags.includes(filter_tag))) continue
    if (filter_cat.length  && !(categories.includes(filter_cat))) continue
    if (filter_post && file.replace(/\.md$/, '') !== filter_post) continue

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
      : post_card(title, img, date_short, taglinks, body, file)
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


function post_card(title, img, date, taglinks, body, file) {
  return `
    <div class="card card-body bg-light">
      <a href="?${file.replace(/\.md$/, '')}">
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
