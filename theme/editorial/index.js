/*
  Editorial theme -- a port of https://html5up.net/editorial
  (Free for personal and commercial use under the CCA 3.0 license: html5up.net/license)

  Unlike future-imperfect, this theme is all light DOM: no lit, no shadow DOM.
  So HTML5 UP's original `main.css` (see `index.css`) styles everything, as is.

  blogtini's `index.js` writes `<bt-body>` w/ `<bt-posts>`, `<bt-post-full>`, etc. inside it.
  Here, those are plain custom elements that turn into HTML5 UP's own markup:
  `<bt-body>` stays (blogtini finds it by name), and fills itself w/ the page & sidebar.
  The rest replace themselves w/ plain `<section>`s -- since the css wants eg: `#main > .inner > section`.

  The jQuery `main.js` (sidebar toggle & scroll lock, menu openers) is ported to vanilla js, below.
*/

import {
  cfg, state, url2post, urlify, summarize_markdown, markdown_to_html, datetime, imgurl, reveal,
} from '../../index.js'
import { vrsort } from '../../js/text.js'
// comments are reused from future-imperfect, as is (lit, w/ shadow DOM)
import '../future-imperfect/bt-comments.js'
import '../future-imperfect/bt-comment.js'
import { css_hljs } from '../future-imperfect/css.js'


// for the theme menu.  blogtini maps the link text to the theme dir, eg: 'future imperfect' => 'future-imperfect'
const THEMES = ['future imperfect', 'grid', 'editorial']

// sidebar collapses at, or below, this width
const LARGE = globalThis.matchMedia('(max-width: 1280px)')


/** Escapes text for use in html (and attribute values) */
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/** Turns an html string into nodes, eg: for `replaceWith()` */
function nodes(htm) {
  const tpl = document.createElement('template')
  tpl.innerHTML = htm
  return tpl.content
}

/** Returns a post's image -- its featured image, else its first image, else the site's image */
function post_img(post) {
  if (post.featured)
    return imgurl(post, true, true)
  if (post.images?.length)
    return `${state.top_dir}${post.images[0].src}`
  return cfg.img_site ? imgurl(post, true, true) : ''
}

/** Returns a sidebar/menu url, relative to this page */
function navurl(url) {
  const ret = `${state.top_dir}${url.replace(/^\/+/, '').concat(state.filedev ? 'index.html' : '')}`
  return ret === '' ? './' : ret
}


const SOCIAL = [
  // [config.yml `social` key, url, title, icon classes]
  ['github', (v) => `https://github.com/${v}`, 'GitHub', 'brands fa-github'],
  ['gitlab', (v) => `https://gitlab.com/${v}`, 'GitLab', 'brands fa-gitlab'],
  ['stackoverflow', (v) => `https://stackoverflow.com/users/${v}`, 'Stack Overflow', 'brands fa-stack-overflow'],
  ['codepen', (v) => `https://codepen.io/${v}`, 'CodePen', 'brands fa-codepen'],
  ['flickr', (v) => `https://flickr.com/photos/${v}`, 'Flickr', 'brands fa-flickr'],
  ['medium', (v) => `https://medium.com/@${v}`, 'Medium', 'brands fa-medium'],
  ['linkedin', (v) => `https://www.linkedin.com/in/${v}`, 'LinkedIn', 'brands fa-linkedin'],
  ['facebook', (v) => `https://facebook.com/${v}`, 'Facebook', 'brands fa-facebook'],
  ['reddit', (v) => `https://reddit.com/user/${v}`, 'Reddit', 'brands fa-reddit'],
  ['youtube', (v) => `https://youtube.com/${v}`, 'YouTube', 'brands fa-youtube'],
  ['vimeo', (v) => `https://vimeo.com/${v}`, 'Vimeo', 'brands fa-vimeo'],
  ['instagram', (v) => `https://instagram.com/${v}`, 'Instagram', 'brands fa-instagram'],
  ['tumblr', (v) => `https://${v}.tumblr.com`, 'Tumblr', 'brands fa-tumblr'],
  ['twitter', (v) => `https://twitter.com/${v}`, 'Twitter', 'brands fa-twitter'],
  ['strava', (v) => `https://strava.com/athletes/${v}`, 'Strava', 'brands fa-strava'],
  ['pinterest', (v) => `https://www.pinterest.com/${v}`, 'Pinterest', 'brands fa-pinterest-p'],
  ['mastodon', (v) => `https://${v}`, 'Mastodon', 'brands fa-mastodon'],
  ['email', (v) => `mailto:${v}`, 'Email', 'fa-envelope'],
]

