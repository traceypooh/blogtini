/*

github.com cookie: dotcom_user

minimum:
setup GH account
visit: https://github.com/traceypooh/blogtini
press [Y Fork] button in upper right
(fork to your account)
hit [⚙️ Settings] in upper right
[🗂️ Pages] left menu
enable xxx

xxx need to pipeline??

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
  - http://hunterleebrown.com/blog/feed
  - https://hugo-fresh.vercel.app/blog/index.xml
  - http://feeds.feedburner.com/securitymetrics-org

  xxx posts w/o dates examples
  - eg: https://api.github.com/repos/stefma/hugo-fresh/contents/exampleSite/content/blog
        https://github.com/StefMa/hugo-fresh/tree/master/exampleSite/content/blog
        https://hugo-fresh.vercel.app/blog/index.xml   ** BUT! :) **

*/

import yml from 'https://esm.archive.org/js-yaml'

const log = console.log.bind(console)
const blogtini = 'img/blogtini.png' // xxx
const state = {
  tags: {},
  cats: {},
}
const tag = (decodeURIComponent(location.search).match(/^\?tags\/([^&]+)/) || ['', ''])[1]
const cfg = await (await fetch('config.json')).json()

/*
return JSON.parse(localStorage.getItem('playset'))
www/js/playset/playset.js:    localStorage.setItem('playset', JSON.stringify(item))
*/

async function main() {
  document.getElementById('welcome').insertAdjacentHTML('afterbegin', `
    <img id="blogtini" src="${blogtini}">
    <h1><a href="?"><img src="${cfg.img_site}">${cfg.title}</a></h1>
  `)

  let mds = [] // xxx cache
  const tmp = await fetch(`./posts`)
  if (tmp.ok) {
    // local dev or something that replies with a directory listing (yay)
    const dir = await (tmp).text()
    mds = [...dir.matchAll(/<a href="([^"]+.md)"/g)].map((e) => e[1])
  } else {
    // use GitHub API to get a list of the posts
    const json = await (await fetch(`https://api.github.com/repos/${cfg.user}/${cfg.repo}/contents/_site/posts`)).json()
    mds = json.map((e) => e.name)
  }
  const latest = mds.filter((e) => e !== 'README.md' && !e.match(/\/README.md$/)).sort().reverse()
  log(latest.slice(0, cfg.posts_per_page))


  let proms = []
  let urls = []
  for (let n = 0; n < latest.length; n++) {
    const md = latest[n]
    const url = md.match(/\//) ? md : `./posts/${md}`

    urls.push(url)
    proms.push(fetch(url))

    if (((n + 1) % cfg.posts_per_page) && n < latest.length - 1)
      continue // keep building up requests

    // now make the requests in parallel and wait for them all to answer.
    const vals = await Promise.all(proms)
    const url2markdown = urls.reduce((obj, key, idx) => ({ ...obj, [key]: vals[idx] }), {})

    await parse_posts(url2markdown)

    urls = []
    proms = []
  }

  finish()
}

async function parse_posts(markdowns) {
  let htm = ''
  for (const [url, markdown] of Object.entries(markdowns)) {
    const yaml = await markdown.text()

    const front_matter = yaml.split('\n---').shift()
    const json = yml.load(front_matter)
    log({ json })

    const title      = json?.title?.trim() ?? ''
    const tags       = (json?.tags       ?? []).map((e) => e.trim().replace(/ /g, '-'))
    const categories = (json?.categories ?? []).map((e) => e.trim().replace(/ /g, '-'))
    const date       = json?.date ?? new Date() // xxx reality?
    const featured   = json?.featured?.trim() ?? '' // xxx reality?
    const year = parseInt(date.getUTCFullYear(), 10) // chexxx UTC
    log({ title, tags, date, featured })
    // author xxx

    for (const tag of tags) {
      state.tags[tag] = state.tags[tag] || []
      state.tags[tag].push(url)
    }
    for (const cat of categories) {
      state.cats[cat] = state.cats[cat] || []
      state.cats[cat].push(url)
    }

    if (tag.length && !(tags.includes(tag))) continue

    const img = featured === ''
      ? cfg.img_site
      : (featured.match(/\//) ? featured : `./img/${featured}`)

    const taglinks = tags.map((e) => `<a href="./?tags/${e}">${e}</a>`).join(' ')

    htm += `
      <div class="card card-body bg-light">
        <img src="${img}">
        <h2>${title}</h2>
        ${`${date}`.split(' ').slice(0, 4).join(' ')}<br>
        Tags: ${taglinks}
      </div>`
  }

  document.getElementById('spa').insertAdjacentHTML('beforeend', htm)
}

function finish() {
  let htm

  htm = ''
  for (const tag of Object.keys(state.tags).sort())
    htm += `<a href="?tags/${tag}">${tag}</a> `
  document.getElementById('nav-tags').insertAdjacentHTML('beforeend', htm)

  htm = ''
  for (const cat of Object.keys(state.cats).sort())
    htm += `<a href="?categories/${cat}">${cat}</a> `
  document.getElementById('nav-cats').insertAdjacentHTML('beforeend', htm)
}

await main()

// document.getElementsByTagName('meta')['keywords'].content = 'updated keywords xxx'
// document.getElementsByTagName('meta')['description'].content = 'updated description xxx'
