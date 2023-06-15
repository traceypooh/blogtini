/* eslint-disable max-classes-per-file, no-use-before-define */
import { unsafeHTML } from 'https://esm.archive.org/lit/directives/unsafe-html.js'
import {
  LitElement, html, css, unsafeCSS,
} from 'https://esm.archive.org/lit'
import {
  summarize_markdown, url2post, cfg, urlify,
  markdown_to_html, comments_markup, create_comment_form,
  share_buttons,
  datetime, dark_mode, PR,
} from '../js/blogtini.js'

import './featured-image.js'
import './post-stats.js'
import './bt-sidebar.js'


customElements.define('bt-posts', class extends LitElement {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return html`<slot></slot>`
  }
})


customElements.define('bt-post', class extends LitElement {
  static get properties() {
    return {
      url: { type: String },
    }
  }

  render() {
    const post = url2post(this.url)

    const summary = summarize_markdown(post.body_raw, cfg.summary_length)

    return html`
<link href="theme/future-imperfect.css" rel="stylesheet" type="text/css"/><!-- xxx -->

  <article class="post">
    <bt-post-header .post=${post}></bt-post-header>
    <div class="content">
      <featured-image url=${this.url}></featured-image>
      ${unsafeHTML(summary)}
    </div>
    <footer>
      <a href="${urlify(post.url)}" class="button big">Read More</a>
      <post-stats
        categories=${JSON.stringify(post.categories)}
        tags=${JSON.stringify(post.tags)}>
      </post-stats>
    </footer>
  </article>

  `
  }

  static get styles() {
    return [
      css_post(),
      css`
/* ensure lists-of-posts pages dont blow out main column width with "long words" in preview */
.post .content {
  /* this seems to work v. nicely in modern firefox, chrome, safari, iOS */
  word-break: initial;    /* first, try to break up *in between* words if we gonna overflow... (this needed for firefox, since will toss next line) */
  word-break: break-word; /* first, try to break up *in between* words if we gonna overflow... (works better in chrome) */
  word-wrap:  break-word; /* ... and if still overflowing, *then* split indiv. words up ... */
  -webkit-hyphens: auto;  /* safari, you just rock! (and copy/paste works nicely too!) */
  -moz-hyphens: auto;
  hyphens: auto;
}
`,
      css_title(),
      css_footer(),
      css_dark(),
    ]
  }
})


customElements.define('bt-post-full', class extends LitElement {
  static get properties() {
    return {
      url: { type: String },
      comments_form: { type: String },
    }
  }

  render() {
    const post = url2post(this.url)
    const body = markdown_to_html(post.body_raw)

    const key = new URL(post.url).pathname.replace(/^\/+/, '').replace(/\/+$/, '') // xxx
    // console.error({key})

    if (post.type === 'post') {
      comments_markup(key).then(
        (comments_htm) => {
          this.comments_form = create_comment_form(post.url, comments_htm)
        },
      )
    }

    const socnet_share = share_buttons(post)

    if (!this.flyout_shared) {
      // copy sharing buttons to the fly-out menu
      this.flyout_shared = true // ensure this is only done once
      document.getElementById('share-menu').insertAdjacentHTML(
        'beforeend',
        socnet_share,
      )
    }


    return html`
<link href="${urlify('theme/future-imperfect.css', true)}" rel="stylesheet" type="text/css"/><!-- xxx -->

    <article>
      <div class="post single">
        <bt-post-header .post=${post}></bt-post-header>
        <div id="socnet-share">
          ${unsafeHTML(socnet_share)}
        </div>
        <featured-image url=${this.url} single=true></featured-image>

        <div>
          ${unsafeHTML(body)}
        </div>

        ${post.type === 'post' ? html`
        <footer>
          <post-stats
            categories=${JSON.stringify(post.categories)}
            tags=${JSON.stringify(post.tags)}>
          </post-stats>
        </footer>` : ''}

      </div>

      ${unsafeHTML(this.comments_form)}
    </article>
  `
  }

  static get styles() {
    return [
      css_post(),
      css_title(),
      css_footer(),
      css_dark(),
    ]
  }
})


