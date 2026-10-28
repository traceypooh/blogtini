/*
  Hyperspace theme -- a port of https://html5up.net/hyperspace
  (Free for personal and commercial use under the CCA 3.0 license: html5up.net/license)

  All light DOM, like the other HTML5 UP ports -- see THEMES.md.  HTML5 UP's original `main.css` styles it, as is.
  Two layouts, like the original's two pages:
  - homepage (first page): the fixed left `#sidebar` (links to this page's sections, which light up as you scroll)
    & full screen `#intro`, then every post as a "spotlight" row (its image, title, summary)
  - every other page: the original's "generic" page -- `#header` (title & nav) on top
  Both end w/ an "Explore" section (search, categories, tags, theme picker) & an "About" section.
  `<bt-body>` writes those & moves blogtini's content into `#wrapper`; the rest replace themselves w/ plain html.

  The jQuery `main.js` (scrollex: sections & spotlights fade in, sidebar link of the section in view lights up;
  scrolly: smooth scrolling) is ported to vanilla js, below -- w/ `IntersectionObserver`.
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


// the sidebar becomes a top bar at or below this width (& is hidden at or below 736px)
const LARGE = globalThis.matchMedia('(max-width: 1280px)')
const SMALL = globalThis.matchMedia('(max-width: 736px)')


/** Is this the homepage's first page?  (=> the sidebar layout) */
function is_home() {
  return state.is_homepage && !location.search
}


/** Returns prior & next buttons: for pages of posts, or a single post's neighbors */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  return `
<section class="wrapper style1-alt pager">
  <div class="inner">
    <ul class="actions">
      ${pg.left_url ? `<li><a href="${esc(pg.left_url)}" class="button icon solid fa-chevron-left">${esc(pg.left_title)}</a></li>` : ''}
      ${pg.rite_url ? `<li><a href="${esc(pg.rite_url)}" class="button icon solid fa-chevron-right">${esc(pg.rite_title)}</a></li>` : ''}
    </ul>
  </div>
</section>`
}


customElements.define('bt-body', class extends HTMLElement {
  connectedCallback() {
    if (this.rendered)
      return
    this.rendered = true

    // blogtini's main content -- eg: `<bt-posts>`.  (minus any `<hr>`: sections have their own colors)
    const content = [...this.childNodes].filter((e) => e.nodeName !== 'HR')

    const categories = JSON.parse(this.getAttribute('categories') || '{}')
    const tags = JSON.parse(this.getAttribute('tags') || '{}')

    const scheme = '<li><a href="#scheme" class="scheme-toggle"><i class="fas fa-lightbulb"></i> Scheme</a></li>'

    this.innerHTML = is_home()
      ? `
<section id="sidebar">
  <div class="inner">
    <nav>
      <ul>
        <li><a href="#intro">Welcome</a></li>
        <li><a href="#one">Posts</a></li>
        <li><a href="#explore">Explore</a></li>
        <li><a href="#about">About</a></li>
      </ul>
      <ul class="site-links">
        ${menu_items()}
        ${scheme}
      </ul>
    </nav>
  </div>
</section>

<div id="wrapper">
  <section id="intro" class="wrapper style1 fullscreen fade-up">
    <div class="inner">
      <h1>${esc(cfg.title)}</h1>
      ${cfg.intro?.paragraph ? `<p>${cfg.intro.paragraph}</p>` : ''}
      <ul class="actions">
        <li><a href="#one" class="button scrolly">Read</a></li>
      </ul>
    </div>
  </section>
</div>

<footer id="footer" class="wrapper style1-alt">
  <div class="inner">
    <ul class="menu"><li>${copyright('Hyperspace', 'https://html5up.net/hyperspace')}</li></ul>
  </div>
</footer>`
      : `
<header id="header">
  <a href="${esc(state.top_page)}" class="title">${esc(cfg.title)}</a>
  <nav>
    <ul>
      ${menu_items()}
      ${scheme}
    </ul>
  </nav>
</header>

<div id="wrapper"></div>

<footer id="footer" class="wrapper alt">
  <div class="inner">
    <ul class="menu"><li>${copyright('Hyperspace', 'https://html5up.net/hyperspace')}</li></ul>
  </div>
</footer>`

    const wrapper = this.querySelector('#wrapper')
    wrapper.append(...content)
    wrapper.append(nodes(pagination()))
    wrapper.append(nodes(explore(categories, tags)))
    wrapper.append(nodes(about()))

    scheme_toggles(this)
    this.querySelector('#explore')?.addEventListener('submit', (evt) => evt.preventDefault())

    // the content's elements render right after this -- then wire up the scrolling, & show the page
    requestAnimationFrame(() => {
      setup(this)
      reveal()
    })
  }
})


