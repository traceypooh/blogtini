import dayjs from 'https://esm.archive.org/dayjs'
import { isValidCustomElement, registerCustomElement } from './utils-wc.js'
import {
  getFromContext_DateConversion,
  isContextRequest_DateConveresion,
  isValidContextResponse_DateConversion,
} from './context-date-conversion.js'

/**
 * Our own components, but not loading them just yet.
 */
const OUR_COMPONENTS = [
  ['bt-time', './bt-date-time.js'],
]

const handleContextRequest_DateConversion = (event) => {
  const test = isContextRequest_DateConveresion(event)
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

  // TODO Make this configurable(?)
  realm.document.addEventListener('context-request', (event) => {
    // ... and others.
    handleContextRequest_DateConversion(event)
  })
}

export default main
