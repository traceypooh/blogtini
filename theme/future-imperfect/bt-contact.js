import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import {
  css_buttons, css_forms, css_headers, css_normalize, css_post,
} from './index.js'
import { cfg } from '../../index.js'

customElements.define('bt-contact', class extends LitElement {
  // eslint-disable-next-line class-methods-use-this
  render() {
    return html`
    <article class="post">
      <header>
        <div class="title">
          <h1>Contact</a></h1>
        </div>
      </header>
      <div id="content">
        <div class="contact-container">
          <form id="contact" action="${cfg.contact.email_service}" method="post">
            <h4>Replies typically within ${cfg.contact.answer_time} hours.</h4>
            <input placeholder="Your Name" type="text" name="name" tabindex="1" required autofocus>
            <input placeholder="Your Email" type="email" name="_replyto" tabindex="2" required>
            <input placeholder="Subject" type="text" name="_subject" tabindex="3" required>
            <textarea placeholder="Your Message" type="text" name="message" tabindex="4" required></textarea>
            <button name="submit" class="button" type="submit" id="contact-submit" tabindex="5">Submit</button>
          </form>
        </div>
      </div>
    </article>
    `
  }

  static get styles() {
    return [
      css_normalize(),
      css_buttons(),
      css_headers(),
      css_post(),
      css_forms(),
      css`
      input, textarea {
        box-sizing: border-box;
      }
      `,
    ]
  }
})
