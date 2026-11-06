/*
  Dossier theme -- an original blogtini theme: classified case files, straight out of the spy movies.
  (No real agencies -- just the markings & the mood.)  All light DOM, like librarian & the HTML5 UP ports.

  - homepage, tags, categories: "Case files" -- each post a file folder: its tab (a file number from the date),
    typed fields (subject, filed, agent), a paper-clipped photo, a summary w/ a few small words blacked out,
    "known associates" (its tags), & two rubber stamps: a classification marking (TOP SECRET, EYES ONLY, ...)
    & "BRIEFING: 4 MIN" (the reading time)
  - a post: the file itself -- a typed sheet, its photos as "exhibits", markdown ~~strikethrough~~ as redactions
  - photos are black & white -- & hovering one (w/ a mouse) puts a spy camera's zoom lens on it, in color
  - classification banners top & bottom; "Archives" (search, associates, departments, theme picker) at the end
  `<bt-body>` writes those & moves blogtini's content into `#wrapper`; the rest replace themselves w/ plain html.
*/

import {
  cfg, state, url2post, urlify, summarize_markdown, markdown_to_html, datetime, imgurl, reveal,
  word_count, reading_time,
} from '../../index.js'
import { vrsort } from '../../js/text.js'
import {
  esc, nodes, post_img, menu_items, theme_items, scheme_toggles, social_list, pager, comments,
  highlight_code, histogram_items, tag_cloud, contact_form,
} from '../html5up/shared.js'


// the rubber stamps a file can get -- each post always gets the same one
const MARKINGS = [
  'Top Secret', 'Secret', 'Classified', 'Confidential', 'Eyes Only', 'For Official Use Only', 'Restricted',
  'Need to Know', 'Declassified', 'Burn After Reading', 'Do Not Copy', 'Noforn',
]

// small connecting words -- a few get blacked out in each summary.  (Never the post itself)
const FILLER = new Set([
  'the', 'and', 'of', 'to', 'a', 'an', 'in', 'that', 'is', 'for', 'with', 'as', 'on', 'it', 'was', 'but', 'or', 'at',
  'by', 'from', 'its', 'this', 'so', 'just',
])

// the zoom lens' magnification
const ZOOM = 3

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

/** Returns a post's file number, from its date (& title), eg: '26-1027-B' */
function file_number(post) {
  let ymd = ''
  try {
    ymd = new Date(post.date).toISOString().slice(0, 10)
  } catch {
    return 'XX-XXXX'
  }
  const letter = String.fromCharCode(65 + (hash(post.title ?? '') % 26))
  return `${ymd.slice(2, 4)}-${ymd.slice(5, 7)}${ymd.slice(8, 10)}-${letter}`
}

/** Returns a post's agent (author) -- or, w/o one, a blacked out name */
function agent(post) {
  const name = post.author ?? cfg.author
  return name ? esc(name) : '<span class="redact" title="redacted">J. Doe</span>'
}

/**
 * Returns a red rubber stamp: a classification marking -- each post's own, at its own slight angle
 *
 * @param {string} cls  extra class, eg: 'big'
 */
function marking(post, cls = '') {
  const h = hash(post.url ?? '')
  const tilt = (h % 15) - 9 // -9 .. 5 degrees
  return `<span class="stamp marking ${cls}" style="--tilt: ${tilt}deg">${esc(MARKINGS[(h >>> 4) % MARKINGS.length])}</span>`
}

/** Returns the reading time stamp -- or '' if `reading_time: false` */
function briefing(post) {
  if (!cfg.reading_time)
    return ''
  const tilt = (hash(post.title ?? '') % 9) - 2 // -2 .. 6 degrees
  return `<span class="stamp briefing" style="--tilt: ${tilt}deg"><small>Briefing</small><b>${reading_time(post)} min</b></span>`
}

/**
 * Returns a summary's text as html, w/ 2-3 of its small connecting words blacked out -- the same ones each visit.
 * (The words stay in the page: screen readers & search still see them -- & hovering one reveals it)
 */
