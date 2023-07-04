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
 * like php `ucwords()` - uppercase the first letter of each 'word'
 *
 * @param {string} str  Input string
 */
function ucwords(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}


/**
 * Replace strings withing a string, using a hashmap of froms/tos.
 * Similar to an improved `str_replace()` from PHP.
  *
 * poached and heavily modified from https://stackoverflow.com/a/34560648
 *
 * @param {object} map  Hashmap of strings to find, mapped to their replacements
 * @param {string} str  Input string
 */
function str_replace(map, str) {
  if (typeof str === 'undefined') return ''

  const froms = Object.keys(map)
  const tos = Object.values(map)

  return (typeof str === 'string' ? str : String(str)).replace(
    new RegExp(
      `(${froms.map((i) => i.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&')).join('|')})`,
      'g',
    ),
    (i) => tos[froms.indexOf(i)],
  )
}


/**
 * Removes HTM tags from strings - similar to strip_tags() php version -- chexx this replace from
  //   https://css-tricks.com/snippets/javascript/strip-html-tags-in-javascript/
 * @param {string} str  input string
 */
function strip_tags(str) {
  return str.replace(/(<([^>]+)>)/g, '').trim()
}


/**
 * Sorts a hashmap by keys
 *
 * @param {object} map  hashmap of keys/vals
 * @returns {object} copy, key sorted
 */
function ksort(map) {
  // eslint-disable-next-line
  return Object.keys(map).sort().reduce((ary, key) => (ary[key] = map[key], ary), {})
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
 * Sorts a hashmap by values.
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
    /* eslint-disable-next-line no-nested-ternary */
    kv.sort((a, b) => (a[1] < b[1] ? 1 : (a[1] > b[1] ? -1 : 0)))
  } else {
    /* eslint-disable-next-line no-nested-ternary */
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
 * Sorts a hashmap by values in reverse order.
 * HOWEVER input keys that are numbers come back with SPACE appended :(
 * (due to limitations on JS objects)
 *
 * @param {object} map  hashmap of keys/vals
 * @returns {object} copy, value sorted
 */
function vrsort(map) {
  return vsort(map, true)
}


/**
 * Returns a (copy of) hashmap or array with its swaps keys and vals.
 * NOTE: non-unique values get uniqued to single key (last key/value with same value trumps)
 * NOTE: arrays will change numeric values to string counterpart keys
 *
 * @param {object} map
 * @returns {object}
 */
function array_flip(map) {
  const ret = {}
  // eslint-disable-next-line
  Object.entries(map).map((e) => { ret[e[1]] = e[0] })
  return ret
}


/**
 * Returns a hashmap/object, using passed in array for its keys
 * @param {string[]} ary  list of keys
 * @param {any} val  optional value - o/w null values
 * @returns {object}
 */
function map_from_keys(ary, val = null) {
  const ret = {}
  // eslint-disable-next-line
  Object.entries(ary).map((e) => { ret[e[1]] = val })
  return ret
}


/**
 * Removes lead/trail whitespace and turns inner whitespace sequences to single [SPACE] char
 *
 * @param {string} str
 * @returns {string} cleaned string
 */
function killspace(str) {
  return str.trim().replace(/[\s]+/g, ' ')
}

export {
  array_flip, friendly_truncate, killspace, ksort, krsort, map_from_keys,
  strip_tags, str_replace, ucwords, vsort, vrsort,
}
