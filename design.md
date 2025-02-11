# index.html
```html
<h1>Search Results</h1>

<script type="module" src="./theme.js"></script>
```


# theme.js
```js
import 'https://blogtini.com/index.js'
import 'https://blogtini.com/js/theme/future-imperfect/index.js'
  ↘ import './bt-body.js'
  ↘️ import './bt-posts.js'
  ↘️ import './bt-post.js'

document.write(`
<bt-body>

  <bt-posts>
    <slot>
      <bt-post url="js-is-awesome/"></bt-post>
      <bt-post url="favorite-space-disaster-movies/"></bt-post>
    </slot>
  <bt-posts>

  <bt-header>
  </bt-header>

  <bt-sidebar>
    <bt-site-intro
      avatar="https://traceypooh.github.io/blogtini/img/blogtini.png">
    </bt-site-intro>

    <bt-tags histogram='{"biking":10,"es-modules":66}'>
    </bt-tags>

    <bt-categories histogram='{"pictures":3,"technical ideas":13}'>
    </bt-categories>

    <bt-recent-posts>
      <bt-post url="js-is-awesome/"></bt-post>
      <bt-post url="80s-sitcoms/"></bt-post>
    </bt-recent-posts>

    ...
  </bt-sidebar>

  <bt-footer>
  <bt-footer>


</bt-body>
`)
```


# bt-body.js
```js
import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'

customElements.define('bt-body', class extends LitElement {
  static get styles() {
    return css`
:host {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-areas:
    "bt-header   bt-header"
    "bt-sidebar  bt-posts"
    "bt-sidebar  bt-footer";
  grid-template-rows: 60px 1fr 40px;
  grid-template-columns: 150px 1fr;
}

@media (max-width: 768px) {
  :host {
    grid-template-areas:
      "bt-header"
      "bt-posts"
      "bt-sidebar"
      "bt-footer";
    grid-template-rows: 60px auto auto 40px;
    grid-template-columns: 1fr;
  }
}
`
  }

  render() {
    return html`<slot></slot>`
  }
})
```


# bt-posts.js
```js
import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'

customElements.define('bt-posts', class extends LitElement {
  static get styles() {
    return css`
:host {
  grid-area: bt-posts;
}
`
  }

  render() {
    return html`<slot></slot>`
  }
})
```


# bt-post.js
```js
import { url2post, markdown_to_html } from 'https://blogtini.com/index.js'
import { LitElement, html } from 'https://esm.ext.archive.org/lit@3.2.1'

customElements.define('bt-post', class extends LitElement {
  render() {
    const post = url2post(this.url)

    return html`
  <article class="post">
    <header>
      ${post.title}
    </header>

    ${markdown_to_html(post.body_raw)}
  </article>
  `
  }
})
```



