/*
  Terminal theme -- a port of https://github.com/panr/hugo-theme-terminal (v4.2.0, MIT: LICENSE.md)
  All light DOM, like the HTML5 UP ports -- see THEMES.md.  Its original css (assets/css/) styles it, as is.

  Blogtini touches: each page starts w/ a shell prompt & a command for what it shows (eg: `ls -t posts/`,
  `cat 2026-10-blogtini-v2/index.md`), the search box is a `grep -ri` prompt, a blinking cursor after the logo.
  Its jQuery-free `menu.js` (dropdowns) is ported below.
*/

import {
  cfg, state, url2post, urlify, summarize_markdown, markdown_to_html, datetime, imgurl, reveal,
  word_count, reading_time,
} from '../../index.js'
import {
  esc, nodes, navurl, theme_items, social_list, pager, comments, histogram_items, contact_form,
} from '../html5up/shared.js'


/** Returns the shell prompt, eg: 'guest@blogtini.com:~$' -- the visitor is our guest */
function ps1() {
  return `guest@${location.hostname || 'localhost'}:~$`
}

/** Returns a prompt line, w/ a command */
function prompt(cmd) {
  return `<p class="prompt"><span class="ps1">${esc(ps1())}</span> ${esc(cmd)}</p>`
}

/** Returns a date, w/o any weekday or time, eg: 'October 27, 2026' or 'Oct 27, 2026' */
function day(date) {
  return datetime(date).replace(/^\w+, /, '').replace(/ \d+:\d+ [AP]M$/, '')
}

/** Returns `<li>`s of `config.yml` `menu.main` links -- just their names (no icons, in a terminal) */
function menu_names() {
  return (cfg.menu?.main ?? []).map((e) => `<li><a href="${esc(navurl(e.url))}">${esc(e.name)}</a></li>`).join('')
}

/** Returns a post's `.post-meta`: date, author, reading time */
function meta(post, words = false) {
  const mins = cfg.reading_time
    ? `<span class="post-reading-time">${reading_time(post)} min read${words ? ` (${word_count(post).toLocaleString('en')} words)` : ''}</span>`
    : ''
  return `
<div class="post-meta">
  <time class="post-date">${esc(day(post.date))}</time>${post.author ? `<span class="post-author">${esc(post.author)}</span>` : ''}${mins}
</div>`
}

/** Returns a post's categories & tags, terminal style: `#tag` */
function tags(post) {
  const links = [
    ...(post.categories ?? []).map((e) => `<a href="${esc(state.top_page)}?categories/${esc(e)}">${esc(e)}</a>`),
    ...(post.tags ?? []).map((e) => `#<a href="${esc(state.top_page)}?tags/${esc(e)}">${esc(e)}</a>`),
  ]
  return links.length ? `<span class="post-tags">${links.join('&nbsp; ')}</span>` : ''
}


/** Returns prior & next links: for pages of posts, or a single post's neighbors */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  const [left, rite] = pg.single ? [pg.left_title, pg.rite_title] : ['Newer posts', 'Older posts']
  return `
<div class="pagination">
  ${pg.single ? '<div class="pagination__title"><span class="pagination__title-h">Read other posts</span><hr /></div>' : ''}
  <div class="pagination__buttons">
    ${pg.left_url ? `<a href="${esc(pg.left_url)}" class="button inline prev">&lt; [<span class="button__text">${esc(left)}</span>]</a>` : ''}
    ${pg.left_url && pg.rite_url ? '::' : ''}
    ${pg.rite_url ? `<a href="${esc(pg.rite_url)}" class="button inline next">[<span class="button__text">${esc(rite)}</span>] &gt;</a>` : ''}
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

    const scheme = '<li><a href="#scheme" class="scheme-toggle">Scheme</a></li>'
    const year = state.newest?.slice(0, 4) ?? ''
    const social = social_list().map((e) => `<a href="${esc(e.href)}" ${e.title === 'RSS' ? 'type="application/rss+xml"' : `target="_blank" rel="${e.rel}"`}>${esc(e.title.toLowerCase())}</a>`).join(' ')

    this.innerHTML = `
