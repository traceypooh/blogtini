/*
  Strata theme -- a port of https://html5up.net/strata
  (Free for personal and commercial use under the CCA 3.0 license: html5up.net/license)

  All light DOM, like the other HTML5 UP ports -- see THEMES.md.  HTML5 UP's original `main.css` styles it, as is.
  `<bt-body>` fills itself w/ the fixed left `#header` (avatar, intro, our nav, footer) & `#main` --
  and moves blogtini's content into `#main`.  The rest replace themselves w/ plain html, eg: posts => "work items".

  The jQuery `main.js` (footer moves below `#main` on narrower screens, left panel parallax)
  is ported to vanilla js, below.  (Its image lightbox isn't -- post thumbnails link to their posts.)
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


// footer moves from the left panel to below `#main`, at or below this width
const MEDIUM = globalThis.matchMedia('(max-width: 980px)')
const TOUCH = globalThis.matchMedia('(hover: none)')


/** Returns prior & next buttons: for pages of posts, or a single post's neighbors */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  return `
<section class="pager">
  <ul class="actions">
    ${pg.left_url ? `<li><a href="${esc(pg.left_url)}" class="button icon solid fa-chevron-left">${esc(pg.left_title)}</a></li>` : ''}
    ${pg.rite_url ? `<li><a href="${esc(pg.rite_url)}" class="button icon solid fa-chevron-right">${esc(pg.rite_title)}</a></li>` : ''}
  </ul>
</section>`
}


customElements.define('bt-body', class extends HTMLElement {
  connectedCallback() {
    if (this.rendered)
      return
    this.rendered = true

    // blogtini's main content -- eg: `<bt-posts>`.  (minus any `<hr>`: sections have borders already)
    const content = [...this.childNodes].filter((e) => e.nodeName !== 'HR')

    const categories = JSON.parse(this.getAttribute('categories') || '{}')
    const tags = JSON.parse(this.getAttribute('tags') || '{}')

    this.innerHTML = `
<header id="header">
  <div class="inner">
    ${site_img() ? `<a href="${esc(state.top_page)}" class="image avatar"><img src="${esc(site_img())}" alt=""></a>` : ''}
    <h1><a href="${esc(state.top_page)}"><strong>${esc(cfg.title)}</strong></a></h1>
    ${cfg.intro?.paragraph ? `<p class="intro">${cfg.intro.paragraph}</p>` : ''}

    <nav id="nav">
      <ul>
        ${menu_items()}
        <li><a href="#scheme" class="scheme-toggle"><i class="fas fa-lightbulb"></i> Scheme</a></li>
      </ul>
      ${cfg.header.search
        ? `
      <input type="text" id="search-input" placeholder="Search" autocomplete="off">
      <div id="search-results"></div>`
        : ''}
      ${cfg.header.theme
        ? `
      <h3>Theme</h3>
      <ul id="theme-menu">${theme_items()}</ul>`
        : ''}
    </nav>
  </div>

  <footer id="footer">
    <div class="inner">
      ${cfg.footer?.social || cfg.intro?.social ? `<ul class="icons">${social_icons()}</ul>` : ''}
      <ul class="copyright">
        <li>${copyright('Strata', 'https://html5up.net/strata')}</li>
      </ul>
    </div>
  </footer>
</header>

<div id="main"></div>`

    const main = this.querySelector('#main')
    main.append(...content)
    main.append(nodes(pagination()))
    main.append(nodes(about(categories, tags)))

    scheme_toggles(this)
    setup(this)

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }
})


/** Returns the bottom "about" section: like Strata's "Get In Touch" -- text | labeled icons */
function about(categories, tags) {
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  return `
<section id="three">
  <h2>About</h2>
  <div class="row">
    <div class="col-8 col-12-small">
      ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
      <ul class="actions">
        <li><a href="${esc(state.top_dir)}about" class="button">Learn More</a></li>
        ${cfg.contact?.email_service ? `<li><a href="${esc(state.top_page)}?contact" class="button">Contact</a></li>` : ''}
      </ul>
    </div>
    <div class="col-4 col-12-small">
      <ul class="labeled-icons">
        ${cfg.sidebar.categories && entries.length
          ? `
        <li>
          <h3 class="icon solid fa-folder"><span class="label">Categories</span></h3>
          <a href="${esc(state.top_page)}?categories"><strong>Categories</strong></a><br>
          ${entries.map(([cat, cnt]) => `<a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span>`).join('<br>')}
        </li>`
          : ''}
        ${Object.keys(tags).length
          ? `
        <li class="tagcloud">
          <h3 class="icon solid fa-tag"><span class="label">Tags</span></h3>
          <a href="${esc(state.top_page)}?tags"><strong>Tags</strong></a><br>
          ${tag_cloud(tags, 0.75, 1.3)}
        </li>`
          : ''}
      </ul>
    </div>
  </div>
</section>`
}


