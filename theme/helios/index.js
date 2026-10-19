/*
  Helios theme -- a port of https://html5up.net/helios
  (Free for personal and commercial use under the CCA 3.0 license: html5up.net/license)

  All light DOM, like the other HTML5 UP ports -- see THEMES.md.  HTML5 UP's original `main.css` styles it, as is.
  `<bt-body>` fills itself w/ the header & nav, (homepage) banner & carousel, and footer -- and moves blogtini's
  content in between.  The rest replace themselves w/ plain html.
  A post's sidebar goes left, right, or none: `config.yml` `sidebar: { position: left | right | none }`.

  The jQuery `main.js` (carousel, nav dropdowns, phone width nav panel, smooth scroll) is ported to vanilla js,
  below & in `../html5up/shared.js`.
*/

import {
  cfg, state, url2post, urlify, summarize_markdown, markdown_to_html, datetime, imgurl, reveal,
  all_posts,
} from '../../index.js'
import { vrsort } from '../../js/text.js'
import {
  esc, nodes, post_img, site_img, menu_items, theme_items, scheme_toggles, copyright,
  social_icons, pager, comments, taxonomy, highlight_code, histogram_items, tag_cloud,
  contact_form, preload, dropdowns, nav_panel, nav_panel_links,
} from '../html5up/shared.js'


// a post's sidebar side, unless `config.yml` `sidebar: { position: left | right | none }` pins it.
// (Helios's own sidebar pages come both ways)
const SIDEBAR_POSITION = 'right'

const CAROUSEL_POSTS = 12
const SHORT_SUMMARY = 140
const TOUCH = globalThis.matchMedia('(hover: none)')

// a post's sidebar html -- made by `<bt-body>`, used by `<bt-post-full>` (which renders right after it)
let sidebar_html = ''


/** Returns prior & next buttons: for pages of posts, or a single post's neighbors */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  return `
<div class="wrapper style2 pager">
  <div class="container">
    <ul class="actions">
      ${pg.left_url ? `<li><a href="${esc(pg.left_url)}" class="button icon solid fa-chevron-left">${esc(pg.left_title)}</a></li>` : ''}
      ${pg.rite_url ? `<li><a href="${esc(pg.rite_url)}" class="button icon solid fa-chevron-right">${esc(pg.rite_title)}</a></li>` : ''}
    </ul>
  </div>
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

    // the full screen header, banner & carousel: just on the homepage's first page
    const home = state.is_homepage && !location.search
    document.body.classList.toggle('homepage', home)

    sidebar_html = sidebar(recent, categories, tags)

    this.innerHTML = `
<div id="page-wrapper">
  <div id="header">
    <div class="inner">
      <header>
        <h1><a href="${esc(state.top_page)}" id="logo">${esc(cfg.title)}</a></h1>
        ${home ? `<hr />${cfg.intro?.paragraph ? `<p class="intro">${cfg.intro.paragraph}</p>` : ''}` : ''}
      </header>
      ${home ? '<footer><a href="#banner" class="button circled scrolly">Start</a></footer>' : ''}
    </div>

    <nav id="nav">
      <ul>
        ${menu_items()}
        ${cfg.header.theme
          ? `
        <li>
          <a href="#theme-menu">Theme</a>
          <ul class="dropotron" id="theme-menu">${theme_items()}</ul>
        </li>`
          : ''}
        ${cfg.header.search
          ? `
        <li>
          <a href="#search">Search</a>
          <div class="dropotron bt-search" id="search">
            <input type="text" id="search-input" placeholder="Search" autocomplete="off">
            <div id="search-results"></div>
          </div>
        </li>`
          : ''}
        <li><a href="#scheme" class="scheme-toggle" title="Scheme: light / dark"><i class="fas fa-lightbulb"></i></a></li>
      </ul>
    </nav>
  </div>

  ${home ? banner() : ''}
  ${home ? carousel() : ''}

  <div id="bt-content"></div>

  <div id="footer">
    <div class="container">
      <div class="row">
        ${footer_recent(recent)}
        ${footer_categories(categories)}
        ${Object.keys(tags).length
          ? `
        <section class="col-4 col-12-mobile tagcloud">
          <header><h2 class="icon solid fa-tag circled"><span class="label">Tags</span></h2></header>
          <p>${tag_cloud(tags, 0.8, 1.4)}</p>
        </section>`
          : ''}
      </div>
      <hr />
      <div class="row">
        <div class="col-12">
          <section class="contact">
            <header><h3>${esc(cfg.title)}</h3></header>
            ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
            ${cfg.footer?.social || cfg.intro?.social ? `<ul class="icons">${social_icons()}</ul>` : ''}
          </section>
          <div class="copyright">
            <ul class="menu">
              <li>${copyright('Helios', 'https://html5up.net/helios')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="navButton"><a href="#navPanel" class="toggle"></a></div>
<div id="navPanel"><nav>${nav_panel_links()}</nav></div>`

    // blogtini's content goes where `#bt-content` is
    const slot = this.querySelector('#bt-content')
    slot.after(...content, nodes(pagination()))
    slot.remove()

    scheme_toggles(this)
    setup(this)

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }
})


