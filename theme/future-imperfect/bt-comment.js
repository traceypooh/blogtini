import { LitElement, html } from 'https://esm.ext.archive.org/lit@3.2.1'
import { cssify, datetime } from '../../js/blogtini.js'
import {
  css_post, css_dark, css_footer, css_title, css_buttons,
} from './index.js'


customElements.define('bt-comment', class extends LitElement {
  static get properties() {
    return {
      id: { type: String },
      name: { type: String },
      email: { type: String },
      date: { type: String },
      website: { type: String },
      replyID: { type: String },
      body: { type: String },
    }
  }

  render() {
    return html`
<link href="${cssify('theme/future-imperfect/css.css')}" rel="stylesheet" type="text/css"/><!-- xxx -->

<article id="${this.id}" class="comment" style="${this.replID ? 'margin-left:150px' : ''}">
  <header>
    <img class="comment-avatar circle" src="https://www.gravatar.com/avatar/${this.email}?s=100" alt="${this.name}'s Gravatar">
    <div>
      <div class="comment-author-container">

        <h3 class="comment-author">
          ${this.website ? html`<a rel="nofollow external" href="${this.website.match(/^https*:\/\//) ? this.website : `https://${this.website}`}">${this.name}</a>` : this.name}
        </h3>
        <a class="comment-date" href="#${this.id}" title="Permalink to this comment">
          ${'' /* eslint-disable-next-line no-use-before-define */}
          <time datetime="${this.date /* xxx 2022-01-23T04:44:06.937Z */}">${datetime(this.date)}</time>
        </a>
      </div>
      <a class="comment-reply-btn" href="#say-something">Reply</a>
    </div>
  </header>
  <div class="comment-content">
    ${this.body}
    <slot></slot>
  </div>
</article>

  `
  }

  static get styles() {
    return [
      css_post(), // xxxcc figure these out
      css_title(),
      css_footer(),
      css_buttons(),
      css_dark(),
    ]
  }
})
