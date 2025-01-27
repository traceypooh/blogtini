import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'
import { fetcher, state } from '../../js/blogtini.js'
import {
  css_dark, css_headers, css_buttons, css_post, css_forms,
} from './index.js'


customElements.define('bt-comments', class extends LitElement {
  static get properties() {
    return {
      entryid: { type: String },
      comments: { type: Object },
    }
  }

  render() {
    if (typeof this.comments === 'undefined') {
      // use a default base in case url is relative (pathname) only
      this.comments_get(this.entryid).then(
        (comments) => {
          this.comments = comments
        },
      )
    }

    if (this.comments && this.comments.length) {
      this.comments_insert()
      import('../../js/staticman.js') // xxxxxx move into this class
    }

    return html`
  <div class="comments post">
    <div>
      <h2 id="say-something">Say Something</h2>
      <form id="comment-form" class="new-comment" method="POST">
        <h3 class="reply-notice hidden">
          <span class="reply-name"></span>
          <a class="reply-close-btn button"><i class="fas fa-times"></i></a>
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

        <button type="button" id="comment-form-submit" class="button">Submit</button>
        <button type="button" id="comment-form-submitted" class="hidden button" disabled="">Submitted</button>
        <button type="reset"  id="comment-form-reset" class="button">Reset</button>
      </form>
    </div>


    <div class="comments-container">
      <h2>Comments</h2>
      ${this.comments && this.comments.length ? '' : '<p>Nothing yet.</p>'}
    </div>
  </div>`
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
    // eslint-disable-next-line no-empty
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


  /**
   * @param {string} path
   */
  async comments_get(path) {
    let posts_with_comments
    try {
      posts_with_comments = (await fetcher(`${state.top_dir}comments/index.txt`))?.split('\n')
      /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
    } catch {}
    if (!posts_with_comments?.includes(path))
      return []

    // oldest comments (or oldest in a thread) first
    return (await fetcher(`${state.top_dir}comments/${path}/index.json`))?.filter((e) => Object.keys(e).length).sort((a, b) => a.date < b.date).map((e) => {
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


  static get styles() {
    return [
      css_buttons(),
      css_headers(),
      css_post(),
      css_forms(),
      css`
#comment-form input,
#comment-form textarea {
  box-sizing: border-box;
}

.hidden { display: none !important }

/* Staticman Comments - Form */
.new-comment.loading {
  opacity: 0.5; }

.new-comment .reply-notice .comment-avatar {
  width: 2em;
  height: 2em;
  margin: 0 0.6em; }

.new-comment .reply-notice .reply-close-btn {
  padding: unset;
  border: none;
  vertical-align: top;
  font-size: 1em;
  line-height: 0;
  height: 0; }
  .new-comment .reply-notice .reply-close-btn:hover {
    border: none; }

.new-comment .reply-notice .reply-name {
  vertical-align: middle; }
  .new-comment .reply-notice .reply-name::before {
    font-family: "Font Awesome 5 Free";
    font-weight: 900;
    content: "\f3e5";
    margin-right: .5em;
    width: 20px; }

.submit-success {
  border: 1px solid #2eb8ac;
  background: rgba(46, 184, 172, 0.25); }

.submit-failed {
  border: 1px solid #b82e6e;
  background: rgba(184, 46, 110, 0.25); }

/* Staticman Comments - Content */
.comment header {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  background: #ededed;
  align-items: center;
  border-radius: 50px 0 0 50px; }
  @media (min-width: 375px) {
    .comment header {
      border-radius: 0; } }
  .comment header div {
    display: -webkit-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    align-items: center; }
    @media (min-width: 375px) {
      .comment header div {
        flex-direction: row; } }
.comment.comment-reply {
  margin-left: 1.875em; }
  @media (min-width: 375px) {
    .comment.comment-reply {
      margin-left: 3.75em; } }
.comment-author-container {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center; }
  @media (min-width: 375px) {
    .comment-author-container {
      align-items: flex-start;
      flex-grow: 1; } }
  @media (min-width: 768px) {
    .comment-author-container {
      flex-direction: row;
      align-items: center; } }
.comment-avatar {
  margin: 0 0 0 1em;
  width: 3.75em;
  height: 3.75em;
  flex-grow: 0; }
  @media (min-width: 375px) {
    .comment-avatar {
      margin: 0 .5em 0 0; }
      .comment-avatar.circle {
        -webkit-clip-path: none;
        clip-path: none; } }
.comment-author {
  font-size: 0.9em;
  margin: 0; }
  @media (min-width: 768px) {
    .comment-author {
      margin-right: .5em;
      padding-right: .5em;
      border-right: 1px solid rgba(161, 161, 161, 0.3); } }
.comment-reply-btn {
  border: 0; }
  .comment-reply-btn::before {
    font-family: "Font Awesome 5 Free";
    font-weight: 900;
    content: "\f3e5";
    margin-right: .5em;
    width: 20px; }
  @media (min-width: 375px) {
    .comment-reply-btn {
      margin-right: 1.5em; } }
.comment-content {
  margin: 1em; }

/* TODO: Assess Value
  .reply-target {
    font-size: 0.9em;
    border: 0;
    &::before {
      font-family: $fa-free-font;
      font-weight: 900;
      content: "\f3e5";
      margin-right: .5em;
      width: 20px;
    }
  }
*/`,
      css_dark(),
    ]
  }
})
