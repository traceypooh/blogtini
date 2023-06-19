import { ContextRequestEvent } from './context.js'
import { ContextRequest_TransformMakup } from './context-markup.js'


const SVG_SKELETON_SPINNER = `
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>
      .spinner_ajPY {
        transform-origin: center;
        animation: spinner_AtaB .75s infinite linear;
      }
      @keyframes spinner_AtaB {
        100% {
          transform: rotate(360deg);
        }
      }
    </style>
    <path
      d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
      opacity=".25"
    />
    <path
      d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
      class="spinner_ajPY"
    />
  </svg>
  `

/**
 * Take markup language (e.g. Markdown, Rst), and get it transformed into HTML.
 */
class UnMarkupElement extends HTMLElement {
  constructor() {
    super()
    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.createElement('template')
    template.innerHTML = `
      <style>
        :host {
          display: block;
        }
        #markup-loading {
          width: 100%;
        }
        #markup-source {
          display: none;
        }
        .is-not-transformed #markup-loading {
          display: block;
        }
        .is-not-transformed #markup-transformed {
          display: none;
        }
        .is-transformed #markup-loading {
          display: none;
        }
        .is-transformed #markup-transformed {
          display: block;
        }
      </style>
      <div class="disposition-parent">
        <div
          id="markup-viewer"
          part="markup-viewer"
          class="disposition-item is-not-transformed"
        >
          <div
            id="markup-loading"
            part="markup-loading"
          >
            <slot name="skeleton">
              ${SVG_SKELETON_SPINNER}
            </slot>
          </div>
          <div id="markup-transformed"></div>
        </div>
        <div
          id="markup-source"
          part="markup-source"
          class="disposition-item"
        >
          <pre>
            <slot></slot>
          </pre>
        </div>
      </div>
    `
    const innerHtml = template.content.cloneNode(true)
    shadowRoot.appendChild(innerHtml)
    let slot = this.shadowRoot.querySelector('slot:not([name])')
    slot.addEventListener('slotchange', this._onSlotChange)
  }

  _applyTransformedMarkup = (html = '') => {
    const transformed = html !== ''
    const elMarkupViewer = this.shadowRoot.querySelector('#markup-viewer')
    const elTransformed = this.shadowRoot.querySelector(
      '#markup-transformed',
    )
    if (transformed) {
      elTransformed.innerHTML = html
      elMarkupViewer.classList.remove('is-not-transformed')
      elMarkupViewer.classList.add('is-transformed')
    } else {
      elTransformed.innerHTML = ''
      elMarkupViewer.classList.add('is-not-transformed')
      elMarkupViewer.classList.remove('is-transformed')
    }
  }

  /**
   * Listen on changes only on default slot, that's the trigger to ask for HTML.
   */
  _onSlotChange = (_event /*: HTMLElementEventMap['slotchange'] */) => {
    this.dispatchEvent(
      new ContextRequestEvent(
        ContextRequest_TransformMakup,
        this._onContextResponse_UnMarkup,
      ),
    )
  }

  _onContextResponse_UnMarkup = ({ html = '' }) => {
    this._applyTransformedMarkup(html)
  }
}


export default UnMarkupElement
