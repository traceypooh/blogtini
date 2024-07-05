import {
  LitElement, html, css, unsafeCSS,
} from 'https://esm.archive.org/lit'
import {
  url2post, urlify,
  datetime, dark_mode,
} from '../../js/blogtini.js'
import { css_headers, css_links, css_dark } from './index.js'

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
      <bt-time
        class="published"
        datetime="${post.date /* xxx 2022-01-23T04:44:06.937Z */}"
        data-date-human-format="ddd MMM DD, YYYY"
      ></bt-time>
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
