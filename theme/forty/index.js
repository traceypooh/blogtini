/*
  Forty theme -- a port of https://html5up.net/forty
  (Free for personal and commercial use under the CCA 3.0 license: html5up.net/license)

  All light DOM, like the other HTML5 UP ports -- see THEMES.md.  HTML5 UP's original `main.css` styles it, as is.
  `<bt-body>` fills itself w/ the header, banner, menu, contact area & footer -- and moves blogtini's content
  into `#main`.  The rest replace themselves w/ plain html, eg: posts => image `.tiles`.

  The jQuery `main.js` (tiles, header over the banner, menu overlay, smooth scroll) is ported to vanilla js, below.
  (Its banner parallax is left out: the banner background stays fixed, as the original does on phones.)
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
const TILE_SUMMARY_LENGTH = 120


/** Returns prior & next buttons: for pages of posts, or a single post's neighbors */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  return `
<section id="two">
  <div class="inner">
    <ul class="actions">
      ${pg.left_url ? `<li><a href="${esc(pg.left_url)}" class="button icon solid fa-chevron-left">${esc(pg.left_title)}</a></li>` : ''}
      ${pg.rite_url ? `<li><a href="${esc(pg.rite_url)}" class="button next">${esc(pg.rite_title)}</a></li>` : ''}
    </ul>
  </div>
</section>`
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

    // the big banner: just on the homepage's first page
    const banner = state.is_homepage && !location.search

    this.innerHTML = `
<div id="wrapper">
  <header id="header" ${banner ? 'class="alt"' : ''}>
    <a href="${esc(state.top_page)}" class="logo"><strong>${esc(cfg.title)}</strong></a>
    <nav>
      <a href="#menu">Menu</a>
    </nav>
  </header>

  ${banner
    ? `
  <section id="banner" class="major">
    <div class="inner">
      <header class="major">
        <h1>${esc(cfg.title)}</h1>
      </header>
      <div class="content">
        ${cfg.intro?.paragraph ? `<p>${cfg.intro.paragraph}</p>` : ''}
        <ul class="actions">
          <li><a href="#main" class="button next scrolly">Get Started</a></li>
        </ul>
      </div>
    </div>
  </section>`
    : ''}

  <div id="main" ${banner ? '' : 'class="alt"'}></div>

  <section id="contact">
    <div class="inner">
      ${contact_about()}
      <section class="split">
        ${contact_recent(recent)}
        ${contact_categories(categories)}
        ${Object.keys(tags).length
          ? `
        <section>
          <div class="contact-method tagcloud">
            <span class="icon solid alt fa-tag"></span>
            <h3><a href="${esc(state.top_page)}?tags">Tags</a></h3>
            <p>${tag_cloud(tags, 0.75, 1.3)}</p>
          </div>
        </section>`
          : ''}
      </section>
    </div>
  </section>

  <footer id="footer">
    <div class="inner">
      ${cfg.footer?.social || cfg.intro?.social ? `<ul class="icons">${social_icons('alt')}</ul>` : ''}
      <ul class="copyright">
        <li>${copyright('Forty', 'https://html5up.net/forty')}</li>
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
    <ul class="links">
      ${menu_items()}
      <li><a href="#scheme" class="scheme-toggle">Scheme</a></li>
    </ul>
    ${cfg.header.theme
      ? `
    <h2 class="theme-heading">Theme</h2>
    <ul class="links" id="theme-menu">${theme_items()}</ul>`
      : ''}
  </div>
  <a class="close" href="#menu">Close</a>
</nav>`

    const main = this.querySelector('#main')
    main.append(...content)
    main.append(nodes(pagination()))

    scheme_toggles(this)
    setup(this)

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }
})


function contact_about() {
  return `
<section>
  ${site_img() ? `<p><a href="${esc(state.top_page)}"><img class="site-img" src="${esc(site_img())}" alt=""></a></p>` : ''}
  ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
  <ul class="actions">
    <li><a href="${esc(state.top_dir)}about" class="button">Learn More</a></li>
    ${cfg.contact?.email_service ? `<li><a href="${esc(state.top_page)}?contact" class="button primary">Contact</a></li>` : ''}
  </ul>
</section>`
}

function contact_recent(recent) {
  if (!cfg.sidebar.post_amount || !recent.length)
    return ''
  return `
<section>
  <div class="contact-method">
    <span class="icon solid alt fa-pen"></span>
    <h3>Recent Posts</h3>
    <ul>
      ${recent.map((url) => {
        const post = url2post(urlify(url))
        return post ? `<li><a href="${esc(urlify(post.url))}">${esc(post.title)}</a></li>` : ''
      }).join('')}
    </ul>
  </div>
</section>`
}

function contact_categories(categories) {
  if (!cfg.sidebar.categories || !Object.keys(categories).length)
    return ''
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  return `
<section>
  <div class="contact-method">
    <span class="icon solid alt fa-folder"></span>
    <h3><a href="${esc(state.top_page)}?categories">Categories</a></h3>
    <ul>
      ${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}
    </ul>
  </div>
</section>`
}


/**
 * Vanilla js port of Forty's jQuery `main.js`:
 * header over the banner, smooth scroll, menu overlay.  (The tiles are set up as they render, in `tiles_setup()`)
 */
