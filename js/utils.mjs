/**
 * A BaseURL should start by a protocol, and end by a slash.
 * Otherwise appending things at the end of it might make unintended invalid paths.
 */
export const isBaseUrlWithEndingSlash = (url) => {
  return /^(https?|file)\:.*\/$/.test(url)
}

export const assertBaseUrlWithEndingSlash = (url) => {
  if (isBaseUrlWithEndingSlash(url) === false) {
    const message = `Invalid baseURL, it MUST begin by a protocol, and end by a slash, we got: "${url}"`
    throw new Error(message)
  }
}

/**
 * Check if the begining of the URL provided matches the production.
 */
export const isBaseUrlHostForProduction = (
  siteRootBaseUrl,
  compareWith = '',
) => {
  assertBaseUrlWithEndingSlash(siteRootBaseUrl)
  const regEx = new RegExp('^' + siteRootBaseUrl)
  const match = (compareWith ?? '').match(regEx)
  return match !== null
}

/**
 * During development, we might still want to read files from current development host
 * not production.
 */
export const adjustProductionBaseUrlForDevelopment = (
  input,
  productionSiteRootBaseUrl,
  siteRootBaseUrl = '',
) => {
  console.log('adjustProductionBaseUrlForDevelopment', {
    input,
    productionSiteRootBaseUrl,
    siteRootBaseUrl,
  })
  // Question:
  // Check if input starts the same as productionSiteRootBaseUrl,
  // so we're not scratching our heads why things aren't the same locally
  // and once deployed
  // assertBaseUrlWithEndingSlash(productionSiteRootBaseUrl)
  // assertBaseUrlWithEndingSlash(siteRootBaseUrl)
  const replaced = input.replace(
    new RegExp('^' + productionSiteRootBaseUrl),
    siteRootBaseUrl,
  )
  console.log('adjustProductionBaseUrlForDevelopment', {
    productionSiteRootBaseUrl,
    siteRootBaseUrl,
    replaced,
  })
  return replaced
}

export const createBlogtiniEvent = (eventName, detail = {}) => {
  const event = new CustomEvent('blogtini', {
    bubbles: true,
    composed: true,
    detail: { eventName, ...detail },
  })
  return event
}

export const createBlogtiniStuffWrapper = (host, id) => {
  const wrapper = host.createElement('div')
  wrapper.setAttribute('id', id)
  wrapper.setAttribute('class', 'blogtini-stuff')
  return wrapper
}

/**
 * Utility for custom elements in getters
 */
export const isNotNullOrStringEmptyOrNull = (input) =>
  typeof input === 'string' && input !== '' && input !== 'null'

/**
 * Basically just take anything inside the body and put it all
 * inside an #original-content
 */
export const cleanUpInitialPayloadMarkup = (host) => {
  const wrapper = createBlogtiniStuffWrapper(host, 'blogtini-original-content')
  wrapper.setAttribute('style', 'display:none;')
  wrapper.append(...host.body.childNodes)
  host.body.appendChild(wrapper)
  wrapper.querySelectorAll('.blogtini-stuff').forEach((e) => {
    host.body.appendChild(e)
  })
  host.body.firstChild.dispatchEvent(
    createBlogtiniEvent('original-content-moved'),
  )
}

/**
 * Take a string, return an array of two strings.
 *
 * - front-matter
 * - the contents
 *
 * Beware, in DOM, to get unescaped HTML Entities, it's best to use
 * textContent.
 */
export const splitFrontMatterAndMarkdown = (contents) => {
  // RBx: Maybe instead pass document here
  // const contents = document.getElementsByTagName('body')[0].textContent
  // const html = document.getElementsByTagName('body')[0].innerHTML.slice('\n').slice(fenceLineIndexes[1]).join('\n') ?? ''

  // If it starts by a front matter, it's (probably) Markdown
  const maybeFrontMatter = (contents ?? '').substring(3, 0)
  if (/---/.test(maybeFrontMatter) === false) {
    const message = `Invalid document: We do not have a front-matter marker starting exactly at line 0`
    throw new Error(message)
  }
  const lines = (contents ?? '').split('\n')
  const firstLines = lines.slice(0, 50)
  const fenceLineIndexes = []
  firstLines.forEach((element, idx) => {
    const isExactlyThreeDash = /^---$/.test(element)
    if (isExactlyThreeDash) {
      fenceLineIndexes.push(idx)
    }
  })
  if (fenceLineIndexes.length !== 2) {
    const message = `Invalid document: We do not have a closing front-matter marker within the first 50 lines`
    throw new Error(message)
  }
  if (fenceLineIndexes[0] !== 0) {
    const message = `Invalid document: we expect that the front-matter to start at the first line`
    throw new Error(message)
  }
  if (fenceLineIndexes[1] < 1) {
    const message = `Invalid document: we expect a front-matter with a few lines`
    throw new Error(message)
  }

  const frontMatter = lines.slice(1, fenceLineIndexes[1]).join('\n') ?? ''
  const rest = lines.slice(fenceLineIndexes[1]).join('\n') ?? ''

  return [frontMatter, rest]
}

export const getTextFromHtmlizedText = (innerHTML) => {
  const node = document.createElement('div')
  node.innerHTML = String(innerHTML)
  // Let's remove code from contents.
  node.querySelectorAll('script,pre,style,code').forEach((what) => {
    what.remove()
  })
  node.textContent = node.textContent.replace(/\s/g, ' ').trim()
  return node
}

export function debounce(cb, interval, immediate) {
  var timeout

  return function () {
    var context = this,
      args = arguments
    var later = function () {
      timeout = null
      if (!immediate) cb.apply(context, args)
    }

    var callNow = immediate && !timeout

    clearTimeout(timeout)
    timeout = setTimeout(later, interval)

    if (callNow) cb.apply(context, args)
  }
}
