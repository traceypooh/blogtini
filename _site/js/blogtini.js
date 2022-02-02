/*
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
const blogtini = '/img/blogtini.png' // xxx
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
  document.getElementById('spa').insertAdjacentHTML('beforebegin', `
    <div id="welcome" class="bg-light">
      <img id="blogtini" src="${blogtini}">
      <h1><a href="?"><img src="${cfg.img_site}">${cfg.title}</a></h1>
    </div>
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

await main()

// document.getElementsByTagName('meta')['keywords'].content = 'updated keywords xxx'
// document.getElementsByTagName('meta')['description'].content = 'updated description xxx'