<div class="container center">
  <header class="header">
    <div class="header__inner">
      <div class="header__logo">
        <a href="${esc(state.top_page)}"><div class="logo">${esc(cfg.title)}</div></a>
      </div>
      <ul class="menu menu--mobile">
        <li class="menu__trigger">Menu&nbsp;▾</li>
        <li>
          <ul class="menu__dropdown">
            ${menu_names()}
            ${scheme}
            ${cfg.header.theme ? `<hr /><li class="theme-head">Theme:</li><li><ul class="theme-menu">${theme_items()}</ul></li>` : ''}
          </ul>
        </li>
      </ul>
    </div>
    <nav class="navigation-menu">
      <ul class="navigation-menu__inner menu--desktop">
        ${menu_names()}
        ${scheme}
        ${cfg.header.theme
          ? `
        <li>
          <ul class="menu">
            <li class="menu__trigger">Theme&nbsp;▾</li>
            <li><ul class="menu__dropdown" id="theme-menu">${theme_items()}</ul></li>
          </ul>
        </li>`
          : ''}
      </ul>
    </nav>
  </header>

  ${cfg.header.search
    ? `
  <div class="search">
    <label for="search-input" class="prompt"><span class="ps1">${esc(ps1())}</span> grep -ri</label>
    <input type="text" id="search-input" placeholder="..." autocomplete="off" spellcheck="false">
  </div>
  <div id="search-results"></div>`
    : ''}

  <div class="content"></div>

  <footer class="footer">
    <div class="footer__inner">
      <div class="copyright">
        <span>${cfg.copyright ? esc(cfg.copyright) : `&copy; ${esc(year)} ${esc(cfg.author ?? cfg.title)}`}</span>
        ${social ? `<span>:: ${social}</span>` : ''}
        <span>:: <a href="https://github.com/panr/hugo-theme-terminal" target="_blank" rel="noopener">Theme</a> made by <a href="https://github.com/panr" target="_blank" rel="noopener">panr</a></span>
        <span>:: Powered by <a href="https://blogtini.com/" target="_blank" rel="noopener">blogtini</a></span>
      </div>
    </div>
  </footer>
</div>`

    const main = this.querySelector('.content')
    main.append(...content)
    main.append(nodes(pagination()))

    setup(this)

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }
})


/**
 * Vanilla js for Terminal's `menu.js`: a `.menu__trigger` opens its `.menu`'s dropdown (closing any other);
 * a click elsewhere, or a resize, closes them.  And the Scheme toggle: dark is Terminal's own look --
 * so no pick yet (or dark) => light, light => dark.
 */
function setup(btbody) {
  const menus = [...btbody.querySelectorAll('.menu')]
  for (const menu of menus) {
    const trigger = menu.querySelector('.menu__trigger')
    const dropdown = menu.querySelector('.menu__dropdown')
    trigger?.addEventListener('click', (evt) => {
      evt.stopPropagation()
      const was_open = menu.classList.contains('open')
      menus.forEach((m) => m.classList.remove('open'))
      if (was_open)
        return
      menu.classList.add('open')
      // keep it on screen
      const container = btbody.querySelector('.container')
      if (dropdown.getBoundingClientRect().right > container.getBoundingClientRect().right) {
        dropdown.style.left = 'auto'
        dropdown.style.right = 0
      }
    })
  }

  btbody.querySelectorAll('.scheme-toggle').forEach((e) => e.addEventListener('click', (evt) => {
    evt.preventDefault()
    const now = document.documentElement.getAttribute('scheme')
    document.documentElement.setAttribute('scheme', now === 'light' ? 'dark' : 'light')
  }))

  // Page-wide listeners: once (a theme switch re-renders us).
  // (No `stopPropagation()` in dropdowns, as `menu.js` has: blogtini's theme picker listens on the document)
  if (!globalThis.bt_terminal_listening) {
    globalThis.bt_terminal_listening = true
    const close = () => document.querySelectorAll('bt-body .menu.open').forEach((m) => m.classList.remove('open'))
    document.addEventListener('click', (evt) => {
      if (!evt.composedPath().some((e) => e.classList?.contains('menu__dropdown')) || evt.target.closest?.('a'))
        close()
    })
    globalThis.addEventListener('resize', close)
  }
}


/** Returns a post's entry in a list of posts */
function entry(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const href = esc(urlify(post.url))
  return `
