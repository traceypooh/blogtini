/* eslint-disable no-use-before-define */
import { unsafeHTML } from 'https://esm.ext.archive.org/lit@3.2.1/directives/unsafe-html.js'
import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import { css_buttons, css_headers, css_links } from './index.js'
import {
  cfg, state, PR, path_to_theme_url,
} from '../../js/blogtini.js'


customElements.define('bt-body', class extends LitElement {
  static get properties() {
    return {
      tags: { type: Object },
      // xxx could support cfg.sidebar.categories_by_count option..
      categories: { type: Object },
      recent_posts: { type: Object },
    }
  }

  // eslint-disable-next-line class-methods-use-this
  updated() {
    // eslint-disable-next-line no-promise-executor-return
    new Promise((r) => requestAnimationFrame(r)).then(() => {
      document.querySelector('body').style.display = 'block' // SSR step hides body until now
    })
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    const page_is_home = !state.filter_tag && !state.filter_cat
    const page_base = location.href.replace(/\/page\/\d+/, '').replace(/(\?.*$)/, page_is_home ? '' : '$1')
    const page_left = state.page > 0 ? state.page - 1 : null
    const page_rite = state.page_more ? state.page + 1 : null

    const page_sep = page_is_home ? '?' : '/'
    const page_left_url = `${page_base}${page_left ? `${page_sep}page/${1 + page_left}` : ''}`
    const page_rite_url = `${page_base}${page_sep}page/${1 + page_rite}`

    const navurl = (e) => {
      const url =
        `${state.top_dir}${e.url.replace(/^\/+/, '').concat(state.filedev ? 'index.html' : '')}`
      return (url === '') ? './' : url
    }

    // NOTE: for single page/post pages, this gets replaced w/ the more specific post info
    const share_generic = { url: location.href, title: cfg.title }

    const img_intro = cfg.img_site.startsWith('https://') ? cfg.img_site : `${state.top_dir}${cfg.img_site}`

    return html`
<link href="${path_to_theme_url('css/css.css')}" rel="stylesheet" type="text/css"/><!-- xxx -->
<link href="${path_to_theme_url('css/fontawesome.css')}" rel="stylesheet" type="text/css"/>

<header id="site-header">
  <nav id="site-nav">
    <h1 class="nav-title">
      <a href="${state.top_page}" class="nav">
        <!-- {{ if or .IsHome (not .Site.Params.header.dynamicTitles) }}
          {{ .Site.Params.header.navbarTitle  | safeHTML }}
        {{ else }} -->
          ${cfg.title}
      </a>
    </h1>
    <menu id="site-nav-menu" class="flyout-menu menu">
      ${cfg.menu.main.map((e) => html`<a href="${navurl(e)}" class="nav link">${unsafeHTML(e.pre)} ${e.name}</a>`)}

      ${cfg.header.share ? html`<a href="#share-menu" class="nav link share-toggle" @click=${this.nav_toggle}><i class="fas fa-share-alt">&nbsp;</i>Share</a>` : ''}

      ${cfg.header.theme ? html`<a href="#theme-menu" class="nav link theme-toggle" @click=${this.nav_toggle}><i class="fas fa-palette">&nbsp;</i>Theme</a>` : ''}

      ${cfg.header.search ? html`<a href="#search-input" class="nav link search-toggle" @click=${this.nav_toggle}><i class="fas fa-search">&nbsp;</i>Search</a>` : ''}

      <a href="#scheme" class="nav link scheme-toggle" @click=${this.scheme_toggle}><i class="fas fa-lightbulb">&nbsp;</i>Scheme</a>

    </menu>
    <a href="#scheme" class="nav scheme-toggle" @click=${this.scheme_toggle}><i class="fas fa-lightbulb fa-2x">&nbsp;</i></a>
    ${cfg.header.search ? html`<a href="#search-input" class="nav search-toggle" @click=${this.nav_toggle}><i class="fas fa-search fa-2x">&nbsp;</i></a>` : ''}
    ${cfg.header.theme ? html`<a href="#theme-menu" class="nav theme-toggle" @click=${this.nav_toggle}><i class="fas fa-palette fa-2x">&nbsp;</i></a>` : ''}
    ${cfg.header.share ? html`<a href="#share-menu" class="nav share-toggle" @click=${this.nav_toggle}><i class="fas fa-share-alt fa-2x">&nbsp;</i></a>` : ''}
    ${cfg.header.language ? html`<a href="#lang-menu" class="nav lang-toggle" @click=${this.nav_toggle} lang="${cfg.language.lang}">${cfg.language.lang}</a>` : ''}
    <a href="#site-nav-menu" class="nav nav-toggle" @click=${this.nav_toggle}><i class="fas fa-bars fa-2x"></i></a>
  </nav>
  ${cfg.header.search ? html`<menu id="search" class="menu"><input id="search-input" class="search-input menu"></input><div id="search-results" class="search-results menu"></div></menu>` : ''}
  <!-- {{ if .Site.Params.header.languageMenu }}{{ partial "language-menu" . }}{{ end }} -->
  ${cfg.header.share ? html`
    <menu id="share-menu" class="flyout-menu menu">
      <h1>Share Post</h1>
      <bt-share .post=${share_generic}></bt-share>
    </menu>` : ''}
  ${cfg.header.theme ? html`
    <menu id="theme-menu" class="flyout-menu menu">
      <h1>Choose a theme</h1>
      <a href="#"><p>  future imperfect    </a>
      <a href="#"><p>  grid                </a>
    </menu>` : ''}
</header>

<div id="wrapper">
  <!-- xxx <section id="site-intro" {{ if (and (.Site.Params.intro.hideWhenSingleColumn) (not (and .Page.IsHome .Site.Params.intro.alwaysOnHomepage))) }}class="hidden-single-column"{{ end }}>
    {{ with .Site.Params.intro.pic }}<a href="{{ "/" | relLangURL}}"><img src="{{ .src | relURL }}"{{ with .shape}} class="{{ . }}"{{ end }} width="{{ .width | default "100" }}" alt="{{ .alt }}" /></a>{{ end }}
    <header>
      {{ with .Site.Params.intro.header }}<h1>{{ . | safeHTML }}</h1>{{ end }}
    </header> -->

  <section id="site-intro">
    <header>
      <img id="blogtini" src="${cfg.site_header}">
      <h1>
        <a href="${state.top_page}">
          ${cfg.img_site ? html`<img src="${img_intro}" class="${cfg.img_site_shape}">` : ''}<br>
          ${cfg.title}
        </a>
      </h1>
    </header>

    ${unsafeHTML(PR`<main><p>${cfg.intro?.paragraph}</p></main>`)}

    ${cfg.intro?.rss || cfg.intro?.social ? html`
      <footer>
        <ul class="socnet-icons">
          ${cfg.intro?.rss ? rss_icon() : ''}
          ${cfg.intro?.social ? socnet_icon() : ''}
        </ul>` : ''}
      </footer>
  </section>
  <main id="site-main">

    <slot></slot>

    <div class="pagination">
      ${page_left !== null ? html`<a href="${page_left_url}"
        class="button left"><span>Previous Page</span></a>` : ''}
      ${page_rite !== null ? html`<a href="${page_rite_url}"
        class="button right"><span>Next Page</span></a>` : ''}
    </div>

  </main>
  <bt-sidebar
    recent_posts="${JSON.stringify(this.recent_posts)}"
    categories="${JSON.stringify(this.categories)}"
    tags="${JSON.stringify(this.tags)}"
  ></bt-sidebar>

  <footer id="site-footer">
    ${cfg.footer?.rss || cfg.footer?.social ? html`
      <ul class="socnet-icons">
        ${cfg.footer?.rss ? rss_icon() : ''}
        ${cfg.footer?.social ? socnet_icon() : ''}
      </ul>` : ''}
    <p class="copyright">
      ${cfg.copyright ?? html`\u00A9 ${state.newest?.slice(0, 4) ?? ''} ${cfg.author ?? cfg.title}`}
      <br>
      ${cfg.attribution ? unsafeHTML(cfg.attribution) : ''}
    </p>
  </footer>
</div><!--//#wrapper-->

<a id="back-to-top" href="#" class="fas fa-arrow-up fa-2x" style="display:inline" @click=${this.back_to_top}></a>
`
  }

  firstUpdated() {
    // Whenever not at the top, show scroll up button
    const to_top_arrow = this.shadowRoot.querySelector('#back-to-top')
    if (document.documentElement.scrollTop || document.body.scrollTop)
      to_top_arrow.style.opacity = 1

    // For any scroll event, check if window isnt top, then display button
    window.addEventListener('scroll', () => {
      to_top_arrow.style.opacity = window.scrollY ? 1 : 0
    })
  }

  // eslint-disable-next-line class-methods-use-this
  nav_toggle(evt) {
    const menu = evt.currentTarget.hash // eg: `#theme-menu`

    if (this.shadowRoot.querySelector(menu).classList.contains('active')) {
      this.shadowRoot.querySelectorAll('.menu').forEach(
        (e) => e.classList.remove('active'),
      )
      this.shadowRoot.querySelector('#wrapper').classList.remove('overlay')
    } else {
      this.shadowRoot.querySelector('#wrapper').classList.add('overlay')

      this.shadowRoot.querySelectorAll('.menu').forEach(
        (e) => e.classList.remove('active'),
      )
      this.shadowRoot.querySelector(menu).classList.add('active')

      if (menu === '#search-input')
        this.shadowRoot.querySelector('#search-results').classList.add('active')
    }
  }

  // eslint-disable-next-line class-methods-use-this
  scheme_toggle() {
    const scheme_now = document.documentElement.getAttribute('scheme')
    document.documentElement.setAttribute('scheme', scheme_now === 'dark' ? 'light' : 'dark')
  }

  // eslint-disable-next-line class-methods-use-this
  back_to_top(evt) {
    // Click event to scroll to top
    const scrollToTop = () => {
      const c = document.documentElement.scrollTop || document.body.scrollTop
      if (c > 0) {
        window.requestAnimationFrame(scrollToTop)
        window.scrollTo(0, c - c / 15)
      }
    }
    evt.preventDefault()
    scrollToTop()
    return false
  }

  static get styles() {
    return [
      css`
.flyout-menu {
  background: var(--background1);
  border-left: 1px solid rgba(161, 161, 161, 0.3);
  height: 100%;
  margin-top: 3.5em;
  overflow-y: auto;
  padding: 0;
  position: fixed;
  top: 0;
  transition: 0.35s ease-in-out;
  z-index: 20;
}
.flyout-menu.active {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
  right: 0 !important;
}
.flyout-menu.active a {
  border-left: 0;
}
.flyout-menu h1 {
  font-size: 1em;
}

/* copied from '#share-menu' */
#theme-menu {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: center;
}
#theme-menu.flyout-menu {
  width: 177px;
  right: -177px;
  padding: 1em;
}
#theme-menu.flyout-menu h1 {
  font-size: 0.9em;
}
#theme-menu.flyout-menu h1,
#theme-menu.flyout-menu a {
  margin: 0.25em 0.25em;
}
@media (min-height: 600px) {
  #theme-menu.flyout-menu h1,
  #theme-menu.flyout-menu a {
    margin: 0 0.25em 0.75em 0;
  }
}
#theme-menu.flyout-menu a p {
  visibility: hidden;
}

/* copied from '.share-toggle' */
.theme-toggle {
  display: none;
}
@media (min-width: 425px) {
  .theme-toggle {
    display: block;
    text-align: center;
    width: 61px;
  }
  .theme-toggle i {
    vertical-align: middle;
  }
}

#site-nav .flyout-menu .theme-toggle {
  display: block;
  flex-basis: 100%;
  order: 3; /* xxx */
}
@media (min-width: 425px) {
  #site-nav .flyout-menu .theme-toggle {
    display: none;
  }
}

.search-input {
  background-color: white;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
  height: 0px;
  opacity: 0;
  transition: 0.35s ease-in-out;
  width: 300px;
  z-index: -1;
}
.search-input.active {
  opacity: 1;
  height: 50px;
  z-index: 0;
}

/* ==========================================================================
  IDs and Grid
  ========================================================================== */
#wrapper {
  display: -ms-grid;
  display: grid;
  grid-template-areas: "intro" "main" "sidebar" "footer";
  grid-template-rows: auto 1fr auto auto;
  margin: 0 auto;
  max-width: 90em;
  min-height: 100vh;
  transition: opacity 0.35s ease-in-out;
}
@media (min-width: 1024px) {
  #wrapper {
    grid-template-areas: "intro main" "sidebar main" "footer main" "blank main";
    grid-template-columns: 22em 1fr;
    grid-template-rows: auto auto auto 1fr;
    padding: 0 2.5em;
  }
}
#wrapper.overlay {
  opacity: 0.25;
}

#site-intro {
  grid-area: intro;
  align-items: center;
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
  margin-top: 0.5em;
  padding: 1em;
  text-align: center;
}
#site-intro a {
  border: 0;
}
#site-intro p {
  opacity: 0.6;
}
#site-intro header h1 {
  font-size: 1.25em;
  margin-bottom: 0;
}
#site-intro main p {
  font-size: 0.7em;
  letter-spacing: 0.25em;
  line-height: 2.5;
  margin-bottom: 0;
  text-transform: uppercase;
}

#site-main {
  grid-area: main;
}

#site-header {
  background: var(--background1);
  border-bottom: 1px solid rgba(161, 161, 161, 0.3);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
  height: 3.5em;
  line-height: 3.5em;
  position: fixed;
  margin-bottom: 3.5em;
  top: 0;
  width: 100%;
  z-index: 10000;
}

#site-nav {
  align-items: center;
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  justify-content: space-between;
}
#site-nav .flyout-menu {
  right: -177px;
  width: 177px;
}
@media (min-width: 1024px) {
  #site-nav .flyout-menu {
    background-color: unset;
    border: none;
    flex-grow: 1;
    height: auto;
    margin: 0;
    overflow: auto;
    position: static;
    transition: none;
    white-space: nowrap;
  }
  #site-nav .flyout-menu::-webkit-scrollbar {
    height: 0.25em;
  }
  #site-nav .flyout-menu::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  }
  #site-nav .flyout-menu::-webkit-scrollbar-thumb {
    background-color: #ababab;
    outline: 1px solid #6f8090;
  }
}
#site-nav .flyout-menu.active {
  flex-wrap: wrap;
}
@media (min-width: 1024px) {
  #site-nav .flyout-menu.active {
    box-shadow: none;
  }
}
#site-nav .flyout-menu .search-toggle {
  display: inline-flex;
  flex-basis: 100%;
  order: 1;
}
#site-nav .flyout-menu .share-toggle, #site-nav .flyout-menu .search-toggle, #site-nav .flyout-menu .scheme-toggle {
  display: block;
  flex-basis: 100%;
  order: 3;
}
@media (min-width: 425px) {
  #site-nav .flyout-menu .share-toggle, #site-nav .flyout-menu .search-toggle, #site-nav .flyout-menu .scheme-toggle {
    display: none;
  }
}

.share-toggle, .search-toggle, .scheme-toggle {
  display: none;
}
@media (min-width: 425px) {
  .share-toggle,
  .search-toggle,
  .scheme-toggle {
    display: block;
    text-align: center;
    width: 61px;
  }
  .share-toggle i,
  .search-toggle i,
  .scheme-toggle i {
    vertical-align: middle;
  }
}

.nav {
  border: 0;
  border-left: 1px solid rgba(161, 161, 161, 0.3);
  font-family: "Raleway", Helvetica, sans-serif;
  font-size: 0.7em;
  font-weight: 400;
  letter-spacing: 0.25em;
  margin: 0;
  padding: 0 1.5em;
  text-transform: uppercase;
}

.nav-title {
  align-items: center;
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-grow: 1;
  margin: 0;
}
.nav-title a {
  border: 0;
  font-size: 0.35em;
  font-weight: 800;
  margin-left: 1.5em;
  opacity: 1;
  padding: 0;
}
.nav-title a img {
  height: 4.8em;
  width: 12.6em;
}
@media (min-width: 1024px) {
  .nav-title {
    flex-grow: 0;
  }
  .nav-title::after {
    background: rgba(161, 161, 161, 0.3);
    content: "";
    display: block;
    height: 56px;
    margin-left: 1.5em;
    width: 1px;
  }
  .nav-title a {
    min-width: 12.5em;
  }
  .nav-title a img {
    margin-top: -0.2em;
  }
}

.nav-toggle {
  text-align: center;
  width: 61px;
}
@media (min-width: 1024px) {
  .nav-toggle {
    display: none;
  }
}
.nav-toggle i {
  vertical-align: middle;
}


#search {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 0;
}

#lang-menu.flyout-menu {
  right: -177px;
  width: 177px;
}
#lang-menu.flyout-menu a {
  border-left: 0;
}
#lang-menu.flyout-menu .link {
  border-bottom: 1px dotted rgba(161, 161, 161, 0.7);
  display: block;
}
#lang-menu.flyout-menu .no-lang {
  cursor: not-allowed;
  opacity: 0.25;
}
#lang-menu.flyout-menu .no-lang span:hover {
  box-shadow: none;
}

#share-menu {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: center;
}
#share-menu.flyout-menu {
  width: 177px;
  right: -177px;
  padding: 1em;
}
#share-menu.flyout-menu h1 {
  font-size: 0.9em;
}
#share-menu.flyout-menu h1,
#share-menu.flyout-menu a {
  margin: 0.25em 0.25em;
}
@media (min-height: 600px) {
  #share-menu.flyout-menu h1,
  #share-menu.flyout-menu a {
    margin: 0 0.25em 0.75em 0;
  }
}
#share-menu.flyout-menu a p {
  visibility: hidden;
}

/* Pagination */
.pagination {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 1.5em auto;
  padding: 1em;
  max-width: 55em;
}
.pagination .button {
  margin: 1em;
  width: 50%;
}

#site-footer {
  grid-area: footer;
  border-top: 1px solid rgba(161, 161, 161, 0.3);
  margin: 3em 2em;
  padding-top: 3em;
}

#back-to-top {
  opacity: 0;
  bottom: 15px;
  color: #ababab;
  display: none;
  position: fixed;
  right: 15px;
  border: 0;
  transition: opacity 1s ease, color 0.2s ease-in-out, transform 0.2s ease-in-out;
}
#back-to-top:hover {
  color: #2eb8ac !important;
  transform: translateY(-10px);
}

/* MAIN THEME OVERRIDES */ /* chexxx */

#site-nav .flyout-menu::-webkit-scrollbar {
  height: 0 !important; /* scrollbar in the nav looks like a mistake */
}

/* bug fix for mobile width and 2 wider than avg titles */
.pagination {
  max-width: 100vw;
}
@media (min-width: 1024px) {
  .pagination {
    max-width: 60vw;
  }
}

/* search results */
.search-results {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  opacity: 0;
  line-height: 1.75em;
  transition: 0.35s ease-in-out;
  z-index: -1;
  flex-direction: column;
  align-items: center;
  max-height: calc(100vh - 9.4em);
  overflow-y: auto;
  margin-top: 1em;
  padding-bottom: 1em;
  width: 100%;
}
.search-results.active {
  opacity: 1;
  z-index: 0;
}
.search-results .mini-post {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
  width: 90%;
}
@media (min-width: 425px) {
  .search-results .mini-post {
    width: 75%;
  }
}
@media (min-width: 768px) {
  .search-results .mini-post {
    width: 50%;
  }
}
.search-results .mini-post a {
  border-bottom: 0;
}
.search-results .mini-post a:hover {
  color: inherit;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
  transition: box-shadow 0.2s ease-in-out;
}
@media (min-width: 768px) {
  .search-results .mini-post header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(161, 161, 161, 0.3);
  }
  .search-results .mini-post header h2 {
    flex-grow: 1;
    font-size: 1em;
  }
}
.search-results .mini-post main {
  padding: 0 1.25em .1em;
}


.mini-post {
  background: white;
  border: 1px solid rgba(161, 161, 161, 0.3);
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
  margin-bottom: 1em;
  width: 100%;
}
@media (min-width: 768px) {
  .mini-post {
    width: 49%;
  }
}
@media (min-width: 1024px) {
  .mini-post {
    width: 100%;
  }
}
.mini-post header {
  min-height: 4em;
  padding: 0.5em 1.25em;
  position: relative;
}
@media (min-width: 768px) {
  .mini-post header {
    border-top: 1px solid rgba(161, 161, 161, 0.3);
  }
}
@media (min-width: 1024px) {
  .mini-post header {
    border: 0;
  }
}
.mini-post header h2 {
  font-size: 0.7em;
}
.mini-post header time {
  font-family: "Raleway", Helvetica, sans-serif;
  font-size: 0.6em;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.socnet-icons {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding-left: 0;
}
.socnet-icons li {
  margin: 0 0.5em;
  min-width: 20px;
  list-style-type: none;
}
.socnet-icons li a {
  opacity: 0.6;
  border: none;
}

.copyright {
  color: var(--color2);
  font-family: "Raleway", Helvetica, sans-serif;
  font-size: 0.5em;
  font-weight: 400;
  letter-spacing: 0.25em;
  text-align: center;
  text-transform: uppercase;
}

/* image clipping styles */
.circle {
  -webkit-clip-path: circle(50% at 50% 50%);
  clip-path: circle(50% at 50% 50%);
}
.hexagon {
  -webkit-clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}
.diamond {
  -webkit-clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}
.triangle {
  -webkit-clip-path: polygon(0 100%, 100% 100%, 50% 0);
  clip-path: polygon(0 100%, 100% 100%, 50% 0);
}

img {
  filter: grayscale(var(--img-grayscale-filter));
}
`,
      css_buttons(),
      css_headers(),
      css_links(),
    ]
  }
})


