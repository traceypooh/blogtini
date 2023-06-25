/**
 * Normally "boolean" attribute on HTML elements is when
 * the attribute is there or not.
 *
 * @param {*} input
 * @returns
 */
export const isNotNullOrEmptyString = (input) =>
  typeof input === 'string' && input !== '' && input !== 'null'

// TODO: FIXME
export const isValidCustomElement = (classObj) => {
  const prototypeOf = Object.getPrototypeOf(classObj)
  return prototypeOf.name === 'HTMLElement'
}

export const assertIsValidCustomElementName = (
  elementName /*: string */ = '',
) /*: assert is ... */ => {
  if (/^[a-z]([\w\d-])+$/.test(elementName) === false) {
    const message = `Invalid element name "${elementName}", it must only contain letters and dash.`
    throw new Error(message)
  }
}

export const registerCustomElement = (
  { customElements },
  elementName = '',
  elementClass = class SomeBogusElement extends Error {},
) => {
  assertIsValidCustomElementName(elementName)
  if (!customElements.get(elementName)) {
    customElements.define(elementName, elementClass)
  } else {
    const message = `ERR customElements.define <${elementName} />, already defined.`
    throw new Error(message)
  }
}