<article class="post on-list" ${id ? `id="${esc(id)}"` : ''}>
  <h2 class="post-title"><a href="${href}">${esc(post.title)}</a></h2>
  ${meta(post)}
  ${tags(post)}
  ${post.featured ? `<a href="${href}"><img src="${esc(imgurl(post, true, true))}" class="post-cover" alt="${esc(post.title)}"></a>` : ''}
  <div class="post-content">${summarize_markdown(post.body_raw, cfg.summary_length)}</div>
  <div><a class="read-more button inline" href="${href}">[Read more]</a></div>
</article>`
}


customElements.define('bt-posts', class extends HTMLElement {
  connectedCallback() {
    const posts = [...this.querySelectorAll('bt-post')].map((e) => [e.getAttribute('url'), e.id])

    const n = cfg.posts_per_page
    let cmd = state.page
      ? `ls -t posts/ | tail -n +${(state.page * n) + 1} | head -${n}`
      : `ls -t posts/ | head -${n}`
    if (state.filter_tag)
      cmd = `grep -l 'tags:.*${state.filter_tag}' posts/*`
    else if (state.filter_cat)
      cmd = `grep -l 'categories:.*${state.filter_cat}' posts/*`

    this.replaceWith(nodes(`
${prompt(cmd)}
<div class="posts">${posts.map(([url, id]) => entry(url, id)).join('')}</div>`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`<div class="posts">${entry(this.getAttribute('url'), this.id)}</div>`))
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    // the homepage's own content: framed, before the posts
    if (post.type === 'homepage') {
      this.replaceWith(nodes(`${prompt('cat README.md')}<div class="index-content framed">${body}</div>`))
      return
    }

    const is_post = !post.type || post.type === 'post'
    const slug = urlify(post.url, true).replace(/^(\.\.\/|\.\/)+/, '').split('/').pop() || 'index'
    const cover = post.featured
      ? `<img src="${esc(imgurl(post, true, true))}" class="post-cover" alt="${esc(post.featuredalt ?? post.title)}">`
      : ''

    this.replaceWith(nodes(`
${prompt(`cat ${slug}/index.md`)}
<article class="post">
  <h1 class="post-title"><a href="${esc(urlify(post.url))}">${esc(post.title)}</a></h1>
  ${is_post ? meta(post, true) : ''}
  ${tags(post)}
  ${cover && post.featuredcaption ? `<figure>${cover}<figcaption>${esc(post.featuredcaption)}</figcaption></figure>` : cover}
  <div class="post-content"><div>${body}</div></div>
  ${comments(post)}
</article>`))
  }
})


customElements.define('bt-histogram', class extends HTMLElement {
  connectedCallback() {
    const type = state.list_tags ? 'tags' : 'categories'
    const histogram = JSON.parse(this.getAttribute('histogram') || '{}')
    this.replaceWith(nodes(`
${prompt(`cut -d: -f2 ${type} | sort | uniq -c | sort -rn`)}
<div class="terms">
  <h1>${type}</h1>
  <ul>${histogram_items(type, histogram)}</ul>
</div>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
${prompt(`mail -s 'hello' ${cfg.user || 'webmaster'}`)}
<div class="post contact">
  <h1 class="post-title">Contact</h1>
  ${contact_form()}
</div>`))
  }
})