/** Returns the "Explore" section: search, categories, tags, theme picker -- as Hyperspace "features" */
function explore(categories, tags) {
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  const features = [
    cfg.header.search
      ? `
    <section class="search">
      <span class="icon solid major fa-search"></span>
      <h3>Search</h3>
      <input type="text" id="search-input" placeholder="Search" autocomplete="off">
      <div id="search-results"></div>
    </section>`
      : '',
    cfg.sidebar.categories && entries.length
      ? `
    <section>
      <span class="icon solid major fa-folder"></span>
      <h3><a href="${esc(state.top_page)}?categories">Categories</a></h3>
      <ul class="categories">
        ${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}
      </ul>
    </section>`
      : '',
    Object.keys(tags).length
      ? `
    <section class="tagcloud">
      <span class="icon solid major fa-tag"></span>
      <h3><a href="${esc(state.top_page)}?tags">Tags</a></h3>
      <p>${tag_cloud(tags, 0.75, 1.4)}</p>
    </section>`
      : '',
    cfg.header.theme
      ? `
    <section>
      <span class="icon solid major fa-palette"></span>
      <h3>Theme</h3>
      <ul id="theme-menu">${theme_items()}</ul>
    </section>`
      : '',
  ].filter(Boolean)

  if (!features.length)
    return ''
  return `
<section id="explore" class="wrapper style3 fade-up">
  <div class="inner">
    <h2>Explore</h2>
    <div class="features">${features.join('')}</div>
  </div>
</section>`
}


/** Returns the "About" section: like Hyperspace's "Get in touch" -- text & buttons | site image & social icons */
function about() {
  const img = site_img()
  const social = social_icons()
  return `
<section id="about" class="wrapper style1 fade-up">
  <div class="inner">
    <h2>About</h2>
    <div class="split style1">
      <section>
        ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
        <ul class="actions">
          <li><a href="${esc(state.top_dir)}about" class="button">Learn More</a></li>
          ${cfg.contact?.email_service ? `<li><a href="${esc(state.top_page)}?contact" class="button">Contact</a></li>` : ''}
        </ul>
      </section>
      <section>
        <ul class="contact">
          ${img ? `<li><span class="image avatar"><img src="${esc(img)}" alt=""></span></li>` : ''}
          ${social ? `<li><h3>Social</h3><ul class="icons">${social}</ul></li>` : ''}
        </ul>
      </section>
    </div>
  </div>
</section>`
}


/**
 * Vanilla js port of Hyperspace's jQuery `main.js` (scrollex & scrolly): sections & spotlights fade in as they
 * reach the middle of the screen (once), the sidebar link of the section in view lights up, smooth scrolling.
 */