customElements.define('bt-post-header', class extends LitElement {
  static get properties() {
    return {
      post: { type: Object },
    }
  }

  // eslint-disable-next-line class-methods-use-this
  wordcount(str) {
    return str?.match(/(\w+)/g).length ?? 0
  }

  render() {
    return html`
  <header>
    <div class="title">
      <h2><a href="${urlify(this.post.url)}">${this.post.title}</a></h2>
      ${PR`<p>${this.post.description}</p>` /* chexxx */}
    </div>
    ${this.post.type === 'post' ? html`
      <div class="meta">
        <time datetime="${this.post.date /* xxx 2022-01-23T04:44:06.937Z */}">${datetime(this.post.date)}</time>
        ${PR`<p>${this.post.author}</p>` /* chexxx */}
        ${cfg.reading_time ? html`<p>${Math.round((212 + this.wordcount(this.post.body_raw)) / 213)}-Minute Read</p>` : ''}
      </div>` : ''}
  </header>
  `
  }

  static get styles() {
    return [
      css_links(),
      css_headers(),
      css_title(),
      css`
*, *::before, *::after { /* xxx */
  box-sizing: border-box;
}
header {
  border-bottom: 1px solid rgba(161, 161, 161, 0.3);
  margin: -1em -1em 0 -1em;
  text-align: center;
  -ms-word-break: break-word;
  word-break: break-word;
}
@media (min-width: 768px) {
  header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    justify-content: space-between;
    text-align: left;
  }
}
header div {
  padding-bottom: 1em;
}
@media (min-width: 768px) {
  header div {
    padding: 1.5em;
  }
}
header p {
  margin: -1em 0 0 0;
}

.meta {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  font-family: "Raleway", Helvetica, sans-serif;
  font-size: 0.6em;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  flex-direction: column;
  justify-content: center;
  width: 100%;
}
@media (min-width: 768px) {
  .meta {
    border-left: 1px solid rgba(161, 161, 161, 0.3);
    text-align: right;
    width: 25%;
  }
}
.meta time {
  font-size: 1.2em;
  font-weight: 800;
}
      `,
      css_dark(),
    ]
  }
})

customElements.define('bt-post-mini', class extends LitElement {
  static get properties() {
    return {
      url: { type: String },
    }
  }

  render() {
    const post = url2post(this.url)

    return html`
  <article class="mini-post">
    <featured-image url=${this.url} mini=true></featured-image>
    <header>
      <h2><a href="${urlify(post.url)}">${post.title}</a></h2>
      <time class="published" datetime="${post.date /* xxx 2022-01-23T04:44:06.937Z */}">${datetime(post.date)}</time>
    </header>
  </article>`
  }

  static get styles() {
    const xxx = dark_mode() ? 'background-color: #222;' : '' // for dark mode border color
    return [
      css_headers(),
      css`
:host {
  background: white;
  ${unsafeCSS(xxx)}
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
  :host {
    width: 49%;
  }
}
@media (min-width: 1024px) {
  :host {
    width: 100%;
  }
}
header {
  min-height: 4em;
  padding: 0.5em 1.25em;
  position: relative;
}
@media (min-width: 768px) {
  header {
    border-top: 1px solid rgba(161, 161, 161, 0.3);
  }
}
@media (min-width: 1024px) {
  header {
    border: 0;
  }
}
header h2 {
  font-size: 0.7em;
}
header time {
  font-family: "Raleway", Helvetica, sans-serif;
  font-size: 0.6em;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

`,
      css_links(),
      css_dark(),
    ]
  }
})