function social_icons() {
  const rss = cfg.social?.rss
    ? `<li><a href="${esc(state.top_dir + cfg.social.rss)}" class="icon solid fa-rss" type="application/rss+xml"><span class="label">RSS</span></a></li>`
    : ''
  return rss + SOCIAL.map(([svc, url, title, cls]) => {
    const val = cfg.social?.[svc]
    if (val === '' || val === undefined || val === null)
      return ''
    const rel = svc === 'mastodon' ? 'me' : 'noopener'
    return `<li><a href="${esc(url(val))}" class="icon ${cls}" title="${title}" target="_blank" rel="${rel}"><span class="label">${title}</span></a></li>`
  }).join('')
}


/** Returns prior & next links: for pages of posts, or a single post's neighbors */
function pagination() {
  if (!state.show_previous_and_next)
    return ''

  // (same logic as future-imperfect)
  const page_is_home = !state.filter_tag && !state.filter_cat
  const page_base = location.href.split('#')[0].replace(/\/page\/\d+/, '').replace(/(\?.*$)/, page_is_home ? '' : '$1')
  const page_sep = page_is_home ? '?' : '/'

  let left = state.page > 0 ? state.page - 1 : null
  let rite = state.page_more ? state.page + 1 : null
  let left_url = `${page_base}${left ? `${page_sep}page/${1 + left}` : ''}`
  let rite_url = `${page_base}${page_sep}page/${1 + rite}`
  let left_title = 'Prior Page'
  let rite_title = 'Next Page'

  if (state.filter_post_url) {
    left = state.filter_post_url_prior
    rite = state.filter_post_url_next
    if (left) {
      left_url = left
      left_title = url2post(left)?.title ?? left_title
    }
    if (rite) {
      rite_url = rite
      rite_title = url2post(rite)?.title ?? rite_title
    }
  }

  if (left === null && rite === null && !state.filter_post_url)
    return ''

  return `
<section class="pager">
  <ul class="actions fit">
    <li>${left !== null && left !== undefined ? `<a href="${esc(left_url)}" class="button icon solid fa-chevron-left fit">${esc(left_title)}</a>` : ''}</li>
    <li>${rite !== null && rite !== undefined ? `<a href="${esc(rite_url)}" class="button icon solid fa-chevron-right fit">${esc(rite_title)}</a>` : ''}</li>
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

    const recent = JSON.parse(this.getAttribute('recent_posts') || '[]')
    const categories = JSON.parse(this.getAttribute('categories') || '{}')
    const tags = JSON.parse(this.getAttribute('tags') || '{}')

    this.innerHTML = `
<div id="wrapper">
  <div id="main">
    <div class="inner">
      <header id="header">
        <a href="${esc(state.top_page)}" class="logo"><strong>${esc(cfg.title)}</strong></a>
        ${cfg.footer?.social || cfg.intro?.social ? `<ul class="icons">${social_icons()}</ul>` : ''}
      </header>
    </div>
  </div>

  <div id="sidebar">
    <div class="inner">
      ${cfg.header.search ? `
      <section id="search" class="alt">
        <form>
          <input type="text" id="search-input" placeholder="Search" autocomplete="off">
        </form>
        <div id="search-results"></div>
      </section>` : ''}

      ${sidebar_menu()}
      ${sidebar_recent(recent)}
      ${sidebar_categories(categories)}
      ${sidebar_tags(tags)}
      ${sidebar_about()}

      <footer id="footer">
        <p class="copyright">
          ${cfg.copyright ? esc(cfg.copyright) : `&copy; ${esc(state.newest?.slice(0, 4) ?? '')} ${esc(cfg.author ?? cfg.title)}`}.
          Design: <a href="https://html5up.net/editorial" target="_blank" rel="noopener">Editorial by HTML5 UP</a>.
          Powered by <a href="https://blogtini.com/" target="_blank" rel="noopener">blogtini.com</a>.
        </p>
      </footer>
    </div>
  </div>
</div>
<a id="back-to-top" href="#" class="icon solid fa-arrow-up"><span class="label">Back to top</span></a>`

    const inner = this.querySelector('#main > .inner')
    inner.append(...content)
    inner.append(nodes(pagination()))

    this.querySelector('#search form')?.addEventListener('submit', (evt) => evt.preventDefault())
    this.querySelector('#back-to-top').addEventListener('click', (evt) => {
      evt.preventDefault()
      globalThis.scrollTo({ top: 0, behavior: 'smooth' })
    })
    this.querySelectorAll('.scheme-toggle').forEach((e) => e.addEventListener('click', (evt) => {
      evt.preventDefault()
      const scheme_now = document.documentElement.getAttribute('scheme')
      document.documentElement.setAttribute('scheme', scheme_now === 'dark' ? 'light' : 'dark')
    }))

    sidebar_setup(this)

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }
})


function sidebar_menu() {
  return `
<nav id="menu">
  <header class="major"><h2>Menu</h2></header>
  <ul>
    ${(cfg.menu?.main ?? []).map((e) => `<li><a href="${esc(navurl(e.url))}">${e.pre ?? ''} ${esc(e.name)}</a></li>`).join('')}
    ${cfg.header.theme ? `
    <li>
      <span class="opener"><i class="fas fa-palette"></i> Theme</span>
      <ul id="theme-menu">
        ${THEMES.map((e) => `<li><a href="#">${e}</a></li>`).join('')}
      </ul>
    </li>` : ''}
    <li><a href="#scheme" class="scheme-toggle"><i class="fas fa-lightbulb"></i> Scheme</a></li>
  </ul>
</nav>`
}

function sidebar_recent(recent) {
  if (!cfg.sidebar.post_amount || !recent.length)
    return ''
  const more = recent.length >= cfg.sidebar.post_amount
  return `
<section>
  <header class="major"><h2>Recent Posts</h2></header>
  <div class="mini-posts">
    ${recent.map((url) => {
      const post = url2post(urlify(url))
      if (!post)
        return ''
      const img = post_img(post)
      return `
    <article>
      ${img ? `<a href="${esc(urlify(post.url))}" class="image"><img src="${esc(img)}" alt="" loading="lazy"></a>` : ''}
      <h4><a href="${esc(urlify(post.url))}">${esc(post.title)}</a></h4>
      <div class="date">${esc(datetime(post.date))}</div>
    </article>`
    }).join('')}
  </div>
  ${more ? `
  <ul class="actions">
    <li><a href="${esc(cfg.view_more_posts_link || `${state.top_page}#post${cfg.sidebar.post_amount}`)}" class="button">See More</a></li>
  </ul>` : ''}
</section>`
}

function sidebar_categories(categories) {
  if (!cfg.sidebar.categories || !Object.keys(categories).length)
    return ''
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  return `
<nav id="categories">
  <header class="major"><h2><a href="${esc(state.top_page)}?categories">Categories</a></h2></header>
  <ul class="alt">
    ${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}
  </ul>
</nav>`
}

function sidebar_tags(tags) {
  const counts = Object.values(tags)
  if (!counts.length)
    return ''
  const [rem_min, rem_max] = [0.8, 1.8]
  const cnt_min = Math.min(...counts)
  const cnt_max = 1 + Math.max(...counts)
  return `
<section class="tagcloud">
  <header class="major"><h2><a href="${esc(state.top_page)}?tags">Tags</a></h2></header>
  <p>
    ${Object.entries(tags).map(([tag, cnt]) => {
      const weight = (Math.log(cnt) - Math.log(cnt_min)) / (Math.log(cnt_max) - Math.log(cnt_min))
      const size = (rem_min + ((rem_max - rem_min) * weight)).toFixed(1)
      return `<a href="${esc(state.top_page)}?tags/${esc(tag)}" style="font-size: ${size}rem">${esc(tag.toLowerCase())}</a>`
    }).join(' ')}
  </p>
</section>`
}

function sidebar_about() {
  if (!cfg.sidebar.about && !cfg.intro?.paragraph)
    return ''
  const img = cfg.img_site?.startsWith('https://') ? cfg.img_site : `${state.top_dir}${cfg.img_site}`
  return `
<section id="site-intro">
  <header class="major"><h2>About</h2></header>
  ${cfg.img_site ? `<p><a href="${esc(state.top_page)}"><img src="${esc(img)}" alt=""></a></p>` : ''}
  ${cfg.intro?.paragraph ? `<p>${cfg.intro.paragraph}</p>` : ''}
  ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
  <ul class="actions">
    <li><a href="${esc(state.top_dir)}about" class="button">Learn More</a></li>
  </ul>
</section>`
}


/**
 * Vanilla js port of the sidebar parts of Editorial's jQuery `main.js`:
 * the toggle button, collapsed by default on smaller screens, menu openers, and the scroll lock.
 */
function sidebar_setup(btbody) {
  const sidebar = btbody.querySelector('#sidebar')

  // Stop animations/transitions (eg: the sidebar sliding shut) until the page has rendered.
  document.body.classList.add('is-preload')
  setTimeout(() => document.body.classList.remove('is-preload'), 100)

  // Inactive by default on <= large.
  sidebar.classList.toggle('inactive', LARGE.matches)

  // Toggle.
  const toggle = document.createElement('a')
  toggle.href = '#sidebar'
  toggle.className = 'toggle'
  toggle.textContent = 'Toggle'
  toggle.addEventListener('click', (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    sidebar.classList.toggle('inactive')
  })
  sidebar.appendChild(toggle)

  // Menu openers (accordion).
  const openers = [...sidebar.querySelectorAll('#menu .opener')]
  openers.forEach((opener) => opener.addEventListener('click', (evt) => {
    evt.preventDefault()
    openers.filter((e) => e !== opener).forEach((e) => e.classList.remove('active'))
    opener.classList.toggle('active')
    sidebar_lock() // sidebar height changed
  }))

  // Page-wide listeners: once (a theme switch re-renders us, so they look up the current elements)
  if (globalThis.bt_editorial_listening)
    return
  globalThis.bt_editorial_listening = true

  LARGE.addEventListener('change', () => {
    document.querySelector('#sidebar')?.classList.toggle('inactive', LARGE.matches)
    sidebar_lock()
  })

  // Hide sidebar on a click/tap outside it (<= large).
  document.addEventListener('click', (evt) => {
    const sb = document.querySelector('#sidebar')
    if (!LARGE.matches || !sb || evt.composedPath().includes(sb))
      return
    sb.classList.add('inactive')
  })

  globalThis.addEventListener('scroll', () => {
    sidebar_lock()
    const top = document.querySelector('#back-to-top')
    if (top)
      top.style.opacity = globalThis.scrollY ? 1 : 0
  }, { passive: true })
  globalThis.addEventListener('resize', sidebar_lock, { passive: true })
}

/**
 * Scroll lock: when the page is scrolled past the bottom of a (wide screen) sidebar, pin it.
 */
function sidebar_lock() {
  const inner = document.querySelector('#sidebar > .inner')
  if (!inner)
    return

  if (LARGE.matches) {
    inner.style.position = ''
    inner.style.top = ''
    return
  }

  const sh = inner.offsetHeight + 30
  const x = Math.max(sh - globalThis.innerHeight, 0)
  const y = Math.max(0, globalThis.scrollY - x)

  // Only when the main column is the taller one.  Else pinning (taking the sidebar out of the flow)
  // shortens the page, which moves the scroll position, which unpins it, which ... flickers.
  const main_taller = (document.querySelector('#main')?.offsetHeight ?? 0) > sh

  if (y > 0 && main_taller) {
    inner.style.position = 'fixed'
    inner.style.top = `${-1 * x}px`
  } else {
    inner.style.position = ''
    inner.style.top = ''
  }
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
  ${img ? `<a href="${href}" class="image"><img src="${esc(img)}" alt="${esc(post.featuredalt)}" loading="lazy"></a>` : ''}
  <h3><a href="${href}">${esc(post.title)}</a></h3>
  <div class="date">${esc(datetime(post.date))}</div>
  ${summarize_markdown(post.body_raw, cfg.summary_length)}
  <ul class="actions">
    <li><a href="${href}" class="button">More</a></li>
  </ul>
</article>`
}

/** Returns the big "banner" section, for the newest post on the homepage */
function banner(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const img = post_img(post)
  const href = esc(urlify(post.url))
  return `
<section id="banner">
  <div class="content" ${id ? `id="${esc(id)}"` : ''}>
    <header>
      <h1><a href="${href}">${esc(post.title)}</a></h1>
      <p class="date">${esc(datetime(post.date))}</p>
    </header>
    ${summarize_markdown(post.body_raw, cfg.summary_length)}
    <ul class="actions">
      <li><a href="${href}" class="button big">Read More</a></li>
    </ul>
  </div>
  ${img ? `<span class="image object"><img src="${esc(img)}" alt="${esc(post.featuredalt)}"></span>` : ''}
</section>`
}


customElements.define('bt-posts', class extends HTMLElement {
  connectedCallback() {
    const posts = [...this.querySelectorAll('bt-post')].map((e) => [e.getAttribute('url'), e.id])

    const filtered = state.filter_tag || state.filter_cat
    // newest post gets the banner -- on the homepage's first page, when it doesnt have its own content
    const top = !filtered && !state.page && !state.show_top_content && posts.length
      ? banner(...posts.shift())
      : ''

    let title = 'Posts'
    if (state.filter_tag)
      title = `Tagged: ${state.filter_tag}`
    else if (state.filter_cat)
      title = `Category: ${state.filter_cat}`
    else if (state.page)
      title = `Posts, page ${state.page + 1}`
    else if (top)
      title = 'More Posts'

    this.replaceWith(nodes(`
${top}
${posts.length ? `
<section>
  <header class="major"><h2>${esc(title)}</h2></header>
  <div class="posts">
    ${posts.map(([url, id]) => card(url, id)).join('')}
  </div>
</section>` : ''}`))
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
      this.replaceWith(nodes(`<section class="post-body">${body}</section>`))
      highlight_code()
      return
    }

    // (same as future-imperfect)
    const relative_path = post.url.startsWith(cfg.site_url) ? post.url.slice(cfg.site_url.length) : post.url
    const comments_entryid = new URL(relative_path, 'https://blogtini.com').pathname.replace(/^\/+/, '').replace(/\/+$/, '')

    const taxonomy = [
      ...(post.categories ?? []).map((e) => `<a href="${esc(state.top_page)}?categories/${esc(e)}" class="icon solid fa-folder"> ${esc(e)}</a>`),
      ...(post.tags ?? []).map((e) => `<a href="${esc(state.top_page)}?tags/${esc(e)}" class="icon solid fa-tag"> ${esc(e)}</a>`),
    ]

    this.replaceWith(nodes(`
<section>
  <header class="main">
    <h1>${esc(post.title)}</h1>
    <p class="date">${esc(datetime(post.date))}${post.author ? ` &middot; ${esc(post.author)}` : ''}</p>
  </header>
  ${post.featured ? `<span class="image main"><img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt)}"></span>` : ''}
  <div class="post-body">${body}</div>
  ${taxonomy.length ? `<hr class="major"><p class="post-tags">${taxonomy.join(' ')}</p>` : ''}
  ${post.type === 'post' && cfg.staticman?.enabled ? `<bt-comments entryid="${esc(comments_entryid)}"></bt-comments>` : ''}
</section>`))

    highlight_code()
  }
})

function highlight_code() {
  const codes = document.querySelectorAll('.post-body pre code')
  if (!codes.length)
    return
  // future-imperfect's highlight.js colors -- into the (light DOM) document, once
  if (!document.adoptedStyleSheets.includes(css_hljs.styleSheet))
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, css_hljs.styleSheet]
  void import('https://esm.ext.archive.org/highlightjs@9.16.2').then(
    (esm) => codes.forEach(esm.default.highlightBlock),
  )
}


customElements.define('bt-histogram', class extends HTMLElement {
  connectedCallback() {
    const type = state.list_tags ? 'tags' : 'categories'
    const histogram = JSON.parse(this.getAttribute('histogram') || '{}')
    this.replaceWith(nodes(`
<section class="histogram">
  <header class="major"><h2>${type}</h2></header>
  <ul class="alt">
    ${Object.entries(vrsort(histogram)).map(([key, cnt]) => `<li><a href="${esc(state.top_page)}?${type}/${esc(key)}">${esc(key)}</a> <span class="count">${cnt}</span></li>`).join('')}
  </ul>
</section>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
<section>
  <header class="main"><h1>Contact</h1></header>
  <p>Replies typically within ${esc(cfg.contact.answer_time)} hours.</p>
  <form action="${esc(cfg.contact.email_service)}" method="post">
    <div class="row gtr-uniform">
      <div class="col-6 col-12-xsmall"><input type="text" name="name" placeholder="Your Name" required autofocus></div>
      <div class="col-6 col-12-xsmall"><input type="email" name="_replyto" placeholder="Your Email" required></div>
      <div class="col-12"><input type="text" name="_subject" placeholder="Subject" required></div>
      <div class="col-12"><textarea name="message" placeholder="Your Message" rows="6" required></textarea></div>
      <div class="col-12">
        <ul class="actions"><li><input type="submit" value="Submit" class="primary"></li></ul>
      </div>
    </div>
  </form>
</section>`))
  }
})