function redacted(text, seed) {
  const words = text.split(/(\s+)/)
  const spots = words.map((w, i) => [w, i]).filter(([w]) => FILLER.has(w.toLowerCase().replace(/[^a-z]/g, '')))
    .map(([, i]) => i)
  const picks = new Set()
  const n = Math.min(spots.length, 2 + (seed % 2))
  // (`Math.imul`: an exact 32-bit multiply -- a plain `*` loses the low bits past 2^53, & `h` gets stuck.
  // And a cap on tries, so it can never spin forever)
  let h = seed
  for (let tries = 0; picks.size < n && tries < 100; tries++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0
    picks.add(spots[(h >>> 8) % spots.length])
  }
  return words.map((w, i) => (picks.has(i) ? `<span class="redact" title="redacted">${esc(w)}</span>` : esc(w))).join('')
}

/** Returns a post's "known associates": its category & tag links */
function associates(post) {
  const links = [
    ...(post.categories ?? []).map((e) => `<a href="${esc(state.top_page)}?categories/${esc(e)}">${esc(e)}</a>`),
    ...(post.tags ?? []).map((e) => `<a href="${esc(state.top_page)}?tags/${esc(e)}">#${esc(e)}</a>`),
  ]
  return links.length ? `<p class="associates"><span>Known associates:</span> ${links.join(' ')}</p>` : ''
}


/** Returns a post's file folder, for a list of posts */
function folder(url, id) {
  const post = url2post(url)
  if (!post)
    return ''
  const href = esc(urlify(post.url))
  const img = post_img(post)
  const summary = nodes(summarize_markdown(post.body_raw ?? '', 260)).textContent.trim()

  return `
<article class="folder" ${id ? `id="${esc(id)}"` : ''}>
  <div class="tab">File no. ${esc(file_number(post))}</div>
  <div class="sheet">
    <div class="file-head">
      <dl class="fields">
        <dt>Subject</dt><dd><a href="${href}">${esc(post.title)}</a></dd>
        <dt>Filed</dt><dd>${esc(day(post.date))}</dd>
        <dt>Agent</dt><dd>${agent(post)}</dd>
      </dl>
      ${img ? `<a class="exhibit photo" href="${href}"><span class="clip"></span><img src="${esc(img)}" alt="" loading="lazy"></a>` : ''}
    </div>
    ${summary ? `<p class="summary">${redacted(summary, hash(post.url ?? ''))}</p>` : ''}
    ${associates(post)}
    <p class="open-file"><a href="${href}">[ Open file ]</a></p>
    ${marking(post)}
    ${briefing(post)}
  </div>
</article>`
}


/** Returns prior & next links: for boxes of files (pages of posts), or a file's neighbors */
function pagination() {
  const pg = pager()
  if (!pg)
    return ''
  const [left, rite] = pg.single ? ['Previous file', 'Next file'] : ['Prior box', 'Next box']
  return `
<nav class="shelf">
  ${pg.left_url ? `<a href="${esc(pg.left_url)}" class="prior"><small>&larr; ${left}</small>${pg.single ? esc(pg.left_title) : ''}</a>` : '<span></span>'}
  ${pg.rite_url ? `<a href="${esc(pg.rite_url)}" class="next"><small>${rite} &rarr;</small>${pg.single ? esc(pg.rite_title) : ''}</a>` : '<span></span>'}
</nav>`
}


