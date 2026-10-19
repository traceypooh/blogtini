/*
  Strongly Typed theme -- a port of https://html5up.net/strongly-typed
  (Free for personal and commercial use under the CCA 3.0 license: html5up.net/license)

  All light DOM, like the other HTML5 UP ports -- see THEMES.md.  HTML5 UP's original `main.css` styles it, as is.
  `<bt-body>` fills itself w/ the header & nav, `#main` (content & sidebar), and footer -- and moves blogtini's
  content into `#content`.  The homepage's features & banner go above `#main` (see `<bt-posts>`).
  The sidebar goes left, right, or none: `config.yml` `sidebar: { position: left | right | none }`.

  The jQuery `main.js` (nav dropdowns, phone width title bar & nav panel) is ported to vanilla js,
  in `../html5up/shared.js`.
*/

import {
  cfg, state, url2post, urlify, summarize_markdown, markdown_to_html, datetime, imgurl, reveal,
} from '../../index.js'
import { vrsort } from '../../js/text.js'
import {
  esc, nodes, post_img, site_img, navurl, theme_items, scheme_toggles, copyright,
  social_list, pager, comments, taxonomy, highlight_code, histogram_items, tag_cloud,
  contact_form, preload, dropdowns, nav_panel, nav_panel_links,
} from '../html5up/shared.js'


// the sidebar's side, unless `config.yml` `sidebar: { position: left | right | none }` pins it.
// (Strongly Typed's own homepage has it on the right)
const SIDEBAR_POSITION = 'right'

const FEATURES = 3 // newest posts as the homepage's "features"
const SHORT_SUMMARY = 160


/** Returns a `config.yml` menu item's Font Awesome icon, as Strongly Typed's nav wants, eg: 'icon solid fa-home' */
function nav_icon(pre) {
  const icon = (pre ?? '').match(/\b(fa-(?!solid|regular|brands)[\w-]+)/)?.[1] ?? 'fa-file'
  const style = (pre ?? '').match(/\b(fab|fa-brands)\b/)
    ? 'brands'
    : ((pre ?? '').match(/\b(far|fa-regular)\b/) ? '' : 'solid')
  return `icon ${style} ${icon}`
}

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

    // blogtini's main content -- eg: `<bt-posts>`.  (minus any `<hr>`)
    const content = [...this.childNodes].filter((e) => e.nodeName !== 'HR')

    const recent = JSON.parse(this.getAttribute('recent_posts') || '[]')
    const categories = JSON.parse(this.getAttribute('categories') || '{}')
    const tags = JSON.parse(this.getAttribute('tags') || '{}')

    // content & sidebar: sidebar left, right, or none
    const position = cfg.sidebar.position ?? SIDEBAR_POSITION
    const main = `<div id="content" class="${position === 'none' ? 'col-12' : 'col-8 col-12-medium'}"></div>`
    const side = position === 'none' ? '' : `<div id="sidebar" class="col-4 col-12-medium">${sidebar(recent, categories, tags)}</div>`
    if (position === 'none')
      document.body.classList.add('no-sidebar')
    else
      document.body.classList.remove('no-sidebar')

    this.innerHTML = `
<div id="page-wrapper">
  <section id="header">
    <div class="container">
      <h1 id="logo"><a href="${esc(state.top_page)}">${esc(cfg.title)}</a></h1>
      ${cfg.intro?.paragraph ? `<p>${cfg.intro.paragraph}</p>` : ''}

      <nav id="nav">
        <ul>
          ${(cfg.menu?.main ?? []).map((e) => `<li><a class="${nav_icon(e.pre)}" href="${esc(navurl(e.url))}"><span>${esc(e.name)}</span></a></li>`).join('')}
          ${cfg.header.theme
            ? `
          <li>
            <a href="#theme-menu" class="icon solid fa-palette"><span>Theme</span></a>
            <ul class="dropotron" id="theme-menu">${theme_items()}</ul>
          </li>`
            : ''}
          ${cfg.header.search
            ? `
          <li>
            <a href="#search" class="icon solid fa-search"><span>Search</span></a>
            <div class="dropotron bt-search" id="search">
              <input type="text" id="search-input" placeholder="Search" autocomplete="off">
              <div id="search-results"></div>
            </div>
          </li>`
            : ''}
          <li><a href="#scheme" class="icon solid fa-lightbulb scheme-toggle"><span>Scheme</span></a></li>
        </ul>
      </nav>
    </div>
  </section>

  <div id="bt-top"></div>

  <section id="main">
    <div class="container">
      <div class="row">
        ${position === 'left' ? side + main : main + side}
      </div>
    </div>
  </section>

  <section id="footer">
    <div class="container">
      <header><h2>${cfg.contact?.email_service ? `Questions or comments? <strong><a href="${esc(state.top_page)}?contact">Get in touch</a></strong>` : `<strong>${esc(cfg.title)}</strong>`}</h2></header>
      <div class="row">
        <div class="col-6 col-12-medium">
          <section>
            ${site_img() ? `<p><img src="${esc(site_img())}" alt="" style="max-width: 6em; border-radius: 100%"></p>` : ''}
            ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
            <ul class="actions">
              <li><a href="${esc(state.top_dir)}about" class="button icon solid fa-file">Learn More</a></li>
              ${cfg.contact?.email_service ? `<li><a href="${esc(state.top_page)}?contact" class="button icon solid fa-envelope">Contact</a></li>` : ''}
            </ul>
          </section>
        </div>
        <div class="col-6 col-12-medium">
          <section>
            ${footer_socials()}
          </section>
        </div>
      </div>
    </div>
    <div id="copyright" class="container">
      <ul class="links">
        <li>${copyright('Strongly Typed', 'https://html5up.net/strongly-typed')}</li>
      </ul>
    </div>
  </section>
</div>

<div id="titleBar"><a href="#navPanel" class="toggle"></a></div>
<div id="navPanel"><nav>${nav_panel_links()}</nav></div>`

    const box = this.querySelector('#content')
    box.append(...content)
    box.append(nodes(pagination()))

    scheme_toggles(this)
    preload()
    dropdowns(this)
    nav_panel(this.querySelector('#titleBar .toggle'))

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }
})