function setup(btbody) {
  preload()

  // Fade in: `.inactive` (HTML5 UP's css hides & offsets those), removed once it nears the screen's middle.
  // (scrollex "middle" mode w/ top & bottom -20vh => the middle 40% of the screen; spotlights: -10vh => 20%)
  const fade_in = (els, band) => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.remove('inactive')
          io.unobserve(e.target)
        }
      }
    }, { rootMargin: `-${band}% 0px -${band}% 0px` })
    for (const el of els) {
      el.classList.add('inactive')
      io.observe(el)
    }
  }
  fade_in(btbody.querySelectorAll('.wrapper.fade-up, .features'), 30)
  fade_in(btbody.querySelectorAll('.spotlights > section'), 40)

  // a short section at the very bottom may never reach the middle -- so at the bottom, show everything
  globalThis.bt_hyperspace_bottom = () => {
    if (globalThis.innerHeight + globalThis.scrollY >= document.documentElement.scrollHeight - 2)
      document.querySelectorAll('bt-body .inactive').forEach((e) => e.classList.remove('inactive'))
  }

  // Sidebar: the link of the section in view lights up.  A clicked link stays lit ("locked") while we scroll to it.
  const links = [...btbody.querySelectorAll('#sidebar nav a[href^="#"]:not(.scheme-toggle)')]
  const sections = links.map((a) => btbody.querySelector(a.getAttribute('href'))).filter(Boolean)
  const light = (a) => {
    links.forEach((e) => e.classList.remove('active'))
    a?.classList.add('active')
  }
  if (sections.length) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting)
          continue
        const a = links.find((l) => l.getAttribute('href') === `#${e.target.id}`)
        const locked = links.find((l) => l.classList.contains('active-locked'))
        if (!locked)
          light(a)
        else if (locked === a)
          a.classList.remove('active-locked')
      }
    }, { rootMargin: '-30% 0px -30% 0px' })
    sections.forEach((e) => io.observe(e))
  }
  for (const a of links) {
    a.addEventListener('click', () => {
      light(a)
      a.classList.add('active-locked')
    })
  }

  // Smooth scrolling for the sidebar links & `.scrolly` buttons.  When the sidebar is a top bar, offset by it.
  for (const a of [...links, ...btbody.querySelectorAll('a.scrolly')]) {
    a.addEventListener('click', (evt) => {
      const target = btbody.querySelector(a.getAttribute('href'))
      if (!target)
        return
      evt.preventDefault()
      const sidebar = btbody.querySelector('#sidebar')
      const offset = sidebar && LARGE.matches && !SMALL.matches ? sidebar.offsetHeight : 0
      globalThis.scrollTo({ top: target.getBoundingClientRect().top + globalThis.scrollY - offset, behavior: 'smooth' })
    })
  }

  // Page-wide listener: once (a theme switch re-renders us)
  if (!globalThis.bt_hyperspace_listening) {
    globalThis.bt_hyperspace_listening = true
    globalThis.addEventListener('scroll', () => globalThis.bt_hyperspace_bottom?.(), { passive: true })
  }
  globalThis.bt_hyperspace_bottom()
}


/** Returns a post's "spotlight" row: its image (as the background), title, date, summary, "Read more" */
function spotlight(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const href = esc(urlify(post.url))
  return `
<section ${id ? `id="${esc(id)}"` : ''}>
  <a href="${href}" class="image" ${img ? `style="background-image: url(&quot;${esc(img)}&quot;); background-position: center center;"` : ''}></a>
  <div class="content">
    <div class="inner">
      <h2><a href="${href}">${esc(post.title)}</a></h2>
      <p class="date">${esc(datetime(post.date))}</p>
      ${summarize_markdown(post.body_raw, cfg.summary_length)}
      <ul class="actions">
        <li><a href="${href}" class="button">Read more</a></li>
      </ul>
    </div>
  </div>
</section>`
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
${title
  ? `
<section class="wrapper style2-alt">
  <div class="inner"><h1 class="major">${esc(title)}</h1></div>
</section>`
  : ''}
${posts.length
  ? `
<section id="one" class="wrapper style2 spotlights">
  ${posts.map(([url, id]) => spotlight(url, id)).join('')}
</section>`
  : ''}`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`<section class="wrapper style2 spotlights">${spotlight(this.getAttribute('url'), this.id)}</section>`))
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    // the homepage's own content: its own section, after the intro
    if (post.type === 'homepage') {
      this.replaceWith(nodes(`
<section class="wrapper style2-alt fade-up">
  <div class="inner post-body">${body}</div>
</section>`))
      highlight_code()
      return
    }

    const tax = taxonomy(post)
    this.replaceWith(nodes(`
<section id="main" class="wrapper">
  <div class="inner">
    <h1 class="major">${esc(post.title)}</h1>
    <p class="date">${esc(datetime(post.date))}${post.author ? ` &middot; ${esc(post.author)}` : ''}</p>
    ${post.featured ? `<span class="image fit"><img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt)}"></span>` : ''}
    <div class="post-body">${body}</div>
    ${tax ? `<p class="post-tags">${tax}</p>` : ''}
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
<section id="main" class="wrapper histogram">
  <div class="inner">
    <h1 class="major">${type}</h1>
    <ul class="alt">${histogram_items(type, histogram)}</ul>
  </div>
</section>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
<section id="main" class="wrapper">
  <div class="inner">
    <h1 class="major">Contact</h1>
    ${contact_form()}
  </div>
</section>`))
  }
})