customElements.define('bt-body', class extends HTMLElement {
  connectedCallback() {
    if (this.rendered)
      return
    this.rendered = true

    // blogtini's main content -- eg: `<bt-posts>`.  (minus any `<hr>`)
    const content = [...this.childNodes].filter((e) => e.nodeName !== 'HR')

    const categories = JSON.parse(this.getAttribute('categories') || '{}')
    const tags = JSON.parse(this.getAttribute('tags') || '{}')
    const banner = '<div class="banner">Unclassified // For blog use only</div>'

    this.innerHTML = `
${banner}
<header class="masthead">
  ${is_home()
    ? `<h1 class="agency">${esc(cfg.title)}</h1>
       <p class="division">Central Files &middot; Records Division</p>
       ${cfg.intro?.paragraph ? `<p class="motto">${cfg.intro.paragraph}</p>` : ''}`
    : `<p class="agency"><a href="${esc(state.top_page)}">${esc(cfg.title)}</a></p>
       <p class="division">Central Files &middot; Records Division</p>`}
  <nav>
    <ul>
      ${menu_items()}
      <li><a href="#archives"><i class="fas fa-search"></i> Archives</a></li>
      <li><a href="#scheme" class="scheme-toggle"><i class="fas fa-lightbulb"></i> Scheme</a></li>
    </ul>
  </nav>
</header>

<main id="wrapper"></main>`

    const wrapper = this.querySelector('#wrapper')
    wrapper.append(...content)
    this.append(nodes(pagination()))
    this.append(nodes(archives(categories, tags)))
    this.append(nodes(footer()))
    this.append(nodes(banner))

    scheme_toggles(this)
    lens(this)

    // the content's elements render right after this -- then show the page
    requestAnimationFrame(() => reveal())
  }
})


/** Returns the "Archives": search, known associates (tags), departments (categories), theme picker */
function archives(categories, tags) {
  const entries = cfg.sidebar.categories_by_count
    ? Object.entries(vrsort(categories))
    : Object.entries(categories)
  const boxes = [
    cfg.header.search
      ? `
    <div class="box search">
      <h3>Query the archives</h3>
      <input type="text" id="search-input" placeholder="Enter search terms" autocomplete="off" spellcheck="false">
      <div id="search-results"></div>
    </div>`
      : '',
    Object.keys(tags).length
      ? `
    <div class="box">
      <h3><a href="${esc(state.top_page)}?tags">Known associates</a></h3>
      <p class="tagcloud">${tag_cloud(tags, 0.85, 1.5)}</p>
    </div>`
      : '',
    cfg.sidebar.categories && entries.length
      ? `
    <div class="box">
      <h3><a href="${esc(state.top_page)}?categories">Departments</a></h3>
      <ul class="index">${entries.map(([cat, cnt]) => `<li><a href="${esc(state.top_page)}?categories/${esc(cat)}">${esc(cat.toLowerCase())}</a> <span class="count">${cnt}</span></li>`).join('')}</ul>
    </div>`
      : '',
    cfg.header.theme
      ? `
    <div class="box">
      <h3>Change cover</h3>
      <ul id="theme-menu" class="index">${theme_items()}</ul>
    </div>`
      : '',
  ].filter(Boolean)

  if (!boxes.length)
    return ''
  return `
<section id="archives" class="archives">
  <h2>Archives</h2>
  <div class="boxes">${boxes.join('')}</div>
</section>`
}


/** Returns the footer: social links, credits */
function footer() {
  const icon = (cls) => `fa${cls.startsWith('brands') ? 'b' : 's'} ${cls.split(' ').pop()}`
  const social = social_list().map((e) => `<a href="${esc(e.href)}" title="${esc(e.title)}" ${e.title === 'RSS' ? 'type="application/rss+xml"' : `target="_blank" rel="${e.rel}"`}><i class="${icon(e.cls)}"></i></a>`).join(' ')
  const year = state.newest?.slice(0, 4) ?? ''
  return `
<footer class="colophon">
  ${social ? `<p class="social">${social}</p>` : ''}
  <p>${cfg.copyright ? esc(cfg.copyright) : `&copy; ${esc(year)} ${esc(cfg.author ?? cfg.title)}`}.
    This document is unclassified.  Probably.</p>
  <p class="credits">Design: Dossier.  Powered by <a href="https://blogtini.com/" target="_blank" rel="noopener">blogtini.com</a>.</p>
</footer>`
}


/**
 * The spy camera's zoom lens: hovering a photo (w/ a mouse or pen) shows it magnified -- & in color -- under a
 * round lens w/ crosshairs.  (Touch screens have no hover: they just see the photos)
 */