/** Returns the homepage's banner: the site's "about" */
function banner() {
  return `
<section id="banner">
  <header>
    <h2><strong>${esc(cfg.title)}</strong></h2>
    ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
  </header>
</section>`
}

/** Returns the homepage's carousel of the newest posts */
function carousel() {
  const posts = all_posts().filter((e) => e.type === 'post').slice(0, CAROUSEL_POSTS)
  if (!posts.length)
    return ''
  return `
<section class="carousel">
  <div class="reel">
    ${posts.map((post) => {
      const img = post_img(post)
      const href = esc(urlify(post.url))
      return `
    <article>
      ${img ? `<a href="${href}" class="image featured"><img src="${esc(img)}" alt="${esc(post.featuredalt)}" loading="lazy"></a>` : ''}
      <header><h3><a href="${href}">${esc(post.title)}</a></h3></header>
      <p>${summarize_markdown(post.body_raw, SHORT_SUMMARY).replace(/<[^>]+>/g, '')}</p>
    </article>`
    }).join('')}
  </div>
</section>`
}


/** Returns a post's sidebar: about, recent posts, categories, tags */
function sidebar(recent, categories, tags) {
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  return `
<hr class="first" />
<section>
  <header><h3><a href="${esc(state.top_dir)}about">About</a></h3></header>
  ${site_img() ? `<p><img class="site-img" src="${esc(site_img())}" alt=""></p>` : ''}
  ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
  <footer><a href="${esc(state.top_dir)}about" class="button">Learn More</a></footer>
</section>
${cfg.sidebar.post_amount && recent.length
  ? `
<hr />
<section>
  <header><h3>Recent Posts</h3></header>
  <div class="row gtr-50">
    ${recent.map((url) => {
      const post = url2post(urlify(url))
      if (!post)
        return ''
      const img = post_img(post)
      const href = esc(urlify(post.url))
      return `
    <div class="col-4">${img ? `<a href="${href}" class="image fit"><img src="${esc(img)}" alt="" loading="lazy"></a>` : ''}</div>
    <div class="col-8">
      <h4><a href="${href}">${esc(post.title)}</a></h4>
      <p class="date">${esc(datetime(post.date))}</p>
    </div>`
    }).join('')}
  </div>
</section>`
  : ''}
${cfg.sidebar.categories && entries.length
  ? `
<hr />
<section>
  <header><h3><a href="${esc(state.top_page)}?categories">Categories</a></h3></header>
  <ul class="divided">
    ${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}
  </ul>
</section>`
  : ''}
${Object.keys(tags).length
  ? `
<hr />
<section class="tagcloud">
  <header><h3><a href="${esc(state.top_page)}?tags">Tags</a></h3></header>
  <p>${tag_cloud(tags, 0.8, 1.4)}</p>
</section>`
  : ''}`
}


function footer_recent(recent) {
  if (!cfg.sidebar.post_amount || !recent.length)
    return ''
  return `
<section class="col-4 col-12-mobile">
  <header><h2 class="icon solid fa-file circled"><span class="label">Posts</span></h2></header>
  <ul class="divided">
    ${recent.map((url) => {
      const post = url2post(urlify(url))
      return post
        ? `
    <li>
      <article class="post stub">
        <header><h3><a href="${esc(urlify(post.url))}">${esc(post.title)}</a></h3></header>
        <span class="timestamp">${esc(datetime(post.date))}</span>
      </article>
    </li>`
        : ''
    }).join('')}
  </ul>
</section>`
}

function footer_categories(categories) {
  if (!cfg.sidebar.categories || !Object.keys(categories).length)
    return ''
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  return `
<section class="col-4 col-12-mobile">
  <header><h2 class="icon solid fa-folder circled"><span class="label">Categories</span></h2></header>
  <ul class="divided">
    ${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}
  </ul>
</section>`
}


/**
 * Vanilla js port of Helios's jQuery `main.js`: smooth scroll, nav dropdowns, nav panel, carousel.
 */
function setup(btbody) {
  preload()

  btbody.querySelectorAll('.scrolly').forEach((e) => e.addEventListener('click', (evt) => {
    evt.preventDefault()
    btbody.querySelector(e.hash)?.scrollIntoView({ behavior: 'smooth' })
  }))

  dropdowns(btbody)
  nav_panel(btbody.querySelector('#navButton .toggle'))

  btbody.querySelectorAll('.carousel').forEach(carousel_setup)
}

/**
 * Helios's carousel: hover its edge arrows to scroll it.  (Touch screens: just swipe it)
 */
