import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import { fetcher, state, cfg } from '../../index.js'
import {
  css_headers, css_buttons, css_post, css_forms, css_normalize, css_fontawesome,
} from './index.js'


customElements.define('bt-comments', class extends LitElement {
  static get properties() {
    return {
      entryid: { type: String },
      comments: { type: Object },
    }
  }

  render() {
    if (typeof this.comments === 'undefined')
      this.comments_get()

    if (this.comments && this.comments.length)
      this.comments_insert()

    return html`
  <div class="comments post">
    <div>
      <h2 id="say-something">Say Something</h2>
      <form id="comment-form" class="new-comment" method="POST">
        <h3 class="reply-notice hidden">
          <span class="reply-name"></span>
          <a class="reply-close-btn button" @click=${this.resetReplyTarget}><i class="fas fa-times"></i></a>
        </h3>

        <input type="hidden" name="options[entryId]" value="${this.entryid}">
        <input type="hidden" name="fields[replyID]"  value="">

        <input required="" name="fields[name]" type="text" placeholder="Your Name">
        <input name="fields[website]" type="text" placeholder="Your Website">
        <input required="" name="fields[email]" type="email" placeholder="Your Email">
        <textarea required="" name="fields[body]" placeholder="Your Message" rows="10"></textarea>

        <div class="submit-notice">
          <strong class="submit-notice-text submit-success hidden">Thanks for your comment! It will be shown on the site once it has been approved.</strong>
          <strong class="submit-notice-text submit-failed hidden">Sorry, there was an error with your submission. Please make sure all required fields have been completed and try again.</strong>
        </div>

        <button type="button" id="comment-form-submit" class="button" @click=${this.submitted}>Submit</button>
        <button type="button" id="comment-form-submitted" class="hidden button" disabled="">Submitted</button>
        <button type="reset"  id="comment-form-reset" class="button" @click=${this.clearForm}>Reset</button>
      </form>
    </div>


    <div class="comments-container">
      <h2>Comments</h2>
      ${this.comments && this.comments.length ? '' : html`<p>Nothing yet.</p>`}
    </div>
  </div>`
  }

  /**
   * handles evnets from <bt-comment> children
   * @param {*} event
   */
  events_handler(event) {
    if (event.type === 'bt-comment-reply-clicked') {
      // console.log(this, `comment reply event: ${event.detail.id} by ${event.detail.author}`)

      const form = this.find_form()
      this.resetReplyTarget()
      form.querySelector('input[name="fields[replyID]"]').value = event.detail.id

      // display reply name
      form.querySelector('.reply-notice').classList.remove('hidden')
      form.querySelector('.reply-name').innerText = event.detail.author
    }
  }

  /**
   * Dynamically attaches event listener for all bt-comment events
   */
  connectedCallback() {
    super.connectedCallback()
    this.addEventListener('bt-comment-reply-clicked', this.events_handler)
  }

  /**
   * Cleans up event listener when the component is removed
   */
  disconnectedCallback() {
    super.disconnectedCallback()
    this.removeEventListener('bt-comment-reply-clicked', this.events_handler)
  }

  /**
   * Cleverly use DOM to add (potentially nested) comment elements into a div
   * -- because threading replies (and replies of replies) gets complicated suuuuper quick
   */
  comments_insert() {
    // loop over comments, appending each into the right parent, until all are added
    // (or no more addable if corrupted / invalid parent pointer).
    // The comments can be in any order -- so a reply to a parent might be seen befor the parent.
    // So we will loop over list of comments and insert what we can, repeatedly.
    // We know we are done when a loop over any remaining comments to insert ends up inserting 0.
    /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
    while (this.comments.reduce((sum, e) => sum + this.comment_insert(e), 0)) {}

    for (const com of this.comments) {
      // eslint-disable-next-line no-console
      if (com.id) console.error('Comment orphaned', com)
    }
  }

  /**
   * Adds a comment into DOM, finding the right parent for threaded comments, etc.
   * @param {object} com
   * @returns {number} 0 or 1 comments added
   */
  comment_insert(com) {
    if (!com.id) return 0
    const e = document.createElement('bt-comment')
    for (const [k, v] of Object.entries(com))
      e.setAttribute(k, v) // xxxcc JSON.stringify(v))

    const addto = com.replyID
      ? this.shadowRoot.getElementById(com.replyID)
      : this.shadowRoot.querySelector('.comments-container')
    if (!addto)
      return 0 // *should* never happen -- but cant find parent for this comment's `replyID`

    addto.appendChild(e)

    // eslint-disable-next-line no-param-reassign
    delete com.id
    return 1
  }


  async comments_get() {
    let posts_with_comments
    try {
      posts_with_comments = (await fetcher(`${state.top_dir}comments/index.txt`))?.split('\n')
      /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
    } catch {}
    if (!posts_with_comments?.includes(this.entryid)) {
      this.comments = []
      return
    }

    // oldest comments (or oldest in a thread) first
    this.comments = (await fetcher(`${state.top_dir}comments/${this.entryid}/index.json`))?.filter((e) => Object.keys(e).length).sort((a, b) => a.date < b.date).map((e) => {
      // delete any unused keys in each comment hashmap
      for (const [k, v] of Object.entries(e)) {
        if (v === '' || v === undefined || v === null)
          delete e[k]
        if (!['id', 'name', 'email', 'date', 'website', 'replyID', 'body'].includes(k))
          delete e[k]
      }
      return e
    })
  }

  find_form() {
    return this.shadowRoot.querySelector('.new-comment')
  }

  submitted() {
    const form = this.find_form()
    form.classList.add('loading')
    form.querySelector('#comment-form-submit').classList.add('hidden') // hide "submit"
    form.querySelector('#comment-form-submitted').classList.remove('hidden') // show "submitted"

    // Construct form action URL from JS to avoid spam
    const url = (
      ['https:/', cfg.staticman.api, 'v3/entry', cfg.git_provider, cfg.user, cfg.repo, cfg.staticman.branch, 'comments'].join('/')
    ).replace(/^https:\/\/http:\/\//, 'http://')

    // Convert form fields to a JSON-friendly string
    const formObj = Object.fromEntries(new FormData(form))
    const xhrObj = { fields: {}, options: {} }
    Object.entries(formObj).forEach(([key, value]) => {
      const a = key.indexOf('[')
      const b = key.indexOf('reCaptcha')
      if (a === -1) { // key = "g-recaptcha-response"
        xhrObj[key] = value
      } else if (a === 6 || (a === 7 && b === -1)) { // key = "fields[*]", "options[*]"
        xhrObj[key.slice(0, a)][key.slice(a + 1, -1)] = value
      } else { // key = "options[reCaptcha][*]"
        // define xhrObj.options.reCaptcha if it doesn't exist
        xhrObj.options.reCaptcha = xhrObj.options.reCaptcha || {}
        xhrObj.options.reCaptcha[key.slice(b + 11, -1)] = value
      }
    })
    const formData = JSON.stringify(xhrObj)  // some API don't accept FormData objects

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const { status } = xhr
        if (status >= 200 && status < 400) {
          this.showAlert(form, 'success')
          setTimeout(() => { this.clearForm() }, 3000) // display success message for 3s
          form.classList.remove('loading')
        } else {
          this.showAlert(form, 'failed')
          form.classList.remove('loading')
        }
      }
    }
    xhr.send(formData)
  }

  // eslint-disable-next-line class-methods-use-this
  showAlert(form, msg) {
    if (msg === 'success') {
      form.querySelector('.submit-success').classList.remove('hidden')  // show submit success message
      form.querySelector('.submit-failed').classList.add('hidden') // hide submit failed message
    } else {
      form.querySelector('.submit-success').classList.add('hidden') // hide submit success message
      form.querySelector('.submit-failed').classList.remove('hidden')  // show submit failed message
    }
    form.querySelector('#comment-form-submit').classList.remove('hidden') // show "submit"
    form.querySelector('#comment-form-submitted').classList.add('hidden')  // hide "submitted"
  }

  resetReplyTarget() {
    const form = this.find_form()
    form.querySelector('.reply-notice .reply-name').innerText = ''
    form.querySelector('.reply-notice').classList.add('hidden') // hide reply target display
    // empty all hidden fields whose name starts from "reply"
    // eslint-disable-next-line no-return-assign
    Array.from(form.elements).filter((e) => e.name.indexOf('fields[reply') === 0).forEach((e) => e.value = '')
  }

  // empty all text & hidden fields but not options
  clearForm() {
    this.resetReplyTarget()
    const form = this.find_form()
    form.querySelector('.submit-success').classList.add('hidden') // hide submission status
    form.querySelector('.submit-failed').classList.add('hidden') // hide submission status
  }

  static get styles() {
    return [
      css_normalize(),
      css_fontawesome(),
      css_buttons(),
      css_headers(),
      css_post(),
      css_forms(),
      css`
@charset "UTF-8";
#comment-form input,
#comment-form textarea {
  box-sizing: border-box;
}

.hidden { display: none !important }

/* Staticman Comments - Form */
.new-comment.loading {
  opacity: 0.5;
}
.new-comment .reply-notice .comment-avatar {
  width: 2em;
  height: 2em;
  margin: 0 0.6em;
}
.new-comment .reply-notice .reply-close-btn {
  padding: unset;
  border: none;
  vertical-align: top;
  font-size: 1em;
  line-height: 0;
  height: 0;
}
.new-comment .reply-notice .reply-close-btn:hover {
  border: none;
}
.new-comment .reply-notice .reply-name {
  vertical-align: middle;
}
.new-comment .reply-notice .reply-name::before {
  font-family: "Font Awesome 5 Free";
  font-weight: 900;
  content: "\\f3e5";
  margin-right: .5em;
  width: 20px;
}

.submit-success {
  border: 1px solid #2eb8ac;
  background: rgba(46, 184, 172, 0.25);
}
.submit-failed {
  border: 1px solid #b82e6e;
  background: rgba(184, 46, 110, 0.25);
}
`,
    ]
  }
})