function lens(btbody) {
  const glass = nodes('<div class="lens" hidden><span>Enhance &times;3</span></div>').firstElementChild
  btbody.append(glass)

  let shown = null // the img the lens is on
  btbody.addEventListener('pointermove', (evt) => {
    // (not Exhibit A: its own hover zooms it)
    const img = evt.pointerType === 'touch' ? null : evt.target.closest?.('.folder .photo img, .post-body img')
    if (!img) {
      glass.hidden = true
      shown = null
      return
    }
    const r = img.getBoundingClientRect()
    const size = glass.offsetWidth || 180
    if (shown !== img) {
      shown = img
      glass.style.backgroundImage = `url("${(img.currentSrc || img.src).replace(/"/g, '%22')}")`
    }
    glass.hidden = false
    glass.style.left = `${evt.clientX}px`
    glass.style.top = `${evt.clientY}px`
    glass.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`
    glass.style.backgroundPosition =
      `${(size / 2) - ((evt.clientX - r.left) * ZOOM)}px ${(size / 2) - ((evt.clientY - r.top) * ZOOM)}px`
  })
  btbody.addEventListener('pointerleave', () => {
    glass.hidden = true
    shown = null
  })
}


customElements.define('bt-posts', class extends HTMLElement {
  connectedCallback() {
    const posts = [...this.querySelectorAll('bt-post')].map((e) => [e.getAttribute('url'), e.id])

    let title = 'Case files'
    if (state.filter_tag)
      title = `Known associates of #${state.filter_tag}`
    else if (state.filter_cat)
      title = `Department: ${state.filter_cat}`
    if (state.page)
      title += `, box ${state.page + 1}`

    this.replaceWith(nodes(`
<section class="case-files">
  <h2>${esc(title)}</h2>
  <div class="folders">${posts.map(([url, id]) => folder(url, id)).join('')}</div>
</section>`))
  }
})

// (normally inside `<bt-posts>`, which renders them itself)
customElements.define('bt-post', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`<div class="folders">${folder(this.getAttribute('url'), this.id)}</div>`))
  }
})


customElements.define('bt-post-full', class extends HTMLElement {
  connectedCallback() {
    const post = url2post(this.getAttribute('url'))
    if (!post)
      return
    const body = markdown_to_html(post.body_raw)

    // the homepage's own content: a briefing memo, before the case files
    if (post.type === 'homepage') {
      this.replaceWith(nodes(`
<article class="memo">
  <div class="sheet">
    <p class="memo-head">Memorandum &middot; Briefing for all personnel</p>
    <div class="post-body">${body}</div>
  </div>
</article>`))
      highlight_code()
      return
    }

    const is_post = !post.type || post.type === 'post'
    const featured = post.featured
      ? `
    <figure class="exhibit photo">
      <span class="clip"></span>
      <div class="surveil">
        <img src="${esc(imgurl(post, true, true))}" alt="${esc(post.featuredalt ?? '')}">
        ${surveillance(post)}
      </div>
      <figcaption>Exhibit A${post.featuredcaption ? `: ${esc(post.featuredcaption)}` : ''}</figcaption>
    </figure>`
      : ''

    // a coffee ring, by "-- End of file --" (away from the photos) -- each post's a bit to the left or right
    const h = hash(post.url ?? '')
    const ring = `--ring-x: ${8 + (h % 70)}%; --ring-y: ${-60 + ((h >>> 6) % 40)}px; --ring-turn: ${h % 360}deg`

    const frag = nodes(`
<article class="dossier" style="${ring}">
  <div class="tab">File no. ${esc(file_number(post))}</div>
  <div class="sheet">
    ${marking(post, 'big')}
    <h1>${esc(post.title)}</h1>
    ${is_post
      ? `
    <dl class="fields">
      <dt>Filed</dt><dd>${esc(day(post.date))}</dd>
      <dt>Agent</dt><dd>${agent(post)}</dd>
      <dt>Clearance</dt><dd>Public</dd>
      ${cfg.reading_time ? `<dt>Briefing</dt><dd>${reading_time(post)} min (${word_count(post).toLocaleString('en')} words)</dd>` : ''}
    </dl>`
      : ''}
    ${featured}
    <div class="post-body">${body}</div>
    ${associates(post)}
    <p class="end-of-file">-- End of file --</p>
    ${is_post ? routing(post) : ''}
    ${comments(post)}
  </div>
</article>`)
    exhibits(frag.querySelector('.post-body'), post.featured ? 1 : 0)
    this.replaceWith(frag)

    highlight_code()
  }
})


