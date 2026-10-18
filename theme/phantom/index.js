/*
  Phantom theme -- a port of https://html5up.net/phantom
  (Free for personal and commercial use under the CCA 3.0 license: html5up.net/license)

  All light DOM, like editorial & massively -- see THEMES.md.  HTML5 UP's original `main.css` styles it, as is.
  `<bt-body>` fills itself w/ the header, slide-out menu & footer -- and moves blogtini's content into `#main`.
  The rest replace themselves w/ plain html, eg: posts => colored `.tiles`.

  The jQuery `main.js` (slide-out menu, auto-growing textarea) is ported to vanilla js, below.
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


// tile summaries are short
const TILE_SUMMARY_LENGTH = 160


/** Returns prior & next buttons: for pages of posts, or a single post's neighbors */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  return `
<ul class="actions fit pager">
  ${pg.left_url ? `<li><a href="${esc(pg.left_url)}" class="button fit icon solid fa-chevron-left">${esc(pg.left_title)}</a></li>` : ''}
  ${pg.rite_url ? `<li><a href="${esc(pg.rite_url)}" class="button fit icon solid fa-chevron-right">${esc(pg.rite_title)}</a></li>` : ''}
</ul>`
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

    // the intro: just on the homepage's first page
    const intro = state.is_homepage && !location.search

    this.innerHTML = `
<div id="wrapper">
  <header id="header">
    <div class="inner">
      <a href="${esc(state.top_page)}" class="logo">
        ${site_img() ? `<span class="symbol"><img src="${esc(site_img())}" alt=""></span>` : ''}<span class="title">${esc(cfg.title)}</span>
      </a>
      <nav>
        <ul>
          <li><a href="#menu">Menu</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <div id="main">
    <div class="inner">
      ${intro
        ? `
      <header>
        <h1>${esc(cfg.title)}</h1>
        ${cfg.intro?.paragraph ? `<p>${cfg.intro.paragraph}</p>` : ''}
      </header>`
        : ''}
    </div>
  </div>

  <footer id="footer">
    <div class="inner">
      ${footer_about(recent)}
      <section>
        <h2>Follow</h2>
        <ul class="icons">${social_icons('style2')}</ul>
        ${footer_categories(categories)}
        ${Object.keys(tags).length
          ? `
        <div class="tagcloud">
          <h2><a href="${esc(state.top_page)}?tags">Tags</a></h2>
          <p>${tag_cloud(tags, 0.8, 1.5)}</p>
        </div>`
          : ''}
      </section>
      <ul class="copyright">
        <li>${copyright('Phantom', 'https://html5up.net/phantom')}</li>
      </ul>
    </div>
  </footer>
</div>

<nav id="menu">
  <div class="inner">
    ${cfg.header.search
      ? `
    <input type="text" id="search-input" placeholder="Search" autocomplete="off">
    <div id="search-results"></div>`
      : ''}
    <h2>Menu</h2>
    <ul>
      ${menu_items()}
      <li><a href="#scheme" class="scheme-toggle"><i class="fas fa-lightbulb"></i> Scheme</a></li>
    </ul>
    ${cfg.header.theme
      ? `
    <h2>Theme</h2>
    <ul id="theme-menu">${theme_items()}</ul>`
      : ''}
  </div>
  <a class="close" href="#menu">Close</a>
</nav>`

    const inner = this.querySelector('#main > .inner')
    inner.append(...content)
    inner.append(nodes(pagination()))

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
    ${cfg.contact?.email_service ? `<li><a href="${esc(state.top_page)}?contact" class="button">Contact</a></li>` : ''}
  </ul>`
    : ''}
  ${cfg.sidebar.post_amount && recent.length
    ? `
  <h2>Recent Posts</h2>
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
<h2><a href="${esc(state.top_page)}?categories">Categories</a></h2>
<ul class="categories alt">
  ${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}
