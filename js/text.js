import yml from 'https://esm.ext.archive.org/js-yaml@4.1.0'
import showdown from 'https://esm.ext.archive.org/showdown@2.1.0'

const MD2HTM = new showdown.Converter({ tables: true, simplifiedAutoLink: true })


function markdown_to_html(str) {
  return MD2HTM.makeHtml(
    str.replace(
      // replace any youtube shortcodes
      /{{<\s*youtube\s+([^\s>}]+)\s*>}}/g,
      '<iframe width="848" height="477" src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
    ),
  )
}

function summarize(str, maxlen = 500) {
  const para1 = (str.match(/<p.*?>(.|\n)*?<\/p>/) || [undefined])[0]
  return friendly_truncate(para1 || str, maxlen).replace(/&amp;/g, '&')
}

function summarize_markdown(str, maxlen = 500) {
  return summarize(markdown_to_html(str), maxlen)
}


/**
 * Splits a post/page file into its parsed front matter and markdown body.
 * Shared by the browser and `bin/build.js`, so they always agree.
 *
 * @param {string} markdown  whole file contents
 * @returns {array} [front matter object, markdown body] -- or [undefined, undefined] if unparseable
 */
function markdown_parse(markdown) {
  const chunks = markdown.split('\n---')

  // Normally we are "headless" -- but the optional GH Action SSR step can add a <head> for SEO...
  // Also, another user wanted some arbitrary HTML for the first line, eg: GH-8
  // So skip a top line starting with '<' that is before the frontmater start
  if (chunks[0].trim().startsWith('<')) chunks.shift()

  const front_matter = chunks.shift()
  const body_raw = chunks.join('\n---')

  try {
    const parsed = yml.load(front_matter)
    return [parsed, body_raw]
    /* eslint-disable-next-line no-empty */ // deno-lint-ignore no-empty
  } catch {}

  return [undefined, undefined]
}


// ---------------------------------------------------------------------------------------------
// The functions below were copied verbatim from https://av.archive.org/js/util/strings.js
// on 2026-10-03 -- because that host's robots.txt is `Disallow: /` (since ~mid 2025), so
// Googlebot couldn't load it, which failed our whole ES module graph, so Google saw blank pages.
// ---------------------------------------------------------------------------------------------

/**
 * Returns the string if length < "maxlen" chars; else returns
 * at most "maxlen" chars with "..." postpended, but also walks "backwards"
 * to first <SPACE> char so we don't truncate mid-word!
 *
 * NOTE: assumes UTF-8 by default and is compatible with it (so 🌱 length is 1, not 2, etc.)
 *
 * @param {string} str  String to return or shorten
 * @param {number} maxlen  Maximum length - defaults to 300
 * @param {boolean} full_ok_if_space_before_maxlen - defaults to false
 */
function friendly_truncate(str, maxlen = 300, full_ok_if_space_before_maxlen = false) {
  const chars = [...str]
  if (chars.length <= maxlen)
    return str

  const shorter = chars.slice(0, maxlen).join('')

  // find last <SPACE> char:
  const pos = shorter.lastIndexOf(' ')
  if (pos >= 0) {
    if (full_ok_if_space_before_maxlen)
      return str

    return `${shorter.slice(0, pos)}...`
  }

  return `${chars.slice(0, maxlen - 2).join('')}..`
}


/**
 * Sorts a hashmap by keys in reverse order
 *
 * @param {object} map  hashmap of keys/vals
 * @returns {object} copy, key sorted
 */
function krsort(map) {
  // eslint-disable-next-line
  return Object.keys(map).sort().reverse().reduce((ary, key) => (ary[key] = map[key], ary), {})
}


/**
 * Sorts a hashmap by values -- like PHP `asort()`
 * HOWEVER input keys that are numbers come back with SPACE appended :(
 * (due to limitations on JS objects)
 *
 * @param {object} map  hashmap of keys/vals
 * @param {boolean} reverse  truthy will sort in reverse/descending direction
 * @returns {object} copy, value sorted
 */
function vsort(map, reverse = false) {
  // make an array of [key, val] pairs, and then sort by value
  const kv = Object.entries(map)

  if (reverse) {
    kv.sort((a, b) => (a[1] < b[1] ? 1 : (a[1] > b[1] ? -1 : 0)))
  } else {
    kv.sort((a, b) => (a[1] > b[1] ? 1 : (a[1] < b[1] ? -1 : 0)))
  }

  // now take the sorted _tuples_ (of [key, val]) and insert into fresh object
  const ret = {}
  for (const keyval of Object.values(kv)) {
    // NOTE: numeric (even as strings) throw off the insert order :(
    const [k, val] = keyval
    const key = k.concat(k.match(/^\d+$/) ? ' ' : '')
    ret[key] = val
  }

  return ret
}


/**
 * Sorts a hashmap by values in reverse order -- like PHP `arsort()`
 * HOWEVER input keys that are numbers come back with SPACE appended :(
 * (due to limitations on JS objects)
 *
 * @param {object} map  hashmap of keys/vals
 * @returns {object} copy, value sorted
 */
function vrsort(map) {
  return vsort(map, true)
}


export {
  markdown_to_html, summarize, summarize_markdown, markdown_parse,
  friendly_truncate, krsort, vsort, vrsort,
}
