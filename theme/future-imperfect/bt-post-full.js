import { unsafeHTML } from 'https://esm.ext.archive.org/lit@3.2.1/directives/unsafe-html.js'
import { LitElement, html } from 'https://esm.ext.archive.org/lit@3.2.1'

import {
  url2post, markdown_to_html, share_buttons, cfg, path_to_theme_url,
} from '../../js/blogtini.js'
import {
  css_post, css_dark, css_footer, css_title, css_hljs, css_headers, css_buttons,
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

    // remove site_url prefix in case posts are 1+ subdir deep, example site & post:
    //   https://traceypooh.github.io/poohtini/
    //   https://traceypooh.github.io/poohtini/2024-04-sedona-death-valley-grand-canyon/
    // use a default base in case url is relative (pathname) only
    const relative_path = post.url.startsWith(cfg.site_url)
      ? post.url.slice(cfg.site_url.length)
      : post.url
    // ensure is just path.  remove lead/trail / chars
    const comments_entryid = new URL(relative_path, 'https://blogtini.com').pathname.replace(/^\/+/, '').replace(/\/+$/, '')

    const socnet_share = share_buttons(post)

    if (!this.flyout_shared) {
      // copy sharing buttons to the fly-out menu
      this.flyout_shared = true // ensure this is only done once
      const btpage = document.querySelector('bt-body')?.shadowRoot
      const sharemenu = btpage.querySelector('#share-menu')
      sharemenu.innerHTML = `${sharemenu.innerHTML} ${socnet_share}`
    }


    return html`
<link href="${path_to_theme_url('css/css.css')}" rel="stylesheet" type="text/css"/><!-- xxx -->

<link href="${path_to_theme_url('css/fontawesome.css')}" rel="stylesheet" type="text/css"/><!-- xxx eg: bottom of homepage -->

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