/**
 * Returns Exhibit A's surveillance bits: a camera's viewfinder (see index.css .viewfinder) & a camera
 * timestamp, eg: `CAM 03 · 2026-10-27 14:32:07` -- the post's date (& time, else a made up one).
 * Hover: the photo zooms a little, in color -- the viewfinder fades
 */
function surveillance(post) {
  const h = hash(`${post.url ?? ''}target`)
  let stamp = ''
  try {
    const d = new Date(post.date)
    const iso = d.toISOString()
    const ymd = iso.slice(0, 10)
    // a date w/o a time (UTC midnight)?  The camera still caught it at some time of day
    const hms = iso.endsWith('T00:00:00.000Z')
      ? [9 + ((h >>> 3) % 11), (h >>> 5) % 60, (h >>> 9) % 60].map((n) => `${n}`.padStart(2, '0')).join(':')
      : d.toTimeString().slice(0, 8)
    stamp = `CAM ${`${1 + ((h >>> 12) % 9)}`.padStart(2, '0')} &middot; ${ymd} ${hms}`
    /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
  } catch {}
  return `
        <span class="viewfinder"><span class="split"></span><span class="split lighter"></span><span class="center"></span></span>
        ${stamp ? `<span class="camstamp">${stamp}</span>` : ''}`
}

/** Returns a file's routing slip: who gets copies, its document number & page */
function routing(post) {
  return `
    <div class="routing">
      <p><span>Distribution:</span> File &middot; Director &middot;
        <span class="redact" title="redacted">Agent K</span> &middot; You</p>
      <p><span>Doc. no.</span> ${esc(file_number(post))}/01 &middot; <span>Page</span> 1 of 1 &middot;
        <span>Copy</span> ${1 + (hash(post.title ?? '') % 7)} of 7</p>
    </div>`
}


/**
 * A picture alone in its paragraph becomes an exhibit: "Exhibit B: <its alt text>" -- lettered after the
 * featured photo (Exhibit A), if any
 */
function exhibits(body, start) {
  let n = start
  for (const img of body.querySelectorAll(':scope > p img')) {
    const p = img.closest('p')
    if (p.parentElement !== body || p.textContent.trim() !== '' || p.querySelectorAll('img').length !== 1)
      continue
    const fig = document.createElement('figure')
    fig.className = 'exhibit photo'
    const cap = document.createElement('figcaption')
    const alt = img.getAttribute('alt')
    cap.textContent = `Exhibit ${String.fromCharCode(65 + (n % 26))}${alt ? `: ${alt}` : ''}`
    n += 1
    fig.append(...p.childNodes, cap)
    p.replaceWith(fig)
  }
}


customElements.define('bt-histogram', class extends HTMLElement {
  connectedCallback() {
    const type = state.list_tags ? 'tags' : 'categories'
    const histogram = JSON.parse(this.getAttribute('histogram') || '{}')
    this.replaceWith(nodes(`
<article class="dossier">
  <div class="sheet">
    <h1>${type === 'tags' ? 'Known associates' : 'Departments'}</h1>
    <ul class="index">${histogram_items(type, histogram)}</ul>
  </div>
</article>`))
  }
})


customElements.define('bt-contact', class extends HTMLElement {
  connectedCallback() {
    this.replaceWith(nodes(`
<article class="dossier contact">
  <div class="sheet">
    <h1>Leave a dead drop</h1>
    ${contact_form()}
  </div>
</article>`))
  }
})
