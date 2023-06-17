import { LitElement, html } from 'https://esm.archive.org/lit'

customElements.define('bt-posts', class extends LitElement {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return html`<slot></slot>`
  }
})
