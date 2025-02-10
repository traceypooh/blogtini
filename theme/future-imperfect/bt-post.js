import { unsafeHTML } from 'https://esm.ext.archive.org/lit@3.2.1/directives/unsafe-html.js'
import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import {
  summarize_markdown, url2post, cfg, urlify,
} from '../../js/blogtini.js'
import {
  css_post, css_footer, css_title, css_buttons, css_links, css_normalize, css_theme,
} from './index.js'


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
      css_normalize(),
      css_theme(),
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
      css_buttons(),
      css_links(),
    ]
  }
})