function carousel_setup(section) {
  const reel = section.querySelector('.reel')
  const forward = nodes('<span class="forward"></span>').firstElementChild
  const backward = nodes('<span class="backward"></span>').firstElementChild
  section.append(forward, backward)

  if (TOUCH.matches) {
    reel.style.overflowX = 'scroll'
    reel.style.overflowY = 'hidden'
    forward.style.display = 'none'
    backward.style.display = 'none'
    return
  }

  reel.style.overflow = 'visible'
  let pos = 0
  let timer
  const move = (dir) => {
    timer = setInterval(() => {
      const right_limit = Math.min(0, globalThis.innerWidth - reel.scrollWidth)
      pos = Math.max(right_limit, Math.min(0, pos + (dir * 4)))
      reel.style.transform = `translate(${pos}px, 0)`
      if (pos === 0 || pos === right_limit)
        clearInterval(timer)
    }, 10)
  }
  forward.addEventListener('mouseenter', () => move(-1))
  backward.addEventListener('mouseenter', () => move(1))
  for (const e of [forward, backward])
    e.addEventListener('mouseleave', () => clearInterval(timer))
}


/** Returns a post's card, for the grid of posts */
function card(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const href = esc(urlify(post.url))
  return `
<article class="col-4 col-12-mobile special" ${id ? `id="${esc(id)}"` : ''}>
  ${img ? `<a href="${href}" class="image featured"><img src="${esc(img)}" alt="${esc(post.featuredalt)}" loading="lazy"></a>` : ''}
  <header>
    <h3><a href="${href}">${esc(post.title)}</a></h3>
    <p class="date">${esc(datetime(post.date))}</p>
  </header>
  <p>${summarize_markdown(post.body_raw, SHORT_SUMMARY).replace(/<[^>]+>/g, '')}</p>
</article>`
}

/** Returns the big featured post, for the newest post on the homepage */
function featured(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const href = esc(urlify(post.url))
  return `
<div class="wrapper style2">
  <article id="main" class="container special">
    ${img ? `<a href="${href}" class="image featured" ${id ? `id="${esc(id)}"` : ''}><img src="${esc(img)}" alt="${esc(post.featuredalt)}"></a>` : ''}
    <header>
      <h2><a href="${href}">${esc(post.title)}</a></h2>
      <p class="date">${esc(datetime(post.date))}</p>
    </header>
    ${summarize_markdown(post.body_raw, cfg.summary_length)}
    <footer><a href="${href}" class="button">Continue Reading</a></footer>
  </article>
</div>`
}


customElements.define('bt-posts', class extends HTMLElement {
  connectedCallback() {
    const posts = [...this.querySelectorAll('bt-post')].map((e) => [e.getAttribute('url'), e.id])

    const filtered = state.filter_tag || state.filter_cat
    // newest post gets featured -- on the homepage's first page, when it doesnt have its own content
    const top = !filtered && !state.page && !state.show_top_content && posts.length
      ? featured(...posts.shift())
      : ''

    let title = top ? 'More Posts' : 'Posts'
    if (state.filter_tag)
      title = `Tagged: ${state.filter_tag}`
    else if (state.filter_cat)
      title = `Category: ${state.filter_cat}`
    else if (state.page)
      title = `Posts, page ${state.page + 1}`

    this.replaceWith(nodes(`
${top}
${posts.length
  ? `
<div class="wrapper style1">
  <section id="features" class="container special">
    <header><h2>${esc(title)}</h2></header>
    <div class="row">
      ${posts.map(([url, id]) => card(url, id)).join('')}
    </div>
  </section>
</div>`
  : ''}`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`<div class="wrapper style1"><div class="container"><div class="row">${card(this.getAttribute('url'), this.id)}</div></div></div>`))
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    if (post.type === 'homepage') {
      this.replaceWith(nodes(`<div class="wrapper style1"><div class="container post-body">${body}</div></div>`))
      highlight_code()
      return
    }

    const tax = taxonomy(post)
    const article = `
<article id="main">
  <header>
    <h2>${esc(post.title)}</h2>
    <p class="date">${esc(datetime(post.date))}${post.author ? ` &middot; ${esc(post.author)}` : ''}</p>
  </header>
  ${post.featured ? `<span class="image featured"><img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt)}"></span>` : ''}
  <div class="post-body">${body}</div>
  ${tax ? `<hr><p class="post-tags">${tax}</p>` : ''}
  ${comments(post)}
</article>`

    // sidebar: left, right, or none
    const position = cfg.sidebar.position ?? SIDEBAR_POSITION
    const side = `<div class="col-4 col-12-mobile" id="sidebar">${sidebar_html}</div>`
    const main = `<div class="col-8 col-12-mobile imp-mobile" id="content">${article}</div>`
    this.replaceWith(nodes(`
<div class="wrapper style1">
  <div class="container">
    ${position === 'none'
      ? article
      : `<div class="row gtr-200">${position === 'left' ? side + main : main + side}</div>`}
  </div>
</div>`))

    highlight_code()
  }
})


customElements.define('bt-histogram', class extends HTMLElement {
  connectedCallback() {
    const type = state.list_tags ? 'tags' : 'categories'
    const histogram = JSON.parse(this.getAttribute('histogram') || '{}')
    this.replaceWith(nodes(`
<div class="wrapper style1">
  <article id="main" class="container histogram">
    <header><h2>${type}</h2></header>
    <ul class="divided">${histogram_items(type, histogram)}</ul>
  </article>
</div>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
<div class="wrapper style1">
  <article id="main" class="container">
    <header><h2>Contact</h2></header>
    ${contact_form()}
  </article>
</div>`))
  }
})
