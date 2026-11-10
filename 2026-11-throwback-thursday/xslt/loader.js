// throwback: index.xml --(shell.xsl)--> HTML shell --(this)--> showdown --> page
import showdown from 'https://esm.archive.org/showdown@2.1.0'
import yml from 'https://esm.archive.org/js-yaml@4.1.0'

const pre = document.getElementById('md')
const txt = pre.textContent.trim()
const [, fm, md] = txt.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [null, '', txt]
const meta = yml.load(fm) ?? {}

showdown.setFlavor('github')
const main = document.createElement('main')
const h1 = document.createElement('h1')
h1.textContent = meta.title ?? ''
main.append(h1)
main.insertAdjacentHTML('beforeend', new showdown.Converter().makeHtml(md))
if (meta.title) document.title = meta.title
pre.replaceWith(main)
