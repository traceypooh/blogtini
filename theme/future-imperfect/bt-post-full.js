import { unsafeHTML } from 'https://esm.ext.archive.org/lit@3.2.1/directives/unsafe-html.js'
import { LitElement, html } from 'https://esm.ext.archive.org/lit@3.2.1'

import {
  url2post, cssify,
  markdown_to_html, comments_get, create_comment_form,
  share_buttons,
} from '../../js/blogtini.js'
import {
  css_post, css_dark, css_footer, css_title, css_hljs,
  css_headers, css_buttons,
} from './index.js'

customElements.define('bt-post-full', class extends LitElement {
  static get properties() {
    return {
      url: { type: String },
      comments_form: { type: String },
      comments: { type: Object },
    }
  }

  render() {
    const post = url2post(this.url)
    const body = markdown_to_html(post.body_raw)

    if (post.type === 'post' && !this.comments_form) {
      // use a default base in case url is relative (pathname) only
      const key = new URL(post.url, 'https://blogtini.com').pathname.replace(/^\/+/, '').replace(/\/+$/, '') // xxx
      // console.error({key})
      comments_get(key).then(
        (comments) => {
          this.comments_form = create_comment_form(post.url, comments)
          this.comments = comments
        },
      )
    }

    const socnet_share = share_buttons(post)

    if (!this.flyout_shared) {
      // copy sharing buttons to the fly-out menu
      this.flyout_shared = true // ensure this is only done once
      const btpage = document.querySelector('bt-body')?.shadowRoot
      const sharemenu = btpage.querySelector('#share-menu')
      sharemenu.innerHTML = `${sharemenu.innerHTML} ${socnet_share}`
    }


    return html`
<link href="${cssify('theme/future-imperfect/css.css')}" rel="stylesheet" type="text/css"/><!-- xxx -->

<link href="${cssify('css/fontawesome.css')}" rel="stylesheet" type="text/css"/><!-- xxx eg: bottom of homepage -->

    <article>
      <div class="post single">
        ${post.type === 'homepage' ? '' : html`
          <bt-post-header .post=${post}></bt-post-header>
          <div id="socnet-share">
            ${unsafeHTML(socnet_share)}
          </div>
          <featured-image url=${this.url} single=true></featured-image>`}

        <div>
          ${unsafeHTML(body)}
        </div>

        ${post.type === 'post' ? html`
        <footer>
          <post-stats
            categories=${JSON.stringify(post.categories)}
            tags=${JSON.stringify(post.tags)}>
          </post-stats>
        </footer>` : ''}

      </div>

      ${unsafeHTML(this.comments_form)}
    </article>
  `
  }


  updated() {
    if (this.comments && this.comments.length)
      this.comments_insert()

    // add code highlighting
    const codes = this.shadowRoot.querySelectorAll('pre code')
    if (codes.length) {
      import('https://esm.ext.archive.org/highlightjs@9.16.2').then(
        (esm) => codes.forEach(esm.default.highlightBlock),
      )
    }
  }

  /**
   * Cleverly use DOM to add (potentially nested) comment elements into a div
   * -- because threading replies (and replies of replies) gets complicated suuuuper quick
   */
  comments_insert() {
    // loop over comments, appending each into the right parent, until all are added
    // (or no more addable if corrupted / invalid parent pointer)
    // eslint-disable-next-line no-empty
    while (this.comments.reduce((sum, e) => sum + this.comment_insert(e), 0)) {}

    for (const com of this.comments) {
      // eslint-disable-next-line no-console
      if (com.id) console.error('Comment orphaned', com)
    }
  }

  /**
   * Adds a comment into DOM, finding the right parent for threaded comments, etc.
   * @param {object} com
   * @returns {number} 0 or 1 comments added
   */
  comment_insert(com) {
    if (!com.id) return 0
    const e = document.createElement('bt-comment')
    for (const [k, v] of Object.entries(com))
      e.setAttribute(k, v) // xxxcc JSON.stringify(v))

    const addto = com.replyID
      ? this.shadowRoot.getElementById(com.replyID)
      : this.shadowRoot.querySelector('.comments-container')
    if (!addto)
      return 0 // *should* never happen -- but cant find parent for this comment's `replyID`

    addto.appendChild(e)

    // eslint-disable-next-line no-param-reassign
    delete com.id
    return 1
  }


  static get styles() {
    return [
      css_post(),
      css_headers(),
      css_title(),
      css_footer(),
      css_dark(),
      css_buttons(),
      css_hljs(),
    ]
  }
})