function setup(btbody) {
  preload()

  const header = btbody.querySelector('#header')

  // Smooth scroll links (to just under the fixed header).
  btbody.querySelectorAll('.scrolly').forEach((e) => e.addEventListener('click', (evt) => {
    evt.preventDefault()
    const target = btbody.querySelector(e.hash)
    if (target)
      globalThis.scrollTo({ top: target.offsetTop - header.offsetHeight + 2, behavior: 'smooth' })
  }))

  // Header: see-through over the banner, then solid ("reveal") once past it.
  const banner = btbody.querySelector('#banner')
  if (banner && header.classList.contains('alt')) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('alt', entry.isIntersecting)
      if (!entry.isIntersecting)
        header.classList.add('reveal')
    }, { rootMargin: `-${header.offsetHeight + 10}px 0px 0px 0px` }).observe(banner)
  }

  // Menu overlay.  (A short lock, so a double tap doesn't open & close it)
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

  // (clicks in the menu bubble on up -- blogtini's theme picker listens on the document)
  menu.addEventListener('click', (evt) => {
    const link = evt.target.closest('a[href]')
    if (!link) {
      // a click on the dimmed area around the menu's links closes it
      if (!evt.target.closest('.inner'))
        show_menu(false)
      return
    }
    if (link.getAttribute('href') === '#menu')
      return

    // theme picker: blogtini handles it (& re-renders the page) -- so just close the menu
    if (link.closest('#theme-menu')) {
      document.body.classList.remove('is-menu-visible')
      return
    }
    // scheme: `scheme_toggles()` handles it
    if (link.matches('.scheme-toggle'))
      return

    // other links: close the menu, then go
    evt.preventDefault()
    show_menu(false)
    setTimeout(() => { globalThis.location.href = link.href }, 250)
  })

  // Page-wide listeners: once (a theme switch re-renders us)
  if (globalThis.bt_forty_listening)
    return
  globalThis.bt_forty_listening = true

  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape')
      document.body.classList.remove('is-menu-visible')
  })

  // back from a tile's "transitioning" click (eg: the browser's back button, w/ the page cached)
  globalThis.addEventListener('pageshow', () => {
    document.querySelectorAll('.is-transitioning').forEach((e) => e.classList.remove('is-transitioning'))
  })
}

/**
 * Forty's tiles: the image becomes the tile's background, the whole tile is a link,
 * and a click fades the page out before going.
 */
function tiles_setup(tiles) {
  tiles.querySelectorAll(':scope > article').forEach((article) => {
    const img = article.querySelector('.image img')
    if (img) {
      // eslint-disable-next-line no-param-reassign
      article.style.backgroundImage = `url("${img.getAttribute('src')}")`
      // eslint-disable-next-line no-param-reassign
      article.querySelector('.image').style.display = 'none'
    }

    const link = article.querySelector('.link')
    if (!link)
      return
    const cover = link.cloneNode()
    cover.classList.add('primary')
    cover.setAttribute('aria-hidden', 'true')
    cover.tabIndex = -1
    article.appendChild(cover)

    for (const a of [link, cover]) {
      a.addEventListener('click', (evt) => {
        evt.preventDefault()
        evt.stopPropagation()
        article.classList.add('is-transitioning')
        document.querySelector('#wrapper')?.classList.add('is-transitioning')
        setTimeout(() => { globalThis.location.href = link.href }, 500)
      })
    }
  })
}


/** Returns a post's image tile */
function tile(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const summary = summarize_markdown(post.body_raw, TILE_SUMMARY_LENGTH).replace(/<[^>]+>/g, '')
  return `
<article ${id ? `id="${esc(id)}"` : ''}>
  <span class="image">
    ${img ? `<img src="${esc(img)}" alt="${esc(post.featuredalt)}">` : ''}
  </span>
  <header class="major">
    <h3><a href="${esc(urlify(post.url))}" class="link">${esc(post.title)}</a></h3>
    <p>${summary}</p>
  </header>
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

    const frag = nodes(`
${title ? `<section><div class="inner"><header class="major"><h1>${esc(title)}</h1></header></div></section>` : ''}
<section id="one" class="tiles">
  ${posts.map(([url, id]) => tile(url, id)).join('')}
</section>`)
    tiles_setup(frag.querySelector('.tiles'))
    this.replaceWith(frag)
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    const frag = nodes(`<section class="tiles">${tile(this.getAttribute('url'), this.id)}</section>`)
    tiles_setup(frag.firstElementChild)
    this.replaceWith(frag)
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    if (post.type === 'homepage') {
      this.replaceWith(nodes(`<section><div class="inner post-body">${body}</div></section>`))
      highlight_code()
      return
    }

    const tax = taxonomy(post)
    this.replaceWith(nodes(`
<section id="one">
  <div class="inner">
    <header class="major">
      <h1>${esc(post.title)}</h1>
    </header>
    <p class="date">${esc(datetime(post.date))}${post.author ? ` &middot; ${esc(post.author)}` : ''}</p>
    ${post.featured ? `<span class="image main"><img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt)}"></span>` : ''}
    <div class="post-body">${body}</div>
    ${tax ? `<hr><p class="post-tags">${tax}</p>` : ''}
    ${comments(post)}
  </div>
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
  <div class="inner">
    <header class="major"><h1>${type}</h1></header>
    <ul class="alt">${histogram_items(type, histogram)}</ul>
  </div>
</section>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
<section>
  <div class="inner">
    <header class="major"><h1>Contact</h1></header>
    ${contact_form()}
  </div>
</section>`))
  }
})
