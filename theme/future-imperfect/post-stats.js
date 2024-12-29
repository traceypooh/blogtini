import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import { state } from '../../js/blogtini.js'
import { css_links } from './index.js'

customElements.define('post-stats', class extends LitElement {
  static get properties() {
    return {
      tags: { type: Object },
      categories: { type: Object },
    }
  }

  render() {
    if (!Object.values(this.tags).length && !Object.values(this.categories).length)
      return html`` // eg: page type

    const taglinks = this.tags.map(
      (e) => html`<li><a class="article-terms-link" href="${state.top_page}?tags/${e}">${e}</a></li>`,
    )
    const catlinks = this.categories.map(
      (e) => html`<li><a class="article-terms-link" href="${state.top_page}?categories/${e}">${e}</a></li>`,
    )

    return html`
<ul class="categories">
  ${catlinks}
</ul>
<ul class="tags">
  ${taglinks}
</ul>`
  }

  static get styles() {
    return [
      css_links(),
      css`
@charset "UTF-8";

:host {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
}
@media (min-width: 375px) {
  :host {
    flex-direction: row;
    justify-content: space-around;
  }
}
ul {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-wrap: wrap;
  margin: 1em 0 0 0;
  padding: 0;
  font-family: "Font Awesome 5 Free";
  font-weight: 900;
  list-style: none;
}
@media (min-width: 375px) {
  ul {
    max-width: 50%;
    justify-content: center;
  }
}
ul::before {
  width: 40px;
  padding-right: 1em;
  margin-right: 1em;
  border-right: 1px solid rgba(161, 161, 161, 0.3);
}
@media (min-width: 375px) {
  ul::before {
    padding-right: 0;
    margin-right: 0;
    border-right: 0;
    border-bottom: 1px solid rgba(161, 161, 161, 0.3);
    flex: 100%;
    height: fit-content;
    text-align: center;
  }
}
li {
  font-family: "Raleway", Helvetica, sans-serif;
  font-size: 0.6em;
  font-weight: 400;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}
li:not(:first-child) {
  margin-left: 1em;
}
li a {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.categories::before {
  content: "\\f07b";
}

.tags::before {
  content: "\\f02c";
}
`,
    ]
  }
})
