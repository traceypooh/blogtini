/*
  Massively theme -- a port of https://html5up.net/massively
  (Free for personal and commercial use under the CCA 3.0 license: html5up.net/license)

  All light DOM, like editorial -- see THEMES.md.  HTML5 UP's original `main.css` styles everything, as is.
  `<bt-body>` fills itself w/ the intro, header, nav, footer -- and moves blogtini's content into `#main`.
  The rest replace themselves w/ plain html -- the css wants eg: `#main > .posts > article`.

  The jQuery `main.js` (side nav panel at phone widths, intro fade, smooth "Continue" scroll)
  is ported to vanilla js, below.  (Its background parallax is left out: the background stays fixed --
  same as the original does on hi-dpi screens and phones.)
*/

import {
  cfg, state, url2post, urlify, summarize_markdown, markdown_to_html, datetime, imgurl, reveal,
} from '../../index.js'
import { vrsort } from '../../js/text.js'
import {
  esc, nodes, post_img, site_img, menu_items, theme_items, scheme_toggles, copyright,
  social_icons, pager, comments, taxonomy, highlight_code, histogram_items, tag_cloud,
  contact_form, preload,
} from '../html5up/shared.js'


// nav moves into a side panel at, or below, this width
const MEDIUM = globalThis.matchMedia('(max-width: 980px)')
const SMALL = globalThis.matchMedia('(max-width: 736px)')


/** Returns the pagination footer: for pages of posts, or a single post's neighbors */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  if (pg.single) {
    return `
<footer>
  <div class="pagination">
    ${pg.left_url ? `<a href="${esc(pg.left_url)}" class="previous" title="${esc(pg.left_title)}">${esc(pg.left_title)}</a>` : ''}
    ${pg.rite_url ? `<a href="${esc(pg.rite_url)}" class="next" title="${esc(pg.rite_title)}">${esc(pg.rite_title)}</a>` : ''}
  </div>
</footer>`
  }
  return `
<footer>
  <div class="pagination">
    ${pg.left_url ? `<a href="${esc(pg.left_url)}" class="previous">Prev</a>` : ''}
    <a href="#" class="page active">${state.page + 1}</a>
    ${pg.rite_url ? `<a href="${esc(pg.rite_url)}" class="next">Next</a>` : ''}
  </div>
</footer>`
}


customElements.define('bt-body', class extends HTMLElement {
  connectedCallback() {
    if (this.rendered)
      return
    this.rendered = true

    // blogtini's main content -- eg: `<bt-posts>`.  (minus any `<hr>`: sections have borders already)
    const content = [...this.childNodes].filter((e) => e.nodeName !== 'HR')

    const recent = JSON.parse(this.getAttribute('recent_posts') || '[]')
    const categories = JSON.parse(this.getAttribute('categories') || '{}')
    const tags = JSON.parse(this.getAttribute('tags') || '{}')

    // the big intro: just on the homepage's first page
    const intro = state.is_homepage && !location.search

    const rss = cfg.social?.rss
      ? `<li><a href="${esc(state.top_dir + cfg.social.rss)}" class="icon solid fa-rss" type="application/rss+xml"><span class="label">RSS</span></a></li>`
      : ''

    this.innerHTML = `
<div id="wrapper" class="fade-in">
  <div class="bg fixed"></div>

  ${intro
    ? `
  <div id="intro">
    <h1>${esc(cfg.title)}</h1>
    ${cfg.intro?.paragraph ? `<p>${cfg.intro.paragraph}</p>` : ''}
    <ul class="actions">
      <li><a href="#header" class="button icon solid solo fa-arrow-down scrolly">Continue</a></li>
    </ul>
  </div>`
    : ''}

  <header id="header">
    <a href="${esc(state.top_page)}" class="logo">${esc(cfg.title)}</a>
  </header>

  <nav id="nav">
    <ul class="links">
      ${menu_items()}
      ${cfg.header.theme
        ? `
      <li class="bt-dropdown">
        <a href="#theme-menu" class="bt-dropper"><i class="fas fa-palette"></i> Theme</a>
        <div class="bt-drop"><ul id="theme-menu">${theme_items()}</ul></div>
      </li>`
        : ''}
      ${cfg.header.search
        ? `
      <li class="bt-dropdown">
        <a href="#search" class="bt-dropper"><i class="fas fa-search"></i> Search</a>
        <div id="search" class="bt-drop">
          <input type="text" id="search-input" placeholder="Search" autocomplete="off">
          <div id="search-results"></div>
        </div>
      </li>`
        : ''}
    </ul>
    <ul class="icons">
      <li><a href="#scheme" class="icon solid fa-lightbulb scheme-toggle" title="Scheme: light / dark"><span class="label">Scheme</span></a></li>
      ${rss}
    </ul>
  </nav>

  <div id="main"></div>

  <footer id="footer">
    ${footer_about(recent)}
    <section class="split contact">
      ${footer_categories(categories)}
      ${Object.keys(tags).length
        ? `
      <section class="tagcloud">
        <h3><a href="${esc(state.top_page)}?tags">Tags</a></h3>
        <p>${tag_cloud(tags, 0.7, 1.4)}</p>
      </section>`
        : ''}
      ${cfg.contact?.email_service
        ? `
      <section>
        <h3>Contact</h3>
        <p><a href="${esc(state.top_page)}?contact">Send a message</a></p>
      </section>`
        : ''}
      <section>
        <h3>Social</h3>
        <ul class="icons alt">${social_icons('alt')}</ul>
      </section>
    </section>
  </footer>

  <div id="copyright">
    <ul><li>${copyright('Massively', 'https://html5up.net/massively')}</li></ul>
  </div>
</div>`

    const main = this.querySelector('#main')
    main.append(...content)
    main.append(nodes(pagination()))

    scheme_toggles(this)
    setup(this)

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }
})


