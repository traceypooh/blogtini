import { JSDOM } from 'https://esm.archive.org/jsdom'

const doc = new JSDOM('')
globalThis.document = doc.window.document
globalThis.CSSStyleSheet = doc.window.CSSStyleSheet


// eslint-disable-next-line import/first, import/no-unresolved
import { HTMLElement, customElements } from 'npm:@lit-labs/ssr-dom-shim'

globalThis.HTMLElement = HTMLElement
globalThis.customElements = customElements
