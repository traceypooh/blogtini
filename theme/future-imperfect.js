/* eslint-disable max-classes-per-file, no-use-before-define */
import { LitElement, html, css } from 'https://offshoot.prod.archive.org/lit.js'
import { unsafeHTML } from 'https://offshoot.prod.archive.org/lit/directives/unsafe-html.js'
import {
  summarize_markdown, url2post, cfg, post_header, post_featured_image, post_stats, urlify,
  markdown_to_html, comments_markup, create_comment_form,
  share_buttons,
  datetime,
} from '../js/blogtini.js'


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
<link href="css/dark.css" rel="stylesheet" type="text/css"/><!-- xxx -->

  <article class="post">
    ${unsafeHTML(post_header(post))}
    <div class="content">
      ${unsafeHTML(post_featured_image(post))}
      ${unsafeHTML(summary)}
    </div>
    <footer>
      <a href="${urlify(post.url)}" class="button big">Read More</a>
      ${post.type === 'post' ? unsafeHTML(post_stats(post)) : ''}
    </footer>
  </article>

  `
  }

  static get styles() {
    return [
      css_post(),
      css_header(),
      css_title(),
      css_image(),
      css_footer(),
      css_stats(),
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
    console.error({key})

    if (post.type === 'post') {
      comments_markup(key).then(
        (comments_htm) => create_comment_form(post.url, comments_htm).then(
          (comments_form) => { this.comments_form = comments_form },
        ),
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
<link href="${urlify('../css/dark.css', true)}" rel="stylesheet" type="text/css"/><!-- xxx -->

    <article>
      <div class="post single">
        ${unsafeHTML(post_header(post))}
        <div id="socnet-share">
          ${unsafeHTML(socnet_share)}
        </div>
        ${unsafeHTML(post_featured_image(post))}

        <div>
          ${unsafeHTML(body)}
        </div>

        ${post.type === 'post' ? html`
        <footer>
          ${unsafeHTML(post_stats(post))}
        </footer>` : ''}

      </div>

      ${unsafeHTML(this.comments_form)}
    </article>
  `
  }

  static get styles() {
    return [
      css_post(),
      css_header(),
      css_title(),
      css_image(),
      css_footer(),
      css_stats(),
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
<link href="theme/future-imperfect.css" rel="stylesheet" type="text/css"/><!-- xxx -->
<link href="css/dark.css" rel="stylesheet" type="text/css"/><!-- xxx -->


  <article class="mini-post">
    ${unsafeHTML(post_featured_image(post))}
    <header>
      <h2><a href="${urlify(post.url)}">${post.title}</a></h2>
      <time class="published" datetime="${post.date /* xxx 2022-01-23T04:44:06.937Z */}">${datetime(post.date)}</time>
    </header>
  </article>`
  }

  static get styles() {
    return [
      css_header(),
      css_image(),
      css`
:host {
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
.image {
  margin: 0;
}

a.image.featured {
  /* these magic missing pieces poached from default theme's '.post' class rules */
  border: 0;
  display: block;
}

`,
    ]
  }
})


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


function css_header() {
  return css`
.post header {
  border-bottom: 1px solid rgba(161, 161, 161, 0.3);
  margin: -1em -1em 0 -1em;
  text-align: center;
  -ms-word-break: break-word;
  word-break: break-word;
}
@media (min-width: 768px) {
  .post header {
    display: -webkit-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    justify-content: space-between;
    text-align: left;
  }
}
.post header div {
  padding-bottom: 1em;
}
@media (min-width: 768px) {
  .post header div {
    padding: 1.5em;
  }
}
.post header p {
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


function css_image() {
  return css`
.image {
  border: 0;
  display: grid;
  place-items: center;
  margin: 0 -1em 1em -1em;
  overflow: hidden;
  padding-bottom: 33%;
  -webkit-transform: perspective(1000px);
  -ms-transform: perspective(1000px);
  transform: perspective(1000px);
}
.image img {
  position: absolute;
  max-height: 100%;
  transition: transform 0.35s ease-in-out;
}
.image img.stretchV {
  height: 100%;
}
.image img.stretchH {
  width: 100%;
}
.image img.cover {
  object-fit: cover;
  width: 100%;
}
.image[style]::before {
  content: "";
  position: absolute;
  background-image: var(--bg-image);
  background-size: 100% 100%;
  height: 100%;
  width: 100%;
  -webkit-filter: blur(8px);
  filter: blur(8px);
  -webkit-transform: scale(1.1);
  -ms-transform: scale(1.1);
  transform: scale(1.1);
}
.image:hover img {
  -webkit-transform: scale(1.05);
  -ms-transform: scale(1.05);
  transform: scale(1.05);
}

/* OVERRIDES TO FUTURE IMPERFECT ORIGINAL THEME */

/* https://codepen.io/burtclan/pen/mLqxC */
.image.featured {
  box-shadow: inset 0 0 10px 5px;
  position: relative;
  color: #666; /*xxx*/
  padding-bottom: 0; /* override 33% from future imperfect 2022 update */
}
.image.featured:before {
  content: "";
  display: block;
  padding-bottom: calc(100% / 2.35); /* enforce a styley 2.35:1 cinematic aspect ratio */
}
.image.featured:after {
  /* gray blur on edges */
  box-shadow: inset 0 0 10px 5px;
  content: "";
  position: absolute;
  display: block;
  overflow: hidden;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-collapse: separate;
}
.image.featured img {
  height: auto;
  width: 100%;
  object-fit: cover;
  object-position: center;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
}
.image.featured.featured-top img {
  object-position: top;
}
.image.featured.featured-bottom img {
  object-position: bottom;
}

/* OK now when we're showing a full single post, let the image height be fully natural */
/* ie: reverse our customizations above.  Also don't do the edge blurring. */
.post.single a.image.featured {
  box-shadow: none;
  height: auto;
}
.post.single a.image.featured img {
  position: relative;
}
.post.single a.image.featured:after, .post.single a.image.featured:before {
  display: none;
}
`
}


function css_stats() {
  return css`
@charset "UTF-8";

.stats {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
}
@media (min-width: 375px) {
  .stats {
    flex-direction: row;
    justify-content: space-around;
  }
}
.stats ul {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-wrap: wrap;
  margin: 1em 0 0 0;
  padding: 0;
  font-family: "Font Awesome 5 Free";
  font-weight: 900;
  list-style: none;
}
@media (min-width: 375px) {
  .stats ul {
    max-width: 50%;
    justify-content: center;
  }
}
.stats ul::before {
  width: 40px;
  padding-right: 1em;
  margin-right: 1em;
  border-right: 1px solid rgba(161, 161, 161, 0.3);
}
@media (min-width: 375px) {
  .stats ul::before {
    padding-right: 0;
    margin-right: 0;
    border-right: 0;
    border-bottom: 1px solid rgba(161, 161, 161, 0.3);
    flex: 100%;
    height: fit-content;
    text-align: center;
  }
}
.stats ul li {
  font-family: "Raleway", Helvetica, sans-serif;
  font-size: 0.6em;
  font-weight: 400;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}
.stats ul li:not(:first-child) {
  margin-left: 1em;
}
.stats ul li a {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.categories::before {
  content: "\\f07b";
}

.tags::before {
  content: "\\f02c";
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
footer .button {
  margin: 1em auto;
  width: 100%;
}
`
}