function footer_about(recent) {
  const more = recent.length >= cfg.sidebar.post_amount
  return `
<section>
  ${cfg.sidebar.about || site_img()
    ? `
  <h2>About</h2>
  ${site_img() ? `<p><a href="${esc(state.top_page)}"><img class="site-img" src="${esc(site_img())}" alt=""></a></p>` : ''}
  ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
  <ul class="actions">
    <li><a href="${esc(state.top_dir)}about" class="button">Learn More</a></li>
  </ul>`
    : ''}
  ${cfg.sidebar.post_amount && recent.length
    ? `
  <h3>Recent Posts</h3>
  <ul>
    ${recent.map((url) => {
      const post = url2post(urlify(url))
      return post ? `<li><a href="${esc(urlify(post.url))}">${esc(post.title)}</a></li>` : ''
    }).join('')}
  </ul>
  ${more ? `<p><a href="${esc(cfg.view_more_posts_link || `${state.top_page}#post${cfg.sidebar.post_amount}`)}">See more</a></p>` : ''}`
    : ''}
</section>`
}

function footer_categories(categories) {
  if (!cfg.sidebar.categories || !Object.keys(categories).length)
    return ''
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  return `
<section class="alt">
  <h3><a href="${esc(state.top_page)}?categories">Categories</a></h3>
  <ul class="categories">
    ${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}
  </ul>
</section>`
}


/**
 * Vanilla js port of Massively's jQuery `main.js`:
 * nav panel (phone widths), its toggle button, intro fade, smooth "Continue" scroll.  Plus our nav dropdowns.
 */
function setup(btbody) {
  preload()

  const wrapper = btbody.querySelector('#wrapper')
  const nav = btbody.querySelector('#nav')

  // Smooth scroll links.
  btbody.querySelectorAll('.scrolly').forEach((e) => e.addEventListener('click', (evt) => {
    evt.preventDefault()
    btbody.querySelector(e.hash)?.scrollIntoView({ behavior: 'smooth' })
  }))

  // Nav panel (phone widths) & its toggle button.
  const toggle = nodes('<a href="#navPanel" id="navPanelToggle">Menu</a>').firstElementChild
  wrapper.appendChild(toggle)
  const panel = nodes('<div id="navPanel"><nav></nav><a href="#navPanel" class="close"></a></div>').firstElementChild
  btbody.appendChild(panel)
  const panel_nav = panel.querySelector('nav')

  const show_panel = (show) => document.body.classList.toggle('is-navPanel-visible', show)
  toggle.addEventListener('click', (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    show_panel(!document.body.classList.contains('is-navPanel-visible'))
  })
  panel.querySelector('.close').addEventListener('click', (evt) => {
    evt.preventDefault()
    show_panel(false)
  })

  // Nav contents live in the nav bar -- or in the panel, at phone widths.
  const place_nav = () => {
    const into = MEDIUM.matches ? panel_nav : nav
    into.append(...(MEDIUM.matches ? nav : panel_nav).children)
    into.querySelectorAll('.icons, .icon').forEach((e) => e.classList.toggle('alt', MEDIUM.matches))
    if (!MEDIUM.matches)
      show_panel(false)
  }
  place_nav()

  // Header out of view => darker toggle button.
  const header = btbody.querySelector('#header')
  new IntersectionObserver(([entry]) => {
    toggle.classList.toggle('alt', !entry.isIntersecting)
  }, { rootMargin: '0px 0px -5% 0px' }).observe(header)

  // Our dropdowns (theme picker, search) -- one open at a time.
  btbody.querySelectorAll('.bt-dropper').forEach((e) => e.addEventListener('click', (evt) => {
    evt.preventDefault()
    const li = e.closest('.bt-dropdown')
    btbody.querySelectorAll('.bt-dropdown.open').forEach((o) => o !== li && o.classList.remove('open'))
    li.classList.toggle('open')
    if (li.classList.contains('open'))
      li.querySelector('#search-input')?.focus()
  }))

  // (so the page-wide MEDIUM listener below moves the *current* page's nav)
  globalThis.bt_massively_place_nav = place_nav

  // Page-wide listeners: once (a theme switch re-renders us, so they look up the current elements)
  if (globalThis.bt_massively_listening) {
    intro_fade()
    return
  }
  globalThis.bt_massively_listening = true

  MEDIUM.addEventListener('change', () => globalThis.bt_massively_place_nav())

  document.addEventListener('click', (evt) => {
    const path = evt.composedPath()

    // close dropdowns on a click outside them
    document.querySelectorAll('.bt-dropdown.open').forEach((e) => {
      if (!path.includes(e))
        e.classList.remove('open')
    })

    // hide the nav panel on a click outside it, or on a link in it
    const pnl = document.querySelector('#navPanel')
    if (pnl && document.body.classList.contains('is-navPanel-visible')) {
      const link = path.find((e) => e.matches?.('a[href]:not(.bt-dropper):not(.close)'))
      if (!path.includes(pnl) || (link && !link.closest('#theme-menu')))
        document.body.classList.remove('is-navPanel-visible')
    }
  })

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') {
      document.body.classList.remove('is-navPanel-visible')
      document.querySelectorAll('.bt-dropdown.open').forEach((e) => e.classList.remove('open'))
    }
  })

  globalThis.addEventListener('scroll', intro_fade, { passive: true })
  globalThis.addEventListener('resize', intro_fade, { passive: true })
  intro_fade()
}

/**
 * Fades out the big intro, once the main content scrolls well into view.
 * (Massively's `scrollex` settings: main's top 25vh above the bottom of the screen -- or mid-screen on phones)
 */
function intro_fade() {
  const intro = document.querySelector('#intro')
  const main = document.querySelector('#main')
  if (!intro || !main)
    return
  const at = globalThis.innerHeight * (SMALL.matches ? 0.35 : 0.75)
  intro.classList.toggle('hidden', main.getBoundingClientRect().top <= at)
}


/** Returns a post's card, for the grid of posts */
function card(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const href = esc(urlify(post.url))
  return `
<article ${id ? `id="${esc(id)}"` : ''}>
  <header>
    <span class="date">${esc(datetime(post.date))}</span>
    <h2><a href="${href}">${esc(post.title)}</a></h2>
  </header>
  ${img ? `<a href="${href}" class="image fit"><img src="${esc(img)}" alt="${esc(post.featuredalt)}" loading="lazy"></a>` : ''}
  ${summarize_markdown(post.body_raw, cfg.summary_length)}
  <ul class="actions special">
    <li><a href="${href}" class="button">Full Story</a></li>
  </ul>
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
<article class="post featured" ${id ? `id="${esc(id)}"` : ''}>
  <header class="major">
    <span class="date">${esc(datetime(post.date))}</span>
    <h2><a href="${href}">${esc(post.title)}</a></h2>
    ${summarize_markdown(post.body_raw, cfg.summary_length)}
  </header>
  ${img ? `<a href="${href}" class="image main"><img src="${esc(img)}" alt="${esc(post.featuredalt)}"></a>` : ''}
  <ul class="actions special">
    <li><a href="${href}" class="button large">Full Story</a></li>
  </ul>
</article>`
}


customElements.define('bt-posts', class extends HTMLElement {
  connectedCallback() {
    const posts = [...this.querySelectorAll('bt-post')].map((e) => [e.getAttribute('url'), e.id])

    const filtered = state.filter_tag || state.filter_cat
    // newest post gets featured -- on the homepage's first page, when it doesnt have its own content
    const top = !filtered && !state.page && !state.show_top_content && posts.length
      ? featured(...posts.shift())
      : ''

    let title = ''
    if (state.filter_tag)
      title = `Tagged: ${state.filter_tag}`
    else if (state.filter_cat)
      title = `Category: ${state.filter_cat}`

    this.replaceWith(nodes(`
${title ? `<section class="post filtered"><header class="major"><h1>${esc(title)}</h1></header></section>` : ''}
${top}
${posts.length ? `<section class="posts">${posts.map(([url, id]) => card(url, id)).join('')}</section>` : ''}`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(card(this.getAttribute('url'), this.id)))
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    if (post.type === 'homepage') {
      this.replaceWith(nodes(`<section class="post"><div class="post-body">${body}</div></section>`))
      highlight_code()
      return
    }

    const tax = taxonomy(post)
    this.replaceWith(nodes(`
<section class="post">
  <header class="major">
    <span class="date">${esc(datetime(post.date))}${post.author ? ` &middot; ${esc(post.author)}` : ''}</span>
    <h1>${esc(post.title)}</h1>
  </header>
  ${post.featured ? `<div class="image main"><img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt)}"></div>` : ''}
  <div class="post-body">${body}</div>
  ${tax ? `<hr><p class="post-tags">${tax}</p>` : ''}
  ${comments(post)}
</section>`))

    highlight_code()
  }
})


customElements.define('bt-histogram', class extends HTMLElement {
  connectedCallback() {
    const type = state.list_tags ? 'tags' : 'categories'
    const histogram = JSON.parse(this.getAttribute('histogram') || '{}')
    this.replaceWith(nodes(`
<section class="post histogram">
  <header class="major"><h1>${type}</h1></header>
  <ul class="alt">${histogram_items(type, histogram)}</ul>
</section>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
<section class="post">
  <header class="major"><h1>Contact</h1></header>
  ${contact_form()}
</section>`))
  }
})