/** Returns the footer's social links, Strongly Typed style: icon & handle, in 2 columns */
function footer_socials() {
  const links = social_list()
  if (!links.length)
    return ''
  const half = Math.ceil(links.length / 2)
  const col = (list) => `
<div class="col-6 col-12-small">
  <ul class="icons">
    ${list.map((e) => `<li class="icon ${e.cls}"><a href="${esc(e.href)}" ${e.rel ? `target="_blank" rel="${e.rel}"` : ''}>${esc(e.title)}</a></li>`).join('')}
  </ul>
</div>`
  return `<div class="row">${col(links.slice(0, half))}${col(links.slice(half))}</div>`
}


/** Returns the sidebar: recent posts (excerpts), then highlights: about, categories, tags */
function sidebar(recent, categories, tags) {
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  return `
${cfg.sidebar.post_amount && recent.length
  ? `
<section>
  <ul class="divided">
    ${recent.map((url) => {
      const post = url2post(urlify(url))
      return post
        ? `
    <li>
      <article class="box excerpt">
        <header>
          <span class="date">${esc(datetime(post.date))}</span>
          <h3><a href="${esc(urlify(post.url))}">${esc(post.title)}</a></h3>
        </header>
        <p>${summarize_markdown(post.body_raw, SHORT_SUMMARY).replace(/<[^>]+>/g, '')}</p>
      </article>
    </li>`
        : ''
    }).join('')}
  </ul>
</section>`
  : ''}
<section>
  <ul class="divided">
    <li>
      <article class="box highlight">
        <header><h3><a href="${esc(state.top_dir)}about">About</a></h3></header>
        ${site_img() ? `<a href="${esc(state.top_dir)}about" class="image left"><img src="${esc(site_img())}" alt=""></a>` : ''}
        ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
        <ul class="actions">
          <li><a href="${esc(state.top_dir)}about" class="button icon solid fa-file">Learn More</a></li>
        </ul>
      </article>
    </li>
    ${cfg.sidebar.categories && entries.length
      ? `
    <li>
      <article class="box highlight">
        <header><h3><a href="${esc(state.top_page)}?categories">Categories</a></h3></header>
        <ul class="categories">
          ${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}
        </ul>
      </article>
    </li>`
      : ''}
    ${Object.keys(tags).length
      ? `
    <li>
      <article class="box highlight tagcloud">
        <header><h3><a href="${esc(state.top_page)}?tags">Tags</a></h3></header>
        <p>${tag_cloud(tags, 0.8, 1.4)}</p>
      </article>
    </li>`
      : ''}
  </ul>
</section>`
}


