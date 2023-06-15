import { unsafeHTML } from 'https://esm.archive.org/lit/directives/unsafe-html.js'
import { LitElement, html, css } from 'https://esm.archive.org/lit'
import { cfg, state, urlify } from '../js/blogtini.js'
import { css_buttons, css_headers, css_links } from './future-imperfect.js'


customElements.define('bt-sidebar', class extends LitElement {
  static get properties() {
    return {
      tags: { type: Object },
      // xxx could support cfg.sidebar.categories_by_count option..
      categories: { type: Object },
      recent_posts: { type: Object },
    }
  }

  render() {
    const rem_min = 1
    const rem_max = 2.5
    const counts = Object.values(this.tags || {})
    const cnt_min = Math.min(...counts)
    const cnt_max = 1 + Math.max(...counts)

    const more = this.recent_posts?.length >= cfg.sidebar.post_amount

    return html`
<section id="site-sidebar">

  ${cfg.sidebar.post_amount ? html`
    <section class="recent_posts">
      <header>
        <h1>Recent Posts</h1>
      </header>
      ${(this.recent_posts || []).map((url) => html`
        <bt-post-mini url="${urlify(url)}"></bt-post-mini>`)}
      ${more ? html`
      <footer>
        <a href="${cfg.view_more_posts_link}" class="button">See More</a>
      </footer>` : ''}
    </section>
  ` : ''}

  ${cfg.sidebar.categories ? html`
    <section>
      <header>
        <h1>
          <a href="${state.top_page}?categories">Categories</a>
        </h1>
      </header>
      <ul>
        ${Object.entries(this.categories ?? {}).map((entry) => {
    const [cat, cnt] = entry
    return html`<li><a href="${state.top_page}?categories/${cat}">${cat.toLowerCase()}</a> <span class="count">${cnt}</span></li>`
  })}
      </ul>
    </section>
  ` : ''}

  <section style="text-align:center">
    <header>
      <h1><a href="${state.top_page}?tags">Tags</a></h1>
    </header>

    ${Object.entries(this.tags ?? {}).map((entry) => {
    const [tag, cnt] = entry
    const weight = (Math.log(cnt) - Math.log(cnt_min)) / (Math.log(cnt_max) - Math.log(cnt_min))
    const size = (rem_min + ((rem_max - rem_min) * weight)).toFixed(1)
    return html`<a href="${state.top_page}?tags/${tag}" style="font-size: ${size}rem">${tag.toLowerCase()}</a> `
  })}

  </section>

  ${cfg.sidebar.about ? html`
    <section id="mini-bio">
      <header>
        <h1>About</h1>
      </header>
      <p> ${unsafeHTML(cfg.sidebar.about)}</p>
      <footer>
        <a href="${state.top_dir}about" class="button">Learn More</a>
      </footer>
    </section>` : ''}
</section>`
  }

  static get styles() {
    return [
      css_buttons(),
      css_links(),
      css_headers(),
      css`
:host {
  grid-area: sidebar;
}
header h1 {
  font-size: 1em;
}
#site-sidebar > * { /* chexxx */
  border-top: 1px solid rgba(161, 161, 161, 0.3);
  margin: 3em 2em 0 2em;
  padding-top: 3em;
}
@media (min-width: 1024px) {
  #site-sidebar > *:first-child { /* chexxx */
    margin-top: 0;
  }
}

.recent_posts {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.recent_posts > header {
  -webkit-box-flex: 1;
  -ms-flex: 1 1 100%;
  -webkit-flex: 1 1 100%;
  flex: 1 1 100%;
}

ul {
  font-family: "Raleway", Helvetica, sans-serif;
  font-size: 0.9em;
  letter-spacing: 0.25em;
  line-height: 1.65;
  text-transform: uppercase;
  list-style: none;
  padding: 0;
}
.count {
  float: right;
}
footer {
  margin: auto;
  width: max-content;
}

#mini-bio p {
  opacity: 0.65;
  font-size: 0.9em;
  padding: 0;
}

`,
    ]
  }
})
