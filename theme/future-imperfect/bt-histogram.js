import { vrsort } from 'https://av.prod.archive.org/js/util/strings.js'
import { LitElement, html } from 'https://esm.ext.archive.org/lit@3.2.1'
import { css_links, css_headers, css_dark } from './index.js'
import { state } from '../../js/blogtini.js'

customElements.define('bt-histogram', class extends LitElement {
  static get properties() {
    return {
      histogram: { type: Object },
    }
  }

  render() {
    const type = state.list_tags ? 'tags' : 'categories'
    return html`
      <h1>${type}</h1>
      <ul>
        ${Object.entries(vrsort(this.histogram ?? {})).map((e) => html`<li><article><header><a href="${state.top_page}?${type}/${e[0]}">${e[0]}<span style="float:right">${e[1]}</span></a></header></article></li>`)}
      </ul>`
  }

  static get styles() {
    return [
      css_headers(),
      css_links(),
      css_dark(),
    ]
  }
})
