import dayjs from 'https://esm.archive.org/dayjs'
import yml from 'https://esm.archive.org/js-yaml'
import { isValidCustomElement, registerCustomElement } from './utils-wc.js'
import {
  getFromContext_DateConversion,
  isContextRequest_DateConveresion,
  isValidContextResponse_DateConversion,
} from './context-date-conversion.js'
import {
  getFromContext_TransformMakup,
  isContextRequest_TransformMakup,
  isValidContextResponse_TransformMakup,
  markdownReplaceYouTubeShortCodes,
} from './context-markup.js'
import { markupParser } from './defaults.js'

/**
 * Our own components, but not loading them just yet.
 */
const OUR_COMPONENTS = [
  ['bt-time', './bt-date-time.js'],
  ['bt-un-markup', './bt-un-markup.js'],
]


const handleContextRequest_DateConversion = (event) => {
  if (isContextRequest_DateConveresion(event)) {
    event.stopPropagation()
    const { date, dateHumanFormat } = getFromContext_DateConversion(event)
    if (typeof date === 'string') {
      const data = dayjs(date)
      const dateUnix = data.unix()
      const dateIsoString = data.toISOString()
      const dateHuman = data.format(dateHumanFormat)
      const payload = { date, dateIsoString, dateUnix, dateHuman }
      isValidContextResponse_DateConversion(payload) && event.callback(payload)
    }
  }
}


const main = async (realm, { components = [] }) => {
  // TODO Allow providing our ^ components and utils

  const selectedComponents = [...OUR_COMPONENTS, ...components]

  for (const [name, path] of selectedComponents) {
    const imported = await import(path)
    const classObj = imported?.default
    const isHtmlElement = isValidCustomElement(classObj)
    if (isHtmlElement) {
      // TODO: detect imported or use ours.
      registerCustomElement(realm, name, classObj)
    }
  }

  // Make this dynamic, based on configured markup parser
  const contentParser = await markupParser()

  const handleContextRequest_TransformMarkup = (event) => {
    if (isContextRequest_TransformMakup(event)) {
      event.stopPropagation()
      const obj = getFromContext_TransformMakup(event)
      const { frontMatterString, markup } = obj
      const html = contentParser.makeHtml(markdownReplaceYouTubeShortCodes(markup))
      const frontMatter = yml.load(frontMatterString)
      Reflect.set(obj, 'html', html)
      Reflect.set(obj, 'frontMatter', frontMatter)
      isValidContextResponse_TransformMakup(obj) && event.callback(obj)
    }
  }

  // TODO Make this configurable(?)
  realm.document.addEventListener('context-request', (event) => {
    // ... and others.
    handleContextRequest_DateConversion(event)
    handleContextRequest_TransformMarkup(event)
  })
}

export default main
