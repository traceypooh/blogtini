import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import { cfg } from '../../js/blogtini.js'
import { css_links, css_normalize } from './index.js'

customElements.define('bt-share', class extends LitElement {
  static get properties() {
    return {
      post: { type: Object },
    }
  }

  render() {
    if (!this.post) {
      // if no post, parse url for ?tags etc and fake
      // post = markdown_to_post(document.querySelector('body').innerHTML, 'xxx')
    }
    if (!this.post)
      return html``

    const by = this.post?.author ?? cfg.title
    const permalink = this.post.permalink || this.post.url // fqdn
    const { title } = this.post

    return cfg.social_share.map((social) => {
      switch (social) {
      case 'twitter':
        return html`
          <a href="//twitter.com/share?text=${title}&amp;url=${permalink}"
              target="_blank" rel="noopener" class="share-btn twitter">
            <p>Twitter</p>
          </a>`
      case 'facebook':
        return html`
          <a href="//www.facebook.com/sharer/sharer.php?u=${permalink}"
              target="_blank" rel="noopener" class="share-btn facebook">
            <p>Facebook</p>
          </a>`
      case 'pinterest':
        return html`
          <a href="//www.pinterest.com/pin/create/button/?url=${permalink}&amp;description=${title}"
              target="_blank" rel="noopener" class="share-btn pinterest">
            <p>Pinterest</p>
          </a>`
      case 'reddit':
        return html`
          <a href="//www.reddit.com/submit?url=${permalink}&amp;title=${title}"
              target="_blank" rel="noopener" class="share-btn reddit">
            <p>Reddit</p>
          </a>`
      case 'linkedin':
        return html`
          <a href="//www.linkedin.com/shareArticle?url=${permalink}&amp;title=${title}"
              target="_blank" rel="noopener" class="share-btn linkedin">
            <p>LinkedIn</p>
          </a>`
      case 'email':
        return html`
          <a href="mailto:?subject=See post from: ${by}&amp;body=${permalink}"
              target="_blank" class="share-btn email" data-proofer-ignore>
            <p>Email</p>
          </a>`
      case 'vk':
        return html`
          <a href="//vk.com/share.php?url=${permalink}&amp;title=${title}"
              target="_blank" rel="noopener" class="share-btn vk">
            <p>VK</p>
          </a>`
      default:
        return html``
      }
    })
  }

  static get styles() {
    // NOTE! conditional styling based on optional `class="mainline"` in `<bt-share>` element
    return [
      css_normalize(),
      css_links(),
      css`
@charset "UTF-8";
:host {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
  justitfy-content: flex-start;
}
:host(.mainline) {
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-between;
  margin: 1em 1em 0 0;
}
@media (min-width: 768px) {
  :host(.mainline) {
    justify-content: flex-start;
  }
}

:host(.mainline) a {
  width: 4em;
  flex-grow: initial;
  padding: 0.5em;
}

a {
  margin-bottom: 0.5em;
  flex-grow: 1;
  padding: 0;
}
@media (min-width: 768px) {
  a {
    margin-right: 0.25em;
  }
}
a i {
  font-size: 1em;
}
p {
  display: none;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.share-btn {
  font-size: 1.5em;
  border-radius: 4px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  letter-spacing: 0;
  color: white;
  text-align: center;
  transition: background-color 0.2s ease-in-out;
}
.share-btn:active {
  position: relative;
  top: 2px;
  box-shadow: none;
  color: #e6e6e6;
}
.share-btn:hover {
  color: white;
}

/* Share Branding */
.twitter {
  background-color: #00acf0;
}
.twitter:hover {
  background-color: #0087bd;
}
.twitter::before {
  font-family: "Font Awesome 5 Brands";
  content: "";
}

.facebook {
  background-color: #3b5897;
}
.facebook:hover {
  background-color: #2c4272;
}
.facebook::before {
  font-family: "Font Awesome 5 Brands";
  content: "";
}

.linkedin {
  background-color: #0074b3;
}
.linkedin:hover {
  background-color: #005380;
}
.linkedin::before {
  font-family: "Font Awesome 5 Brands";
  content: "";
}

.pinterest {
  background-color: #c7232b;
}
.pinterest:hover {
  background-color: #9c1c22;
}
.pinterest::before {
  font-family: "Font Awesome 5 Brands";
  content: "";
}

.reddit {
  background-color: #ff5500;
}
.reddit:hover {
  background-color: #cc4400;
}
.reddit::before {
  font-family: "Font Awesome 5 Brands";
  content: "";
}

.email {
  background-color: #454545;
  font-weight: 900;
}
.email:hover {
  background-color: #2b2b2b;
}
.email::before {
  font-family: "Font Awesome 5 Free";
  content: "";
}
`,
    ]
  }
})
