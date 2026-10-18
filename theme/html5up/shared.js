/*
  Shared helpers for the light DOM ports of HTML5 UP themes (eg: editorial, massively).
  This dir is not a theme itself -- it also has their shared Font Awesome & self-hosted fonts.
  See THEMES.md
*/

import {
  cfg, state, url2post, imgurl, THEMES,
} from '../../index.js'
import { vrsort } from '../../js/text.js'
// comments are reused from future-imperfect, as is (lit, w/ shadow DOM)
import '../future-imperfect/bt-comments.js'
import '../future-imperfect/bt-comment.js'
import { css_hljs } from '../future-imperfect/css.js'


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

/** Returns the site's image (eg: for an "about" section) or '' */
function site_img() {
  if (!cfg.img_site)
    return ''
  return cfg.img_site.startsWith('https://') ? cfg.img_site : `${state.top_dir}${cfg.img_site}`
}

/** Returns a menu url, relative to this page */
function navurl(url) {
  const ret = `${state.top_dir}${url.replace(/^\/+/, '').concat(state.filedev ? 'index.html' : '')}`
  return ret === '' ? './' : ret
}

/** Returns `<li>`s of `config.yml` `menu.main` links */
function menu_items() {
  return (cfg.menu?.main ?? []).map((e) => `<li><a href="${esc(navurl(e.url))}">${e.pre ?? ''} ${esc(e.name)}</a></li>`).join('')
}

/** Returns `<li>`s for the theme picker -- for inside a `<ul id="theme-menu">` (blogtini finds its links) */
function theme_items() {
  return THEMES.map((e) => `<li><a href="#">${e.replace(/-/g, ' ')}</a></li>`).join('')
}

/**
 * Wires up `.scheme-toggle` links (the light/dark lightbulb).
 * (blogtini's `index.js` remembers the viewer's pick)
 */
function scheme_toggles(root) {
  root.querySelectorAll('.scheme-toggle').forEach((e) => e.addEventListener('click', (evt) => {
    evt.preventDefault()
    const scheme_now = document.documentElement.getAttribute('scheme')
    document.documentElement.setAttribute('scheme', scheme_now === 'dark' ? 'light' : 'dark')
  }))
}

