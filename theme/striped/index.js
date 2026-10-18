/*
  Striped theme -- a port of https://html5up.net/striped
  (Free for personal and commercial use under the CCA 3.0 license: html5up.net/license)

  All light DOM, like the other HTML5 UP ports -- see THEMES.md.  HTML5 UP's original `main.css` styles it, as is.
  `<bt-body>` fills itself w/ `#content` & the `#sidebar` -- and moves blogtini's content into `#content`.
  (Striped's `<body>` is their flex container, so `index.css` makes `<bt-body>` `display: contents`)

  The jQuery `main.js` (title bar & slide-out sidebar, at narrower widths) is ported to vanilla js, below.
*/

import {
  cfg, state, url2post, urlify, summarize_markdown, markdown_to_html, datetime, imgurl, reveal,
  all_posts,
} from '../../index.js'
import { vrsort } from '../../js/text.js'
import {
  esc, nodes, post_img, site_img, menu_items, theme_items, scheme_toggles, copyright,
  social_icons, pager, comments, taxonomy, highlight_code, histogram_items, tag_cloud,
  contact_form, preload,
} from '../html5up/shared.js'


// sidebar slides out (w/ a title bar on top), at or below this width
const NARROW = globalThis.matchMedia('(max-width: 1000px)')


/**
 * Returns Striped's date, eg: `Jul<span>y</span> 14, 2014` -- the `<span>`s drop at narrower widths
 */
function striped_date(date) {
  // (`datetime()` gets the day right for date-only front matter.  Then drop any weekday & time)
  const d = new Date(datetime(date).replace(/^\w+, /, '').replace(/ \d+:\d+ [AP]M$/, ''))
  if (isNaN(d))
    return ''
  const month = d.toLocaleString('en', { month: 'long' })
  return `<span class="date"><span class="month">${month.slice(0, 3)}<span>${month.slice(3)}</span></span> <span class="day">${d.getDate()}</span><span class="year">, ${d.getFullYear()}</span></span>`
}

/** Returns a post's "stats" (left of the post): reading time, number of tags */
function stats(post) {
  const href = esc(urlify(post.url))
  const minutes = Math.max(1, Math.round(post.body_raw.trim().split(/\s+/).length / 200))
  const tags = post.tags?.length ?? 0
  return `
<ul class="stats">
  ${cfg.reading_time ? `<li><a href="${href}" class="icon solid fa-clock" title="${minutes} minute read">${minutes}</a></li>` : ''}
  ${tags ? `<li><a href="${href}" class="icon solid fa-tag" title="${tags} tags">${tags}</a></li>` : ''}
</ul>`
}


/** Returns the pagination: for pages of posts, or a single post's neighbors */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  return `
<div class="pagination">
  ${pg.left_url ? `<a href="${esc(pg.left_url)}" class="button previous" title="${esc(pg.left_title)}">${pg.single ? 'Previous Post' : 'Previous Page'}</a>` : ''}
  ${pg.single ? '' : `<div class="pages"><a href="#" class="active">${state.page + 1}</a></div>`}
  ${pg.rite_url ? `<a href="${esc(pg.rite_url)}" class="button next" title="${esc(pg.rite_title)}">${pg.single ? 'Next Post' : 'Next Page'}</a>` : ''}
</div>`
}