</ul>`
}


/**
 * Vanilla js port of Phantom's jQuery `main.js`: the slide-out menu, and auto-growing textareas.
 */
function setup(btbody) {
  preload()

  if (globalThis.matchMedia('(hover: none)').matches)
    document.body.classList.add('is-touch')

  // Slide-out menu.  (A short lock, so a double tap doesn't open & close it)
  const menu = btbody.querySelector('#menu')
  let locked = false
  const show_menu = (show) => {
    if (locked)
      return
    locked = true
    setTimeout(() => { locked = false }, 350)
    document.body.classList.toggle('is-menu-visible', show)
  }

  btbody.querySelectorAll('a[href="#menu"]').forEach((e) => e.addEventListener('click', (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    show_menu(!document.body.classList.contains('is-menu-visible'))
  }))

  // (clicks in the menu bubble on up -- blogtini's theme picker listens on the document.
  //  The page-wide listener below just doesn't close the menu for them)
  menu.addEventListener('click', (evt) => {
    const link = evt.target.closest('a[href]')
    if (!link || link.getAttribute('href') === '#menu')
      return

    // theme picker: blogtini handles it (& re-renders the page) -- so just close the menu
    if (link.closest('#theme-menu')) {
      document.body.classList.remove('is-menu-visible')
      return
    }
    // scheme: `scheme_toggles()` handles it
    if (link.matches('.scheme-toggle'))
      return

    // other links: slide the menu shut, then go
    evt.preventDefault()
    show_menu(false)
    setTimeout(() => { globalThis.location.href = link.href }, 350)
  })

  // Auto-growing textareas (eg: contact form).
  btbody.querySelectorAll('textarea').forEach(autogrow)

  // Page-wide listeners: once (a theme switch re-renders us)
  if (globalThis.bt_phantom_listening)
    return
  globalThis.bt_phantom_listening = true

  document.addEventListener('click', (evt) => {
    if (!evt.composedPath().some((e) => e.id === 'menu'))
      document.body.classList.remove('is-menu-visible')
  })
  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape')
      document.body.classList.remove('is-menu-visible')
  })
}

/** Grows a textarea to fit what's typed in it.  (Ctrl+Enter leaves it) */
function autogrow(textarea) {
  /* eslint-disable no-param-reassign */
  textarea.rows = 1
  textarea.style.overflow = 'hidden'
  textarea.style.resize = 'none'
  const grow = () => {
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }
  /* eslint-enable no-param-reassign */
  textarea.addEventListener('input', grow)
  textarea.addEventListener('focus', grow)
  textarea.addEventListener('keydown', (evt) => {
    if (evt.key === 'Enter' && evt.ctrlKey) {
      evt.preventDefault()
      textarea.blur()
    }
  })
  if (textarea.isConnected)
    grow()
}


/** Returns a post's colored tile */
function tile(url, id, idx) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const summary = summarize_markdown(post.body_raw, TILE_SUMMARY_LENGTH).replace(/<[^>]+>/g, '')
  return `
<article class="style${1 + (idx % 6)}" ${id ? `id="${esc(id)}"` : ''}>
  <span class="image">
    ${img ? `<img src="${esc(img)}" alt="${esc(post.featuredalt)}" loading="lazy">` : ''}
  </span>
  <a href="${esc(urlify(post.url))}">
    <h2>${esc(post.title)}</h2>
    <div class="content">
      <p>${summary}</p>
    </div>
  </a>
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
    else if (state.page)
      title = `Posts, page ${state.page + 1}`

    this.replaceWith(nodes(`
${title ? `<header><h1>${esc(title)}</h1></header>` : ''}
<section class="tiles">
  ${posts.map(([url, id], idx) => tile(url, id, idx)).join('')}
</section>`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(tile(this.getAttribute('url'), this.id, 0)))
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    if (post.type === 'homepage') {
      this.replaceWith(nodes(`<section class="post-body">${body}</section>`))
      highlight_code()
      return
    }

    const tax = taxonomy(post)
    this.replaceWith(nodes(`
<section>
  <h1>${esc(post.title)}</h1>
  <p class="date">${esc(datetime(post.date))}${post.author ? ` &middot; ${esc(post.author)}` : ''}</p>
  ${post.featured ? `<span class="image main"><img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt)}"></span>` : ''}
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
<section class="histogram">
  <h1>${type}</h1>
  <ul class="alt">${histogram_items(type, histogram)}</ul>
</section>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    const section = nodes(`
<section>
  <h1>Contact</h1>
  ${contact_form()}
</section>`).firstElementChild
    this.replaceWith(section)
    section.querySelectorAll('textarea').forEach(autogrow)
  }
})
