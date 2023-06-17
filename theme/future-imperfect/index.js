import { css, unsafeCSS } from 'https://esm.archive.org/lit'
import { dark_mode } from '../../js/blogtini.js'

import './bt-body.js'
import './bt-sidebar.js'
import './bt-posts.js'
import './bt-post.js'
import './bt-post-full.js'
import './bt-post-mini.js'
import './bt-post-header.js'
import './featured-image.js'
import './post-stats.js'


function css_buttons() {
  const xxx = dark_mode() ? `
.button {
  color: #ddd;
  background-color: #111;
}
` : ''

  return css`
.button {
  background-color: transparent;
  border: 1px solid rgba(161, 161, 161, 0.3);
  color: #3b3a3a;
  cursor: pointer;
  display: inline-block;
  font-family: "Raleway", Helvetica, sans-serif;
  font-size: 0.6em;
  font-weight: 800;
  height: 4.8125em;
  letter-spacing: 0.25em;
  line-height: 4.8125em;
  margin: auto;
  padding: 0 2em;
  transition: background-color 0.2s ease-in-out, border 0.2s ease-in-out, color 0.2s ease-in-out;
  text-align: center;
  text-transform: uppercase;
  width: fit-content;
}

input[type="submit"]:hover,
input[type="reset"]:hover,
input[type="button"]:hover,
.button:hover {
  border: 1px solid #2eb8ac;
  color: #2eb8ac !important;
}

input[type="submit"]:hover:active,
input[type="reset"]:hover:active,
input[type="button"]:hover:active,
.button:hover:active {
  background-color: rgba(46, 184, 172, 0.05);
}

${unsafeCSS(xxx)}
`
}

function css_links() {
  return css`
a {
  border-bottom: 1px dotted rgba(161, 161, 161, 0.7);
  color: inherit;
  text-decoration: none;
  transition: border-bottom-color 0.2s ease-in-out, color 0.2s ease-in-out;
}
a:hover {
  border-bottom-color: transparent;
  color: #2eb8ac;
}`
}

function css_headers() {
  const color = dark_mode() ? '#ddd' : '#3b3a3a'

  return css`
h1,
h2,
h3,
h4,
h5,
h6 {
  color: ${unsafeCSS(color)};
  font-family: "Raleway", Helvetica, sans-serif;
  letter-spacing: 0.25em;
  line-height: 1.65;
  text-transform: uppercase;
}
h1 a,
h2 a,
h3 a,
h4 a,
h5 a,
h6 a {
  border-bottom: 0;
}
p,
h2,
h3 {
  orphans: 3;
  widows: 3;
}
h2,
h3 {
  page-break-after: avoid;
}

/**
 * Correct the font size and margin on <h1> elements within <section> and
 * <article> contexts in Chrome, Firefox, and Safari.
 */
h1 {
  font-size: 2em;
  margin: 0.67em 0;
}
`
}

function css_post() {
  return css`
.post {
  background: white;
  margin: 1.5em auto;
  padding: 1em;
  max-width: 55em;
}

.post > div > p,
.post > p {
  text-align: justify;
}

/* OVERRIDES TO FUTURE IMPERFECT ORIGINAL THEME */

/* ensure lists-of-posts pages dont blow out main column width with "long words" in preview */
.post .content {
  /* this seems to work v. nicely in modern firefox, chrome, safari, iOS */
  word-break: initial;    /* first, try to break up *in between* words if we gonna overflow... (this needed for firefox, since will toss next line) */
  word-break: break-word; /* first, try to break up *in between* words if we gonna overflow... (works better in chrome) */
  word-wrap:  break-word; /* ... and if still overflowing, *then* split indiv. words up ... */
  -webkit-hyphens: auto;  /* safari, you just rock! (and copy/paste works nicely too!) */
  -moz-hyphens: auto;
  hyphens: auto;
}
`
}


function css_title() {
  return css`
  .title {
    font-size: 1.1em;
    width: 100%;
  }
  @media (min-width: 768px) {
    .title {
      width: 75%;
    }
  }
  `
}


function css_footer() {
  return css`
footer {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
}
footer .button { /* xxx was .post footer .button */
  margin: 1em auto;
  width: 100%;
}
`
}


function css_dark() {
  if (!dark_mode())
    return css``

  return css`
#site-header,
#site-header .flyout-menu,
#site-nav-menu,
.mini-post header,
.content table,
.single  table,
.button {
  color: #ddd;
  background-color: #111;
}
.content table th,
.content table tr:nth-child(even),
.single  table th,
.single  table tr:nth-child(even) {
  color: #ddd;
  background-color: #222;
}
.content table tbody tr td,
.single  table tbody tr td {
  background-color: transparent;
}

article.post,
article .post,
.mini-post,
article.comment header {
  color: #ddd;
  background-color: #222;
}
.pagination a,
.asciiover pre,
#comment-form input,
#comment-form textarea,
#contact input,
#contact textarea {
  color: #ddd;
}
img {
  filter: grayscale(50%);
}

a {
  color: inherit;
}
`
}

export {
  css_buttons,
  css_headers,
  css_links,
  css_dark,
  css_footer,
  css_post,
  css_title,
}