customElements.define('bt-body', class extends HTMLElement {
  connectedCallback() {
    if (this.rendered)
      return
    this.rendered = true

    // blogtini's main content -- eg: `<bt-posts>`.  (minus any `<hr>`)
    const content = [...this.childNodes].filter((e) => e.nodeName !== 'HR')

    const recent = JSON.parse(this.getAttribute('recent_posts') || '[]')
    const categories = JSON.parse(this.getAttribute('categories') || '{}')
    const tags = JSON.parse(this.getAttribute('tags') || '{}')

    this.innerHTML = `
<div id="content">
  <div class="inner"></div>
</div>

<div id="sidebar">
  <h1 id="logo"><a href="${esc(state.top_page)}">${esc(cfg.title)}</a></h1>

  <nav id="nav">
    <ul>
      ${menu_items()}
      <li><a href="#scheme" class="scheme-toggle"><i class="fas fa-lightbulb"></i> Scheme</a></li>
    </ul>
  </nav>

  ${cfg.header.search
    ? `
  <section class="box search">
    <form>
      <input type="text" class="text" id="search-input" placeholder="Search" autocomplete="off">
    </form>
    <div id="search-results"></div>
  </section>`
    : ''}

  ${cfg.sidebar.about || cfg.intro?.paragraph
    ? `
  <section class="box text-style1">
    <div class="inner">
      ${site_img() ? `<a href="${esc(state.top_page)}"><img class="site-img" src="${esc(site_img())}" alt=""></a>` : ''}
      ${cfg.intro?.paragraph ? `<p>${cfg.intro.paragraph}</p>` : ''}
      ${cfg.sidebar.about ? `<p>${cfg.sidebar.about} <a href="${esc(state.top_dir)}about">Learn more</a></p>` : ''}
    </div>
  </section>`
    : ''}

  ${sidebar_recent(recent)}
  ${sidebar_calendar()}
  ${sidebar_categories(categories)}

  ${Object.keys(tags).length
    ? `
  <section class="box tagcloud">
    <header><h2><a href="${esc(state.top_page)}?tags">Tags</a></h2></header>
    <p>${tag_cloud(tags, 0.75, 1.4)}</p>
  </section>`
    : ''}

  ${cfg.header.theme
    ? `
  <section class="box recent-posts">
    <header><h2>Theme</h2></header>
    <ul id="theme-menu">${theme_items()}</ul>
  </section>`
    : ''}

  ${cfg.footer?.social || cfg.intro?.social
    ? `
  <section class="box">
    <ul class="icons">${social_icons()}</ul>
  </section>`
    : ''}

  <ul id="copyright">
    <li>${copyright('Striped', 'https://html5up.net/striped')}</li>
  </ul>
</div>`

    const inner = this.querySelector('#content > .inner')
    inner.append(...content)
    inner.append(nodes(pagination()))

    this.querySelector('.box.search form')?.addEventListener('submit', (evt) => evt.preventDefault())
    scheme_toggles(this)
    calendar_setup(this)
    setup(this)

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }
})


function sidebar_recent(recent) {
  if (!cfg.sidebar.post_amount || !recent.length)
    return ''
  const more = recent.length >= cfg.sidebar.post_amount
  return `
<section class="box recent-posts">
  <header><h2>Recent Posts</h2></header>
  <ul>
    ${recent.map((url) => {
      const post = url2post(urlify(url))
      return post ? `<li><a href="${esc(urlify(post.url))}">${esc(post.title)}</a></li>` : ''
    }).join('')}
    ${more ? `<li><a href="${esc(cfg.view_more_posts_link || `${state.top_page}#post${cfg.sidebar.post_amount}`)}">See more &hellip;</a></li>` : ''}
  </ul>
</section>`
}

