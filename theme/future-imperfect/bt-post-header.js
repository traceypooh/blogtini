import { LitElement, html, css } from 'https://esm.archive.org/lit'
import {
  cfg, urlify, datetime, PR,
} from '../../js/blogtini.js'
import {
  css_headers, css_dark, css_links, css_title,
} from './index.js'


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
