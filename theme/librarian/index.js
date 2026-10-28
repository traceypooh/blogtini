/*
  Librarian theme -- an original blogtini theme: a nerdy library.
  Built on Tufte CSS (book typography, wide margins) -- see tufte.css.  All light DOM, like the HTML5 UP ports.

  - homepage, tags, categories: the posts as a drawer of library catalog cards: a "call number" (subject,
    a Cutter-ish number from the title, year), the title, date, "collation" (words & illustrations), a summary,
    the "tracings" (its subjects) -- and a red rubber "LOAN PERIOD" stamp: the reading time
  - a post: a Tufte article, w/ a "DATE DUE" slip in the right margin (stamped w/ the reading time)
  - every page ends w/ the "Finding aids" (search, subjects, categories, theme picker) as card catalog drawers,
    and a colophon
  `<bt-body>` writes those & moves blogtini's content into `#wrapper`; the rest replace themselves w/ plain html.
*/

import {
  cfg, state, url2post, urlify, summarize_markdown, markdown_to_html, datetime, imgurl, reveal,
  word_count, reading_time, all_posts,
} from '../../index.js'
import { vrsort } from '../../js/text.js'
import {
  esc, nodes, site_img, menu_items, theme_items, scheme_toggles, social_list, pager, comments,
  highlight_code, histogram_items, tag_cloud, contact_form,
} from '../html5up/shared.js'


/** Is this the homepage's first page? */
function is_home() {
  return state.is_homepage && !location.search
}


/** Returns a date, w/o any weekday or time, eg: 'October 27, 2026' or 'Oct 27, 2026' */
function day(date) {
  return datetime(date).replace(/^\w+, /, '').replace(/ \d+:\d+ [AP]M$/, '')
}

/** Returns a simple string hash: a non-negative int */
function hash(str) {
  let h = 0
  for (const c of str)
    h = ((h * 31) + c.charCodeAt(0)) >>> 0
  return h
}

/**
 * Returns a post's "call number" lines, eg: ['BLOG', '.B56', '2026'] --
 * its first subject, a Cutter-ish number from its title (a letter & 2 digits), its year.
 */
function call_number(post) {
  const subject = ([...(post.categories ?? []), ...(post.tags ?? [])][0] ?? 'gen')
    .replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase() || 'GEN'
  const title = (post.title ?? '').toLowerCase().replace(/^(the|a|an) /, '').replace(/[^a-z]/g, '')
  const digits = [...title.slice(1, 3)].map((c) => Math.min(9, Math.floor((c.charCodeAt(0) - 97) / 2.6))).join('')
  const cutter = title ? `.${title[0].toUpperCase()}${digits.padEnd(2, '0')}` : ''
  const year = day(post.date).match(/\d{4}/)?.[0] ?? ''
  return [subject, cutter, year].filter(Boolean)
}

/** Returns a card catalog style author heading, eg: 'Jaquith, Tracey.' -- or '' */
function main_entry(author) {
  if (!author)
    return ''
  const words = author.trim().split(/\s+/)
  return words.length > 1 ? `${words.pop()}, ${words.join(' ')}.` : `${author}.`
}

/**
 * Returns a red rubber stamp: the reading time, as a loan period -- or '' if `reading_time: false`.
 * Each post's stamp lands at its own slight angle.
 */
function stamp(post, label = 'Loan period') {
  if (!cfg.reading_time)
    return ''
  const tilt = (hash(post.url ?? '') % 13) - 8 // -8 .. 4 degrees
  return `<span class="stamp" style="--tilt: ${tilt}deg"><small>${esc(label)}</small><b>${reading_time(post)} min</b></span>`
}

/** Returns a post's subject links (categories, then tags) */
function subjects(post) {
  return [
    ...(post.categories ?? []).map((e) => [e, `${state.top_page}?categories/${e}`]),
    ...(post.tags ?? []).map((e) => [e, `${state.top_page}?tags/${e}`]),
  ]
}


/** Returns a post's catalog card */
function card(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const href = esc(urlify(post.url))
  const words = word_count(post)
  // the "collation", like a book's: `1,240 words : front., 3 ill.` -- its featured image is the frontispiece
  const figs = (post.body_raw?.match(/!\[|<img\b/gi) ?? []).length
  const ill = [post.featured ? 'front.' : '', figs ? `${figs} ill.` : ''].filter(Boolean).join(', ')
  const summary = nodes(summarize_markdown(post.body_raw ?? '', 240)).textContent.trim()
  const author = post.author ?? cfg.author
  const tracings = subjects(post).map(([name, link], n) => `${n + 1}. <a href="${esc(link)}">${esc(name)}</a>.`)

  return `
<div class="card" ${id ? `id="${esc(id)}"` : ''}>
  <div class="call-number">${call_number(post).map(esc).join('<br>')}</div>
  <div class="entry">
    ${author ? `<p class="main-entry">${esc(main_entry(author))}</p>` : ''}
    <p class="title"><a href="${href}">${esc(post.title)}</a>${author ? ` / ${esc(author)}` : ''}. -- ${esc(day(post.date))}.</p>
    <p class="collation">${words.toLocaleString('en')} words${ill ? ` : ${ill}` : ''}</p>
    ${summary ? `<p class="summary">${esc(summary)}</p>` : ''}
    <p class="tracings">${[...tracings, 'I. Title.'].join(' ')}</p>
  </div>
  ${stamp(post)}
</div>`
}


/** Returns prior & next links: for pages of posts, or a single post's neighbors (its shelf neighbors) */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  const [left, rite] = pg.single ? ['Previous on the shelf', 'Next on the shelf'] : ['Prior drawer', 'Next drawer']
  return `
<nav class="shelf sans">
  ${pg.left_url ? `<a href="${esc(pg.left_url)}" class="prior"><small>&larr; ${left}</small>${pg.single ? esc(pg.left_title) : ''}</a>` : '<span></span>'}
  ${pg.rite_url ? `<a href="${esc(pg.rite_url)}" class="next"><small>${rite} &rarr;</small>${pg.single ? esc(pg.rite_title) : ''}</a>` : '<span></span>'}
</nav>`
}