/**
 * Vanilla js port of Strata's jQuery `main.js`: footer placement, left panel parallax.
 */
function setup(btbody) {
  preload()

  const header = btbody.querySelector('#header')
  const footer = btbody.querySelector('#footer')
  const main = btbody.querySelector('#main')

  // Footer: in the left panel -- or below `#main`, on narrower screens.
  const place_footer = () => {
    if (MEDIUM.matches)
      main.after(footer)
    else
      header.append(footer)
  }
  place_footer()

  btbody.querySelector('#nav')?.addEventListener('submit', (evt) => evt.preventDefault())

  // (so the page-wide listeners below act on the *current* page)
  globalThis.bt_strata_place_footer = place_footer

  // Page-wide listeners: once (a theme switch re-renders us)
  if (globalThis.bt_strata_listening) {
    parallax()
    return
  }
  globalThis.bt_strata_listening = true

  MEDIUM.addEventListener('change', () => {
    globalThis.bt_strata_place_footer()
    parallax()
  })
  globalThis.addEventListener('scroll', parallax, { passive: true })
  parallax()
}

/** The left panel's background drifts up a bit as you scroll (wide screens, not touch) */
function parallax() {
  const header = document.querySelector('#header')
  if (!header?.closest('bt-body'))
    return
  if (MEDIUM.matches || TOUCH.matches) {
    header.style.backgroundPosition = ''
    return
  }
  header.style.backgroundPosition = `left 0px, left ${-1 * (globalThis.scrollY / 20)}px`
}


/** Returns a post's "work item", for the grid of posts */
function work_item(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const href = esc(urlify(post.url))
  return `
<article class="col-6 col-12-xsmall work-item" ${id ? `id="${esc(id)}"` : ''}>
  ${img ? `<a href="${href}" class="image fit thumb"><img src="${esc(img)}" alt="${esc(post.featuredalt)}" loading="lazy"></a>` : ''}
  <h3><a href="${href}">${esc(post.title)}</a></h3>
  <p class="date">${esc(datetime(post.date))}</p>
  ${summarize_markdown(post.body_raw, cfg.summary_length)}
</article>`
}

/** Returns the top section, for the newest post on the homepage */
function newest(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const href = esc(urlify(post.url))
  return `
<section ${id ? `id="${esc(id)}"` : ''}>
  <header class="major">
    <h2><a href="${href}">${esc(post.title)}</a></h2>
  </header>
  <p class="date">${esc(datetime(post.date))}</p>
  ${img ? `<a href="${href}" class="image fit"><img src="${esc(img)}" alt="${esc(post.featuredalt)}"></a>` : ''}
  ${summarize_markdown(post.body_raw, cfg.summary_length)}
  <ul class="actions">
    <li><a href="${href}" class="button">Read More</a></li>
  </ul>
</section>`
}


customElements.define('bt-posts', class extends HTMLElement {
  connectedCallback() {
    const posts = [...this.querySelectorAll('bt-post')].map((e) => [e.getAttribute('url'), e.id])

    const filtered = state.filter_tag || state.filter_cat
    // newest post gets the top section -- on the homepage's first page, when it doesnt have its own content
    const top = !filtered && !state.page && !state.show_top_content && posts.length
      ? newest(...posts.shift())
      : ''

    let title = 'Recent Posts'
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
<section id="two">
  <h2>${esc(title)}</h2>
  <div class="row">
    ${posts.map(([url, id]) => work_item(url, id)).join('')}
  </div>
</section>`
  : ''}`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`<section><div class="row">${work_item(this.getAttribute('url'), this.id)}</div></section>`))
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
<section id="one">
  <header class="major">
    <h2>${esc(post.title)}</h2>
  </header>
  <p class="date">${esc(datetime(post.date))}${post.author ? ` &middot; ${esc(post.author)}` : ''}</p>
  ${post.featured ? `<span class="image fit"><img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt)}"></span>` : ''}
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
  <h2>${type}</h2>
  <ul class="alt">${histogram_items(type, histogram)}</ul>
</section>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
<section>
  <h2>Contact</h2>
  ${contact_form()}
</section>`))
  }
})
