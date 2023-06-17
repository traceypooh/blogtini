/* eslint-disable max-classes-per-file */
import { LitElement, html, css } from 'https://esm.archive.org/lit'
import { unsafeHTML } from 'https://esm.archive.org/lit/directives/unsafe-html.js'
import {
  state, summarize_markdown, url2post, cfg,
} from '../js/blogtini.js'


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

    const imgurl = post.featured ? `${state.top_dir}img/${post.featured}` : '' // xxx img/ parameterize

    return html`
${post.featured ? html`<img src="${imgurl}"/>` : ''}
<div class="date">${post.date}</div>
<h1>${post.title}</h1>
${unsafeHTML(summary)}
`
  }

  static get styles() {
    return css`
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
`
  }
})
