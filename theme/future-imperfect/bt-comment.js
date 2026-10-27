import {
  LitElement, html, svg, css,
} from 'https://esm.ext.archive.org/lit@3.2.1'
import { datetime, state } from '../../index.js'
import {
  css_footer, css_title, css_buttons, css_headers, css_links, css_fontawesome, css_normalize,
} from './css.js'


/** A 32-bit string hash: FNV-1a, then murmur3's final mix (so similar strings look nothing alike) */
function hash(str) {
  let h = 0x811c9dc5
  for (const c of str) {
    h ^= c.codePointAt(0)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

/**
 * GitHub-style identicon, made here (no 3rd party requests): a 5x5 grid, whose left 3 columns are
 * set from bits of the hash, then mirrored -- in one color from the hash.
 */
function identicon(seed) {
  const h = hash(seed)
  const cells = []
  for (let i = 0; i < 15; i++) {
    if (!((h >>> i) & 1)) {
      const x = Math.floor(i / 5)
      const y = i % 5
      cells.push([x, y])
      if (x !== 2) cells.push([4 - x, y]) // mirror (middle column is its own mirror)
    }
  }
  const fill = `hsl(${(h >>> 15) % 360} 55% 55%)`
  return html`<svg class="comment-avatar circle" viewBox="-0.5 -0.5 6 6" aria-hidden="true">
    <rect x="-0.5" y="-0.5" width="6" height="6" fill="#f0f0f0"/>
    ${cells.map(([x, y]) => svg`<rect x=${x} y=${y} width="1.02" height="1.02" fill=${fill}/>`)}
  </svg>`
}


customElements.define('bt-comment', class extends LitElement {
  static get properties() {
    return {
      id: { type: String },
      name: { type: String },
      identity: { type: String },
      type: { type: String }, // their avatar's image type (eg: `png`), if they have one
      date: { type: String },
      website: { type: String },
      replyID: { type: String },
      body: { type: String },
    }
  }

  render() {
    return html`
<article id="${this.id}" class="comment">
  <header>
    ${this.identity && this.type
      ? html`<img class="comment-avatar circle" src="${state.top_dir}avatars/${this.identity}.${this.type}" alt="" loading="lazy">`
      : identicon(this.identity ?? this.name ?? '')}
    <div>
      <div class="comment-author-container">

        <h3 class="comment-author">
          ${this.website ? html`<a rel="nofollow external" href="${this.website.match(/^https*:\/\//) ? this.website : `https://${this.website}`}">${this.name}</a>` : this.name}
        </h3>
        <a class="comment-date" href="#${this.id}" title="Permalink to this comment">
          ${''}
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

  static styles = [
    css_normalize,
    css_fontawesome,
    css_title,
    css_footer,
    css_buttons,
    css_headers,
    css_links,
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
  flex-shrink: 0;
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
})
