import { unsafeHTML } from 'https://esm.ext.archive.org/lit@3.2.1/directives/unsafe-html.js'
import { LitElement, html } from 'https://esm.ext.archive.org/lit@3.2.1'

import {
  url2post, cssify,
  markdown_to_html,
  share_buttons,
  cfg,
} from '../../js/blogtini.js'
import {
  css_post, css_dark, css_footer, css_title, css_hljs,
  css_headers, css_buttons,
} from './index.js'

customElements.define('bt-post-full', class extends LitElement {
  static get properties() {
    return {
      url: { type: String },
    }
  }

  render() {
    const post = url2post(this.url)
    const body = markdown_to_html(post.body_raw)

    const comments_entryid = new URL(post.url, 'https://blogtini.com').pathname.replace(/^\/+/, '').replace(/\/+$/, '') // xxx

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

      ${post.type === 'post' && cfg.staticman?.enabled ? html`
        <bt-comments entryid=${comments_entryid}></bt-comments>
      ` : ''}
    </article>
  `
  }


  updated() {
    // add code highlighting
    const codes = this.shadowRoot.querySelectorAll('pre code')
    if (codes.length) {
      import('https://esm.ext.archive.org/highlightjs@9.16.2').then(
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