/** Returns the copyright line's html, crediting the HTML5 UP theme (CC BY 3.0) */
function copyright(theme_name, theme_url) {
  return `${cfg.copyright ? esc(cfg.copyright) : `&copy; ${esc(state.newest?.slice(0, 4) ?? '')} ${esc(cfg.author ?? cfg.title)}`}.
    Design: <a href="${esc(theme_url)}" target="_blank" rel="noopener">${esc(theme_name)} by HTML5 UP</a>.
    Powered by <a href="https://blogtini.com/" target="_blank" rel="noopener">blogtini.com</a>.`
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

/**
 * Returns `<li>`s of the site's social links (`config.yml` `social`), HTML5 UP `ul.icons` style
 *
 * @param {string} extra_cls  eg: 'alt' -- for icons on a light background, in some themes
 */
function social_icons(extra_cls = '') {
  const rss = cfg.social?.rss
    ? `<li><a href="${esc(state.top_dir + cfg.social.rss)}" class="icon solid ${extra_cls} fa-rss" type="application/rss+xml"><span class="label">RSS</span></a></li>`
    : ''
  return rss + SOCIAL.map(([svc, url, title, cls]) => {
    const val = cfg.social?.[svc]
    if (val === '' || val === undefined || val === null)
      return ''
    const rel = svc === 'mastodon' ? 'me' : 'noopener'
    return `<li><a href="${esc(url(val))}" class="icon ${cls} ${extra_cls}" title="${title}" target="_blank" rel="${rel}"><span class="label">${title}</span></a></li>`
  }).join('')
}


/**
 * Returns the prior & next links: for pages of posts, or a single post's neighbors -- or null.
 * (same logic as future-imperfect)
 *
 * @returns {{ left_url, left_title, rite_url, rite_title, single: boolean }|null}  urls null when no link
 */
function pager() {
  if (!state.show_previous_and_next)
    return null

  const page_is_home = !state.filter_tag && !state.filter_cat
  const page_base = location.href.split('#')[0].replace(/\/page\/\d+/, '').replace(/(\?.*$)/, page_is_home ? '' : '$1')
  const page_sep = page_is_home ? '?' : '/'

  const left = state.page > 0 ? state.page - 1 : null
  const rite = state.page_more ? state.page + 1 : null
  const ret = {
    left_url: left === null ? null : `${page_base}${left ? `${page_sep}page/${1 + left}` : ''}`,
    rite_url: rite === null ? null : `${page_base}${page_sep}page/${1 + rite}`,
    left_title: 'Prior Page',
    rite_title: 'Next Page',
    single: false,
  }

  if (state.filter_post_url) {
    ret.single = true
    ret.left_url = state.filter_post_url_prior || null
    ret.rite_url = state.filter_post_url_next || null
    if (ret.left_url)
      ret.left_title = url2post(ret.left_url)?.title ?? ret.left_title
    if (ret.rite_url)
      ret.rite_title = url2post(ret.rite_url)?.title ?? ret.rite_title
  }

  return ret.left_url || ret.rite_url ? ret : null
}


/** Returns the id blogtini comments are filed under, for a post.  (same as future-imperfect) */
function comments_entryid(post) {
  const relative_path = post.url.startsWith(cfg.site_url)
    ? post.url.slice(cfg.site_url.length)
    : post.url
  return new URL(relative_path, 'https://blogtini.com').pathname.replace(/^\/+/, '').replace(/\/+$/, '')
}

/** Returns `<bt-comments>` for a post -- or '' if not a post, or comments are off */
function comments(post) {
  return post.type === 'post' && cfg.staticman?.enabled
    ? `<bt-comments entryid="${esc(comments_entryid(post))}"></bt-comments>`
    : ''
}

/** Returns a post's category & tag links */
function taxonomy(post) {
  return [
    ...(post.categories ?? []).map((e) => `<a href="${esc(state.top_page)}?categories/${esc(e)}" class="icon solid fa-folder"> ${esc(e)}</a>`),
    ...(post.tags ?? []).map((e) => `<a href="${esc(state.top_page)}?tags/${esc(e)}" class="icon solid fa-tag"> ${esc(e)}</a>`),
  ].join(' ')
}

/** Adds code highlighting to the page's `.post-body pre code` blocks */
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


/** Returns the `<li>`s of a tags or categories list, w/ counts, most used first */
function histogram_items(type, histogram) {
  return Object.entries(vrsort(histogram)).map(([key, cnt]) => `<li><a href="${esc(state.top_page)}?${type}/${esc(key)}">${esc(key)}</a> <span class="count">${cnt}</span></li>`).join('')
}

/** Returns a tag cloud's links: more used, bigger */
function tag_cloud(tags, rem_min = 0.8, rem_max = 1.8) {
  const counts = Object.values(tags)
  if (!counts.length)
    return ''
  const cnt_min = Math.min(...counts)
  const cnt_max = 1 + Math.max(...counts)
  return Object.entries(tags).map(([tag, cnt]) => {
    const weight = (Math.log(cnt) - Math.log(cnt_min)) / (Math.log(cnt_max) - Math.log(cnt_min))
    const size = (rem_min + ((rem_max - rem_min) * weight)).toFixed(1)
    return `<a href="${esc(state.top_page)}?tags/${esc(tag)}" style="font-size: ${size}rem">${esc(tag.toLowerCase())}</a>`
  }).join(' ')
}

/** Returns the contact form (`config.yml` `contact`), HTML5 UP `row` grid style */
function contact_form() {
  return `
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
</form>`
}


/**
 * Stops animations/transitions (HTML5 UP's `body.is-preload`) until the page has rendered.
 */
function preload() {
  document.body.classList.add('is-preload')
  setTimeout(() => document.body.classList.remove('is-preload'), 100)
}


export {
  esc, nodes, post_img, site_img, navurl, menu_items, theme_items, scheme_toggles, copyright,
  social_icons, pager, comments, taxonomy, highlight_code, histogram_items, tag_cloud,
  contact_form, preload,
}