customElements.define('bt-body', class extends HTMLElement {
  connectedCallback() {
    if (this.rendered)
      return
    this.rendered = true

    // blogtini's main content -- eg: `<bt-posts>`.  (minus any `<hr>`: we have our own rules)
    const content = [...this.childNodes].filter((e) => e.nodeName !== 'HR')

    const categories = JSON.parse(this.getAttribute('categories') || '{}')
    const tags = JSON.parse(this.getAttribute('tags') || '{}')

    this.innerHTML = `
<header class="masthead">
  ${is_home()
    ? `<h1 class="site-title">${esc(cfg.title)}</h1>
       ${cfg.intro?.paragraph ? `<p class="subtitle">${cfg.intro.paragraph}</p>` : ''}`
    : `<p class="site-title"><a href="${esc(state.top_page)}">${esc(cfg.title)}</a></p>`}
  <nav class="sans">
    <ul>
      ${menu_items()}
      <li><a href="#explore"><i class="fas fa-search"></i> Finding aids</a></li>
      <li><a href="#scheme" class="scheme-toggle"><i class="fas fa-lightbulb"></i> Scheme</a></li>
    </ul>
  </nav>
</header>

<div id="wrapper"></div>`

    const wrapper = this.querySelector('#wrapper')
    wrapper.append(...content)
    this.append(nodes(pagination()))
    this.append(nodes(finding_aids(categories, tags)))
    this.append(nodes(colophon()))

    scheme_toggles(this)

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }
})


/** Returns the "Finding aids": search, subjects (tags), categories, theme picker -- as card catalog drawers */
function finding_aids(categories, tags) {
  const drawer = (label, htm, cls = '') => `
    <div class="drawer ${cls}">
      <div class="front"><span class="label">${label}</span><span class="pull"></span></div>
      <div class="contents">${htm}</div>
    </div>`

  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  const drawers = [
    cfg.header.search
      ? drawer('Search', `
        <input type="text" id="search-input" placeholder="Search the catalog" autocomplete="off">
        <div id="search-results"></div>`, 'search')
      : '',
    Object.keys(tags).length
      ? drawer(`<a href="${esc(state.top_page)}?tags">Subjects</a>`, `<p class="tagcloud">${tag_cloud(tags, 0.85, 1.5)}</p>`)
      : '',
    cfg.sidebar.categories && entries.length
      ? drawer(`<a href="${esc(state.top_page)}?categories">Categories</a>`, `
        <ul class="index">${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}</ul>`)
      : '',
    cfg.header.theme
      ? drawer('Theme', `<ul id="theme-menu" class="index">${theme_items()}</ul>`)
      : '',
  ].filter(Boolean)

  if (!drawers.length)
    return ''
  return `
<section id="explore" class="finding-aids">
  <h2>Finding aids</h2>
  <div class="drawers">${drawers.join('')}</div>
</section>`
}


/** Returns the colophon (footer): about, social links, credits */
function colophon() {
  const img = site_img()
  const icon = (cls) => `fa${cls.startsWith('brands') ? 'b' : 's'} ${cls.split(' ').pop()}`
  const social = social_list().map((e) => `<a href="${esc(e.href)}" title="${esc(e.title)}" ${e.title === 'RSS' ? 'type="application/rss+xml"' : `target="_blank" rel="${e.rel}"`}><i class="${icon(e.cls)}"></i></a>`).join(' ')
  const year = state.newest?.slice(0, 4) ?? ''
  return `
<footer class="colophon">
  ${img ? `<img class="avatar" src="${esc(img)}" alt="">` : ''}
  ${cfg.sidebar.about ? `<p>${cfg.sidebar.about}</p>` : ''}
  ${social ? `<p class="social">${social}</p>` : ''}
  <p class="credits sans">
    ${cfg.copyright ? esc(cfg.copyright) : `&copy; ${esc(year)} ${esc(cfg.author ?? cfg.title)}`}.
    Set in ET Book &amp; Courier Prime.
    Design: Librarian, on <a href="https://edwardtufte.github.io/tufte-css/" target="_blank" rel="noopener">Tufte CSS</a>.
    Powered by <a href="https://blogtini.com/" target="_blank" rel="noopener">blogtini.com</a>.
  </p>
</footer>`
}


