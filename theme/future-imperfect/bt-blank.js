import { LitElement, html } from 'https://esm.ext.archive.org/lit@3.2.1'
import {
  css_buttons, css_links, css_forms, css_normalize,
} from './css.js'

customElements.define('bt-blank', class extends LitElement {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return html`<slot></slot>`
  }

  static styles = [
    css_normalize,
    css_buttons,
    css_links,
    css_forms,
  ]
})
