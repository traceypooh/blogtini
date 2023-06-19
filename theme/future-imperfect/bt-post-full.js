import { unsafeHTML } from 'https://esm.archive.org/lit/directives/unsafe-html.js'
import { LitElement, html } from 'https://esm.archive.org/lit'

import {
  comments_markup,
  create_comment_form,
  share_buttons,
  url2post,
  urlify,
} from '../../js/blogtini.js'
import {
  css_buttons,
  css_dark,
  css_footer,
  css_headers,
  css_hljs,
  css_post,
  css_title,
} from './index.js'

customElements.define('bt-post-full', class extends LitElement {
  static get properties() {
    return {
      url: { type: String },
      comments_form: { type: String },
    }
  }

  render() {
    const post = url2post(this.url)

    // use a default base in case url is relative (pathname) only
    const key = new URL(post.url, 'https://blogtini.com').pathname.replace(/^\/+/, '').replace(/\/+$/, '') // xxx
    // console.error({key})

    if (post.type === 'post') {
      comments_markup(key).then(
        (comments_htm) => {
          this.comments_form = create_comment_form(post.url, comments_htm)
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
<link href="${urlify('theme/future-imperfect/css.css', true)}" rel="stylesheet" type="text/css"/><!-- xxx -->

<link href="${urlify('css/fontawesome.css', true)}" rel="stylesheet" type="text/css"/><!-- xxx eg: bottom of homepage -->

    <article>
      <div class="post single">
        ${post.type === 'homepage' ? '' : html`
          <bt-post-header .post=${post}></bt-post-header>
          <div id="socnet-share">
            ${unsafeHTML(socnet_share)}
          </div>
          <featured-image url=${this.url} single=true></featured-image>`}

        <bt-un-markup>
          ${unsafeHTML(post.body_raw)}
        </bt-un-markup>

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
    // add code highlighting
    const codes = this.shadowRoot.querySelectorAll('pre code')
    if (codes.length) {
      import('https://esm.archive.org/highlightjs').then(
        (esm) => codes.forEach(esm.default.highlightBlock),
      )
    }
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