function SOC(str, svc) {
  const val = cfg.social[svc]
  return (val === '' || val === undefined || val === null ? '' :
    `<li><a ${str[0]}${val}${str[1]} target="_blank" rel="noopener"></a></li>`)
}
function SOCME(str, svc) {
  // like `SOC()` but with `rel="me"`
  const val = cfg.social[svc]
  return (val === '' || val === undefined || val === null ? '' :
    `<li><a ${str[0]}${val}${str[1]} target="_blank" rel="me"></a></li>`)
}
function SOC2(str, arg, svc) {
  const val = cfg.social[svc]
  return (val === '' || val === undefined || val === null ? '' :
    `<li><a ${str[0]}${arg}${str[1]}${val}${str[2]} target="_blank" rel="noopener"></a></li>`)
}

function socnet_icon() {
  // TODO: WeChat and QQ Check
  // xxx: googlescholar/researchgate/orcid all would need academicons.min.css to come back..

  return unsafeHTML(`
${SOC`href="https://github.com/${'github'}" title="GitHub" class="fab fa-github"`}
${SOC`href="https://gitlab.com/${'gitlab'}" title="GitLab" class="fab fa-gitlab"`}
${SOC`href="https://stackoverflow.com/users/${'stackoverflow'}" title="Stack Overflow" class="fab fa-stack-overflow"`}
${SOC`href="https://bitbucket.com/${'bitbucket'}" title="Bitbucket" class="fab fa-bitbucket"`}
${SOC`href="https://jsfiddle.com/${'jsfiddle'}" title="JSFiddle" class="fab fa-jsfiddle"`}
${SOC`href="https://codepen.io/${'codepen'}" title="CodePen" class="fab fa-codepen"`}
${SOC`href="https://${'deviantart'}.deviantart.com/" title="DeviantArt" class="fab fa-deviantart"`}
${SOC`href="https://flickr.com/photos/${'flickr'}" title="Flickr" class="fab fa-flickr"`}
${SOC`href="https://behance.net/${'behance'}" title="Behance" class="fab fa-behance"`}
${SOC`href="https://dribbble.com/${'dribbble'}" title="Dribbble" class="fab fa-dribbble"`}
${SOC`href="https://${'wordpress'}.wordpress.com" title="WordPress" class="fab fa-wordpress"`}
${SOC`href="https://medium.com/@${'medium'}" title="Medium" class="fab fa-medium"`}
${SOC`href="https://www.linkedin.com/in/${'linkedin'}" title="LinkedIn" class="fab fa-linkedin"`}
${SOC`href="https://linkedin.com/company/${'linkedin_company'}" title="LinkedIn Company" class="fab fa-linkedin"`}
${SOC`href="https://foursquare.com/${'foursquare'}" title="Foursquare" class="fab fa-foursquare"`}
${SOC`href="https://xing.com/profile/${'xing'}" title="Xing" class="fab fa-xing"`}
${SOC`href="https://slideshare.com/${'slideshare'}" title="SlideShare" class="fab fa-slideshare"`}
${SOC`href="https://facebook.com/${'facebook'}" title="Facebook" class="fab fa-facebook"`}
${SOC`href="https://reddit.com/user/${'reddit'}" title="Reddit" class="fab fa-reddit"`}
${SOC`href="https://quora.com/profile/${'quora'}" title="Quora" class="fab fa-quora"`}
${SOC`href="https://youtube.com/${'youtube'}" title="YouTube" class="fab fa-youtube"`}
${SOC`href="https://vimeo.com/${'vimeo'}" title="Vimeo" class="fab fa-vimeo"`}
${SOC`href="https://api.whatsapp.com/send?phone=${'whatsapp'}" title="WhatsApp" class="fab fa-whatsapp"`}
${SOC`href="weixin://contacts/profile/${'wechat'}" title="WeChat" class="fab fa-weixin"`}
${SOC`href="https://wpa.qq.com/msgrd?v=3&amp;uin=${'qq'}&amp;site=qq&amp;menu=yes" title="QQ" class="fab fa-qq"`}
${SOC`href="https://instagram.com/${'instagram'}" title="Instagram" class="fab fa-instagram"`}
${SOC`href="https://${'tumblr'}.tumblr.com" title="Tumblr" class="fab fa-tumblr"`}
${SOC`href="https://twitter.com/${'twitter'}" title="Twitter" class="fab fa-twitter"`}
${SOC`href="https://strava.com/athletes/${'strava'}" title="Strava" class="fab fa-strava"`}
${SOC`href="skype:${'skype'}?userinfo" title="Skype" class="fab fa-skype"`}
${SOC`href="https://snapchat.com/add/${'snapchat'}" title="snapchat" class="fab fa-snapchat"`}
${SOC`href="https://www.pinterest.com/${'pinterest'}" title="Pinterest" class="fab fa-pinterest-p"`}
${SOC`href="https://telegram.me/${'telegram'}" title="telegram" class="fab fa-telegram"`}
${SOC`href="https://vine.co/${'vine'}" title="Vine" class="fab fa-vine"`}
${SOC`href="https://keybase.io/${'keybase'}" title="keybase" class="fab fa-keybase"`}
${SOCME`href="https://${'mastodon'}" title="mastodon" class="fab fa-mastodon"`}
${SOC`href="mailto:${'email'}" target="_blank" title="Email" class="far fa-envelope"`}

${SOC`href="https://scholar.google.com/citations?user=${'googlescholar'}" title="Google Scholar"`}
${SOC`href="https://orcid.org/${'orcid'}" title="ORCID"`}
${SOC`href="https://researchgate.net/profile/${'researchgate'}" title="Research Gate"`}
`)
}

function rss_icon() {
  return unsafeHTML(SOC2`href="${state.top_dir}${'rss'}" type="application/rss+xml" title="RSS" class="fas fa-rss"`)
}