/** Returns a post, for the list of posts */
function post_box(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const href = esc(urlify(post.url))
  return `
<article class="box post" ${id ? `id="${esc(id)}"` : ''}>
  <header>
    <span class="date">${esc(datetime(post.date))}</span>
    <h2><a href="${href}">${esc(post.title)}</a></h2>
  </header>
  ${img ? `<a href="${href}" class="image featured"><img src="${esc(img)}" alt="${esc(post.featuredalt)}" loading="lazy"></a>` : ''}
  ${summarize_markdown(post.body_raw, cfg.summary_length)}
  <ul class="actions">
    <li><a href="${href}" class="button icon solid fa-file">Continue Reading</a></li>
  </ul>
</article>`
}

/** Returns a homepage "feature": one of the newest posts */
function feature(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const href = esc(urlify(post.url))
  return `
<div class="col-4 col-6-medium col-12-small" ${id ? `id="${esc(id)}"` : ''}>
  <section>
    ${img ? `<a href="${href}" class="image featured"><img src="${esc(img)}" alt="${esc(post.featuredalt)}"></a>` : ''}
    <header><h3><a href="${href}">${esc(post.title)}</a></h3></header>
    <p>${summarize_markdown(post.body_raw, SHORT_SUMMARY).replace(/<[^>]+>/g, '')}</p>
  </section>
</div>`
}


customElements.define('bt-posts', class extends HTMLElement {
  connectedCallback() {
    const posts = [...this.querySelectorAll('bt-post')].map((e) => [e.getAttribute('url'), e.id])

    // newest posts are the "features", plus a banner -- on the homepage's first page, w/o its own content
    const filtered = state.filter_tag || state.filter_cat
    const top = !filtered && !state.page && !state.show_top_content
    const features = top ? posts.splice(0, FEATURES) : []
    if (features.length) {
      document.querySelector('#bt-top')?.replaceWith(nodes(`
<section id="features">
  <div class="container">
    <header><h2>Latest from <strong>${esc(cfg.title)}</strong></h2></header>
    <div class="row aln-center">
      ${features.map(([url, id]) => feature(url, id)).join('')}
    </div>
  </div>
</section>
${cfg.sidebar.about ? `<section id="banner"><div class="container"><p>${cfg.sidebar.about}</p></div></section>` : ''}`))
    }

    let title = ''
    if (state.filter_tag)
      title = `Tagged: <strong>${esc(state.filter_tag)}</strong>`
    else if (state.filter_cat)
      title = `Category: <strong>${esc(state.filter_cat)}</strong>`
    else if (state.page)
      title = `Posts, page <strong>${state.page + 1}</strong>`

    this.replaceWith(nodes(`
${title ? `<section><header><h2>${title}</h2></header></section>` : ''}
${posts.map(([url, id]) => post_box(url, id)).join('')}`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(post_box(this.getAttribute('url'), this.id)))
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    if (post.type === 'homepage') {
      this.replaceWith(nodes(`<article class="box post post-body">${body}</article>`))
      highlight_code()
      return
    }

    const tax = taxonomy(post)
    this.replaceWith(nodes(`
<article class="box post">
  <header>
    <span class="date">${esc(datetime(post.date))}${post.author ? ` &middot; ${esc(post.author)}` : ''}</span>
    <h2>${esc(post.title)}</h2>
  </header>
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
  <ul class="divided">${histogram_items(type, histogram)}</ul>
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
