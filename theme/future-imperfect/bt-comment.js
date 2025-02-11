import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import { datetime } from '../../index.js'
import {
  css_post, css_footer, css_title, css_buttons, css_headers, css_links, css_fontawesome,
  css_normalize,
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
      <a class="comment-reply-btn" href="#say-something" @click=${this.reply_clicked}>Reply</a>
    </div>
  </header>
  <div class="comment-content">
    ${this.body}
    <slot></slot>
  </div>
</article>
  `
  }

  // Dispatches a custom event (to parent component) when the reply button is clicked
  reply_clicked() {
    this.dispatchEvent(new CustomEvent('bt-comment-reply-clicked', {
      detail: { id: this.id, author: this.name },  // Pass up event details
      bubbles: true,  // Make sure the event bubbles up to the parent
      composed: true,  // Allow the event to cross shadow DOM boundaries
    }))
  }

  static get styles() {
    return [
      css_normalize(),
      css_fontawesome(),
      css_post(), // xxxcc figure these out
      css_title(),
      css_footer(),
      css_buttons(),
      css_headers(),
      css_links(),
      css`
@charset "UTF-8";
/* Staticman Comments - Content */
.comment header {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  background: var(--background2);
  align-items: center;
  border-radius: 50px 0 0 50px;
}
@media (min-width: 375px) {
  .comment header {
    border-radius: 0;
  }
}
.comment header div {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  align-items: center;
}
@media (min-width: 375px) {
  .comment header div {
    flex-direction: row;
  }
}
.comment.comment-reply {
  margin-left: 1.875em;
}
@media (min-width: 375px) {
  .comment.comment-reply {
    margin-left: 3.75em;
  }
}
.comment-author-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
@media (min-width: 375px) {
  .comment-author-container {
    align-items: flex-start;
    flex-grow: 1;
  }
}
@media (min-width: 768px) {
  .comment-author-container {
    flex-direction: row;
    align-items: center;
  }
}
.comment-avatar {
  margin: 0 0 0 1em;
  width: 3.75em;
  height: 3.75em;
  flex-grow: 0;
}
@media (min-width: 375px) {
  .comment-avatar {
    margin: 0 .5em 0 0;
  }
}
.comment-author {
  font-size: 0.9em;
  margin: 0;
}
@media (min-width: 768px) {
  .comment-author {
    margin-right: .5em;
    padding-right: .5em;
    border-right: 1px solid rgba(161, 161, 161, 0.3);
  }
}
.comment-reply-btn {
  border: 0;
}
.comment-reply-btn::before {
  font-family: "Font Awesome 5 Free";
  font-weight: 900;
  content: "\\f3e5";
  margin-right: .5em;
  width: 20px;
}
@media (min-width: 375px) {
  .comment-reply-btn {
    margin-right: 1.5em;
  }
}
.comment-content {
  margin: 1em;
}

.circle {
  overflow: clip;
  -webkit-clip-path: circle(50% at 50% 50%);
  clip-path: circle(50% at 50% 50%);
}

img {
  filter: grayscale(--img-grayscale-filter);
}
`,
    ]
  }
})