/** Returns a post date's day, eg: '2014-07-14' -- the same day `datetime()` shows */
function post_day(date) {
  const d = new Date(date)
  if (isNaN(d))
    return ''
  // front matter dates w/o a time arrive as UTC midnight -- that's their day.  Others: local time
  if ((typeof date === 'string' && date.length <= 10) || d.toISOString().endsWith('T00:00:00.000Z'))
    return d.toISOString().slice(0, 10)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Returns the inside of Striped's sidebar calendar, for a month: days w/ posts link to them.
 * Its caption's arrows go to the prior/next month w/ posts.
 *
 * @param {string} ym  eg: '2014-07'
 * @param {Object<string, Array>} by_day  eg: { '2014-07-14': [post, ...] }
 */
function calendar_table(ym, by_day) {
  const [year, month] = ym.split('-').map(Number)
  const lead = (new Date(year, month - 1, 1).getDay() + 6) % 7 // days before the 1st, weeks start Monday
  const ndays = new Date(year, month, 0).getDate()
  const now = new Date()
  const today = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`

  // months w/ posts, for the arrows
  const months = [...new Set(Object.keys(by_day).map((e) => e.slice(0, 7)))].sort()
  const prior = months.filter((e) => e < ym).pop()
  const next = months.find((e) => e > ym)

  const cells = lead ? [`<td colspan="${lead}" class="pad"><span>&nbsp;</span></td>`] : []
  for (let day = 1; day <= ndays; day++) {
    const key = `${ym}-${`${day}`.padStart(2, '0')}`
    const posts = by_day[key] ?? []
    const title = esc(posts.map((e) => e.title).join(' / '))
    cells.push(`<td${key === today ? ' class="today"' : ''}>${posts.length
      ? `<a href="${esc(urlify(posts[0].url))}" title="${title}">${day}</a>`
      : `<span>${day}</span>`}</td>`)
  }
  const trail = (7 - ((lead + ndays) % 7)) % 7
  if (trail)
    cells.push(`<td colspan="${trail}" class="pad"><span>&nbsp;</span></td>`)

  // rows of 7 days (a padding cell counts as its colspan)
  const rows = []
  let row = []
  let cols = 0
  for (const cell of cells) {
    row.push(cell)
    cols += Number(cell.match(/colspan="(\d+)"/)?.[1] ?? 1)
    if (cols % 7 === 0) {
      rows.push(`<tr>${row.join('')}</tr>`)
      row = []
    }
  }

  const name = new Date(year, month - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' })
  const days = [['Monday', 'M'], ['Tuesday', 'T'], ['Wednesday', 'W'], ['Thursday', 'T'], ['Friday', 'F'], ['Saturday', 'S'], ['Sunday', 'S']]
  return `
<table>
  <caption>
    ${prior ? `<a href="#" class="cal-nav cal-prior" data-ym="${prior}" title="Prior month w/ posts">&lsaquo;</a>` : ''}
    ${name}
    ${next ? `<a href="#" class="cal-nav cal-next" data-ym="${next}" title="Next month w/ posts">&rsaquo;</a>` : ''}
  </caption>
  <thead><tr>${days.map(([day, abbr]) => `<th scope="col" title="${day}">${abbr}</th>`).join('')}</tr></thead>
  <tbody>${rows.join('')}</tbody>
</table>`
}

/** Returns the posts (not pages) by day, eg: { '2014-07-14': [post, ...] } */
function posts_by_day() {
  const by_day = {}
  for (const post of all_posts()) {
    const day = post.type === 'post' ? post_day(post.date) : ''
    if (day)
      (by_day[day] ||= []).push(post)
  }
  return by_day
}

/** Returns Striped's sidebar calendar: the month of this post -- or else the newest post */
function sidebar_calendar() {
  const by_day = posts_by_day()
  const newest = Object.keys(by_day).sort().pop()
  if (!newest)
    return ''

  const self = state.filter_post_url ? url2post(state.filter_post_url) : null
  const ym = (self?.type === 'post' && post_day(self.date)) || newest
  return `
<section class="box calendar">
  <div class="inner">${calendar_table(ym.slice(0, 7), by_day)}</div>
</section>`
}

/** Wires up the calendar's prior/next month arrows (re-renders just the table) */
function calendar_setup(btbody) {
  const box = btbody.querySelector('.box.calendar .inner')
  box?.addEventListener('click', (evt) => {
    const nav = evt.target.closest('.cal-nav')
    if (!nav)
      return
    evt.preventDefault()
    box.innerHTML = calendar_table(nav.dataset.ym, posts_by_day())
  })
}

function sidebar_categories(categories) {
  if (!cfg.sidebar.categories || !Object.keys(categories).length)
    return ''
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  return `
<section class="box recent-posts">
  <header><h2><a href="${esc(state.top_page)}?categories">Categories</a></h2></header>
  <ul>
    ${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}
  </ul>
</section>`
}


/**
 * Vanilla js port of Striped's jQuery `main.js`: the title bar & slide-out sidebar (at narrower widths).
 */
function setup(btbody) {
  preload()

  const logo = btbody.querySelector('#logo').innerHTML
  btbody.appendChild(nodes(`<div id="titleBar"><a href="#sidebar" class="toggle"></a><span class="title">${logo}</span></div>`))

  btbody.querySelector('#titleBar .toggle').addEventListener('click', (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    document.body.classList.toggle('sidebar-visible')
  })

  // Page-wide listeners: once (a theme switch re-renders us)
  if (globalThis.bt_striped_listening)
    return
  globalThis.bt_striped_listening = true

  // Hide the slid-out sidebar on a click outside it -- or a link in it (but the theme picker re-renders anyway)
  document.addEventListener('click', (evt) => {
    if (!NARROW.matches || !document.body.classList.contains('sidebar-visible'))
      return
    const path = evt.composedPath()
    const sidebar = document.querySelector('#sidebar')
    const link = path.find((e) => e.matches?.('a[href]:not(.scheme-toggle)'))
    if (!path.includes(sidebar) || link)
      document.body.classList.remove('sidebar-visible')
  })
  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape')
      document.body.classList.remove('sidebar-visible')
  })
  NARROW.addEventListener('change', () => {
    if (!NARROW.matches)
      document.body.classList.remove('sidebar-visible')
  })
}


/** Returns a post's excerpt, for the list of posts */
function excerpt(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const href = esc(urlify(post.url))
  return `
<article class="box post post-excerpt" ${id ? `id="${esc(id)}"` : ''}>
  <header>
    <h2><a href="${href}">${esc(post.title)}</a></h2>
    ${post.categories?.length ? `<p>${post.categories.map(esc).join(' &middot; ')}</p>` : ''}
  </header>
  <div class="info">
    ${striped_date(post.date)}
    ${stats(post)}
  </div>
  ${img ? `<a href="${href}" class="image featured"><img src="${esc(img)}" alt="${esc(post.featuredalt)}" loading="lazy"></a>` : ''}
  ${summarize_markdown(post.body_raw, cfg.summary_length)}
  <p class="more"><a href="${href}" class="button">Continue Reading</a></p>
</article>`
}


customElements.define('bt-posts', class extends HTMLElement {
  connectedCallback() {
    const posts = [...this.querySelectorAll('bt-post')].map((e) => [e.getAttribute('url'), e.id])

    let title = ''
    if (state.filter_tag)
      title = `Tagged: ${state.filter_tag}`
    else if (state.filter_cat)
      title = `Category: ${state.filter_cat}`

    this.replaceWith(nodes(`
${title ? `<article class="box post filtered"><header><h2>${esc(title)}</h2></header></article>` : ''}
${posts.map(([url, id]) => excerpt(url, id)).join('')}`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(excerpt(this.getAttribute('url'), this.id)))
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    if (post.type === 'homepage') {
      this.replaceWith(nodes(`<article class="box post"><div class="post-body">${body}</div></article>`))
      highlight_code()
      return
    }

    const tax = taxonomy(post)
    this.replaceWith(nodes(`
<article class="box post post-excerpt">
  <header>
    <h2>${esc(post.title)}</h2>
    ${post.author ? `<p>${esc(post.author)}</p>` : ''}
  </header>
  <div class="info">
    ${striped_date(post.date)}
    ${stats(post)}
  </div>
  ${post.featured ? `<span class="image featured"><img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt)}"></span>` : ''}
  <div class="post-body">${body}</div>
  ${tax ? `<hr><p class="post-tags">${tax}</p>` : ''}
  ${comments(post)}
</article>`))

    highlight_code()
  }
})


customElements.define('bt-histogram', class extends HTMLElement {
  connectedCallback() {
    const type = state.list_tags ? 'tags' : 'categories'
    const histogram = JSON.parse(this.getAttribute('histogram') || '{}')
    this.replaceWith(nodes(`
<article class="box post histogram">
  <header><h2>${type}</h2></header>
  <ul>${histogram_items(type, histogram)}</ul>
</article>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
<article class="box post">
  <header><h2>Contact</h2></header>
  ${contact_form()}
</article>`))
  }
})
