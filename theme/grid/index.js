/* eslint-disable max-classes-per-file */
import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import { unsafeHTML } from 'https://esm.ext.archive.org/lit@3.2.1/directives/unsafe-html.js'
import { css_links } from '../future-imperfect/index.js'
import {
  summarize_markdown, url2post, cfg, imgurl,
} from '../../js/blogtini.js'


customElements.define('bt-posts', class extends LitElement {
  static get styles() {
    return css`
:host {
  display: grid;
  grid-gap: 18px;
  grid-template-columns: repeat(auto-fill, 300px);
  justify-content: center;
}
`
  }

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
    // console.warn({ post })
    const summary = summarize_markdown(post.body_raw, cfg.summary_length)

    const img = post.featured ? imgurl(post, true, true) : ''

    return html`
${post.featured ? html`<img src="${img}"/>` : ''}
<div class="date">${post.date.slice(0, 10)}</div>
<h1>${post.title}</h1>
${unsafeHTML(summary)}
`
  }

  static get styles() {
    return [
      css_links(),
      css`
:host {
  border: 1px solid gray;
  border-radius: 5px;
  overflow: hidden;
  padding: 10px;
}
.date {
  float: right;
}
img {
  width: 320px;
  margin-left: -10px;
  margin-top: -10px;
}
`,
    ]
  }
})
