import showdown from 'https://esm.archive.org/showdown'
import { friendly_truncate } from 'https://av.prod.archive.org/js/util/strings.js'

const MD2HTM = new showdown.Converter({ tables: true, simplifiedAutoLink: true })


function markdown_to_html(str) {
  return MD2HTM.makeHtml(str)
}

function summarize(str, maxlen = 500) {
  const para1 = (str.match(/<p.*?>(.|\n)*?<\/p>/) || [undefined])[0]
  return friendly_truncate(para1 || str, maxlen).replace(/&amp;/g, '&')
}

function summarize_markdown(str, maxlen = 500) {
  return summarize(markdown_to_html(str), maxlen)
}

export { markdown_to_html, summarize, summarize_markdown }
