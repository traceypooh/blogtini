import { ContextRequest_DateConversion } from './context-date-conversion.js'
import { ContextRequestEvent } from './context.js'
import { isNotNullOrEmptyString } from './utils-wc.js'

class DateTimeElement extends HTMLElement {

  static get observedAttributes() {
    return ['datetime']
  }

  set datetime(input = '') {
    if (isNotNullOrEmptyString(input)) {
      const currentValue = this.getAttribute('datetime')
      const changed = currentValue !== input
      changed && this.setAttribute('datetime', input)
    }
  }

  constructor() {
    super()
    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = shadowRoot.ownerDocument.createElement('template')
    template.innerHTML = `
      <style>
        :host {
          display: inline;
        }
      </style>
      <time>...</time>
    `
    const innerHtml = template.content.cloneNode(true)
    shadowRoot.appendChild(innerHtml)
  }


  connectedCallback() {
    const datetime = this.getAttribute('datetime')
    this.datetime = datetime
    if (datetime) {
      this.dispatchEvent(
        new ContextRequestEvent(
          ContextRequest_DateConversion,
          this._onContextResponse_DateConversion,
        ),
      )
    }
  }

  _onContextResponse_DateConversion = (data /*: DateConversion */) => {
    const { dateIsoString, dateUnix, dateHuman } = data
    const timeEl = this.shadowRoot.querySelector('time')
    if (dateIsoString) {
      timeEl.setAttribute('datetime', dateIsoString)
    }
    if (dateUnix) {
      // timeEl.setAttribute('data-unix-epoch', dateUnix)
      timeEl.dataset.unixEpoch = dateUnix
    }
    if (dateHuman) {
      timeEl.textContent = dateHuman
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const changedWithValue =
      oldValue !== newValue && isNotNullOrEmptyString(newValue)
    if (changedWithValue) {
      if (name === 'datetime') {
        this.dispatchEvent(
          new ContextRequestEvent(
            ContextRequest_DateConversion,
            this._onContextResponse_DateConversion,
          ),
        )
      }
    }
  }
}

export default DateTimeElement