customElements.define('bt-posts', class extends HTMLElement {
  connectedCallback() {
    const posts = [...this.querySelectorAll('bt-post')].map((e) => [e.getAttribute('url'), e.id])

    let title = 'Card catalog'
    if (state.filter_tag)
      title = `Subject: ${state.filter_tag}`
    else if (state.filter_cat)
      title = `Category: ${state.filter_cat}`
    if (state.page)
      title += `, drawer ${state.page + 1}`

    this.replaceWith(nodes(`
<section class="catalog">
  <h2>${esc(title)}</h2>
  <div class="cards">${posts.map(([url, id]) => card(url, id)).join('')}</div>
</section>`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`<div class="cards">${card(this.getAttribute('url'), this.id)}</div>`))
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    // the homepage's own content: a short article, before the card catalog
    if (post.type === 'homepage') {
      this.replaceWith(nodes(`<article class="homepage"><section class="post-body">${body}</section></article>`))
      highlight_code()
      return
    }

    const is_post = !post.type || post.type === 'post'
    const tracings = subjects(post).map(([name, link], n) => `${n + 1}. <a href="${esc(link)}">${esc(name)}</a>.`)
    const slip = is_post && cfg.reading_time
      ? `
      <p class="slip-anchor"><span class="marginnote due-slip">
        <span class="slip-head">Date due</span>
        ${stamp(post, 'Reading time')}
        <span class="slip-rule"></span><span class="slip-rule"></span><span class="slip-rule"></span>
      </span></p>`
      : ''

    const frag = nodes(`
<article class="post">
  <h1>${esc(post.title)}</h1>
  ${is_post ? `<p class="subtitle">${esc(day(post.date))}${post.author ? ` &middot; ${esc(post.author)}` : ''}</p>` : ''}
  <section class="post-body">
    ${slip}
    ${post.featured
      ? `
    <figure class="featured">
      ${post.featuredcaption ? `<span class="marginnote">${esc(post.featuredcaption)}</span>` : ''}
      <img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt)}">
    </figure>`
      : ''}
    ${body}
  </section>
  ${tracings.length ? `<section class="tracings-full"><p><span class="sans">Subjects:</span> ${tracings.join(' ')}</p></section>` : ''}
  ${comments(post)}
</article>`)
    const section = frag.querySelector('.post-body')
    captions(section)
    if (is_post)
      see_also(section, post)
    this.replaceWith(frag)

    highlight_code()
  }
})


/**
 * A picture alone in its paragraph, w/ alt text, becomes a figure -- its alt text a caption, in the margin.
 * (So a screenshot of a page, in a page, says what it is)
 */
function captions(section) {
  for (const img of section.querySelectorAll(':scope > p img[alt]:not([alt=""])')) {
    const p = img.closest('p')
    const only = p.textContent.trim() === '' && p.querySelectorAll('img').length === 1
    if (!only || p.parentElement !== section)
      continue
    const figure = document.createElement('figure')
    const note = document.createElement('span')
    note.className = 'marginnote'
    note.textContent = img.getAttribute('alt')
    figure.append(note, ...p.childNodes)
    p.replaceWith(figure)
  }
}


/**
 * "See also", in the margin about halfway down: up to 3 other posts sharing the most subjects w/ this one --
 * like a catalog card's "see also" references.  (Nothing, if none share any)
 */
function see_also(section, post) {
  const mine = new Set([...(post.categories ?? []), ...(post.tags ?? [])])
  const related = all_posts()
    .filter((e) => e.url !== post.url && (!e.type || e.type === 'post'))
    .map((e) => [e, [...(e.categories ?? []), ...(e.tags ?? [])].filter((s) => mine.has(s)).length])
    .filter(([, shared]) => shared)
    .sort((a, b) => b[1] - a[1]) // (stable: ties stay newest first)
    .slice(0, 3)
    .map(([e]) => e)
  const paras = [...section.querySelectorAll(':scope > p:not(.slip-anchor)')]
  if (!related.length || !paras.length)
    return

  const note = nodes(`
<span class="marginnote see-also">
  <span class="see-head">See also</span>
  ${related.map((e) => `<a href="${esc(urlify(e.url))}">${esc(e.title)}</a>`).join('')}
</span>`)
  const p = paras[Math.floor(paras.length / 2)]
  p.prepend(note)
}


customElements.define('bt-histogram', class extends HTMLElement {
  connectedCallback() {
    const type = state.list_tags ? 'tags' : 'categories'
    const histogram = JSON.parse(this.getAttribute('histogram') || '{}')
    this.replaceWith(nodes(`
<article class="histogram">
  <h1>${type === 'tags' ? 'Subject headings' : 'Categories'}</h1>
  <section><ul class="index">${histogram_items(type, histogram)}</ul></section>
</article>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
<article class="contact">
  <h1>Ask a librarian</h1>
  <section>${contact_form()}</section>
</article>`))
  }
})
