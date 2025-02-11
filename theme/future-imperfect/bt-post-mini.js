import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import { url2post, urlify, datetime } from '../../index.js'
import { css_headers, css_links, css_normalize } from './index.js'

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
    return [
      css_normalize(),
      css_headers(),
      css`
:host {
  background: var(--background1);
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
    ]
  }
})