function css_buttons() {
  const xxx = dark_mode() ? `
.button {
  color: #ddd;
  background-color: #111;
}
` : ''

  return css`
.button {
  background-color: transparent;
  border: 1px solid rgba(161, 161, 161, 0.3);
  color: #3b3a3a;
  cursor: pointer;
  display: inline-block;
  font-family: "Raleway", Helvetica, sans-serif;
  font-size: 0.6em;
  font-weight: 800;
  height: 4.8125em;
  letter-spacing: 0.25em;
  line-height: 4.8125em;
  margin: auto;
  padding: 0 2em;
  transition: background-color 0.2s ease-in-out, border 0.2s ease-in-out, color 0.2s ease-in-out;
  text-align: center;
  text-transform: uppercase;
  width: fit-content;
}

input[type="submit"]:hover,
input[type="reset"]:hover,
input[type="button"]:hover,
.button:hover {
  border: 1px solid #2eb8ac;
  color: #2eb8ac !important;
}

input[type="submit"]:hover:active,
input[type="reset"]:hover:active,
input[type="button"]:hover:active,
.button:hover:active {
  background-color: rgba(46, 184, 172, 0.05);
}

${unsafeCSS(xxx)}
`
}

function css_links() {
  return css`
a {
  border-bottom: 1px dotted rgba(161, 161, 161, 0.7);
  color: inherit;
  text-decoration: none;
  transition: border-bottom-color 0.2s ease-in-out, color 0.2s ease-in-out;
}
a:hover {
  border-bottom-color: transparent;
  color: #2eb8ac;
}`
}

function css_headers() {
  const color = dark_mode() ? '#ddd' : '#3b3a3a'

  return css`
h1,
h2,
h3,
h4,
h5,
h6 {
  color: ${unsafeCSS(color)};
  font-family: "Raleway", Helvetica, sans-serif;
  letter-spacing: 0.25em;
  line-height: 1.65;
  text-transform: uppercase;
}
h1 a,
h2 a,
h3 a,
h4 a,
h5 a,
h6 a {
  border-bottom: 0;
}
p,
h2,
h3 {
  orphans: 3;
  widows: 3;
}
h2,
h3 {
  page-break-after: avoid;
}

/**
 * Correct the font size and margin on <h1> elements within <section> and
 * <article> contexts in Chrome, Firefox, and Safari.
 */
h1 {
  font-size: 2em;
  margin: 0.67em 0;
}
`
}

function css_post() {
  return css`
.post {
  background: white;
  margin: 1.5em auto;
  padding: 1em;
  max-width: 55em;
}

.post > div > p,
.post > p {
  text-align: justify;
}

/* OVERRIDES TO FUTURE IMPERFECT ORIGINAL THEME */

/* ensure lists-of-posts pages dont blow out main column width with "long words" in preview */
.post .content {
  /* this seems to work v. nicely in modern firefox, chrome, safari, iOS */
  word-break: initial;    /* first, try to break up *in between* words if we gonna overflow... (this needed for firefox, since will toss next line) */
  word-break: break-word; /* first, try to break up *in between* words if we gonna overflow... (works better in chrome) */
  word-wrap:  break-word; /* ... and if still overflowing, *then* split indiv. words up ... */
  -webkit-hyphens: auto;  /* safari, you just rock! (and copy/paste works nicely too!) */
  -moz-hyphens: auto;
  hyphens: auto;
}
`
}


function css_title() {
  return css`
  .title {
    font-size: 1.1em;
    width: 100%;
  }
  @media (min-width: 768px) {
    .title {
      width: 75%;
    }
  }
  `
}


function css_footer() {
  return css`
footer {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
}
footer .button { /* xxx was .post footer .button */
  margin: 1em auto;
  width: 100%;
}
`
}


function css_dark() {
  if (!dark_mode())
    return css``

  return css`
#site-header,
#site-header .flyout-menu,
#site-nav-menu,
.mini-post header,
.content table,
.single  table,
.button {
  color: #ddd;
  background-color: #111;
}
.content table th,
.content table tr:nth-child(even),
.single  table th,
.single  table tr:nth-child(even) {
  color: #ddd;
  background-color: #222;
}
.content table tbody tr td,
.single  table tbody tr td {
  background-color: transparent;
}

article.post,
article .post,
.mini-post,
article.comment header {
  color: #ddd;
  background-color: #222;
}
.pagination a,
.asciiover pre,
#comment-form input,
#comment-form textarea,
#contact input,
#contact textarea {
  color: #ddd;
}
img {
  filter: grayscale(50%);
}

a {
  color: inherit;
}
`
}

export {
  css_buttons,
  css_headers,
  css_links,
}
